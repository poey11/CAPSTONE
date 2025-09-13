/**
 * One-shot setup from files (entities + intents + routes + Services page).
 * Run: npm run sync:all:files
 *
 * Requires .env with:
 *  PROJECT_ID, LOCATION, AGENT_ID, LANGUAGE_CODE (optional), GOOGLE_APPLICATION_CREDENTIALS
 *
 * Reads JSON from tools/cx-training/data:
 *  - doc_bases.json
 *  - doc_variants_by_base.json
 *  - requirements.json
 *  (Optional) replies.compiled.json (if present, we’ll prefer its text)
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import {
  FlowsClient,
  PagesClient,
  TransitionRouteGroupsClient,
  EntityTypesClient,
  IntentsClient,
  protos,
} from "@google-cloud/dialogflow-cx";
import { cxConfig } from "./auth.js";

/* -------------------- ENV toggles -------------------- */
const OVERWRITE_GROUPS = (process.env.OVERWRITE_GROUPS ?? "true") === "true";
const CREATE_STATIC_REQ_INTENTS =
  (process.env.CREATE_STATIC_REQ_INTENTS ?? "true") === "true";
const PREFER_COMPILED_REPLIES =
  (process.env.PREFER_COMPILED_REPLIES ?? "true") === "true";

const CLASSIFICATION_THRESHOLD = Number(
  process.env.CLASSIFICATION_THRESHOLD || "0.28"
);

const BARANGAY_NAME = process.env.BARANGAY_NAME || "Barangay Fairview Park";
const OFFICE_HOURS = process.env.OFFICE_HOURS || "Mon–Fri, 8:00 AM–5:00 PM";
const CONTACT_PHONE = process.env.CONTACT_PHONE || "0917-XXX-XXXX";
const INCIDENT_LINK = process.env.INCIDENT_LINK || "/IncidentReport";
const STATUS_PORTAL_LINK =
  process.env.STATUS_PORTAL_LINK || "/IncidentReport";
const HALL_ADDRESS =
  process.env.HALL_ADDRESS || "Barangay Hall (set exact address)";

/* -------------------- File helpers -------------------- */
const dataDir = path.resolve(process.cwd(), "data/entities");
function readJSON<T = any>(fname: string, optional = false): T | null {
  const p = path.join(dataDir, fname);
  if (optional && !fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw) as T;
}

/* ---------- Load data (your files) ---------- */
type BaseRow = {
  base: string;
  synonyms: { en?: string[]; fil?: string[] };
};
type VariantRow = {
  base: string;
  variants: Array<{
    name: string;
    synonyms: { en?: string[]; fil?: string[] };
  }>;
};
type Requirement = {
  base: string;
  variant: string;
  age?: string;
  frequency?: string;
  validity?: string;
  documents?: string[];
  requestor?: string;
  link?: string;
};
type RepliesCompiled = {
  services?: {
    common?: { gating_login?: string; question_requirements?: string };
    links?: Record<string, string>;
    intents?: Record<string, string>;
  };
  navigation?: Record<string, string>;
  requirements?: Requirement[];
};

const DOC_BASES = readJSON<BaseRow[]>("doc_bases.json")!;
const VARIANTS_BY_BASE = readJSON<VariantRow[]>("doc_variants_by_base.json")!;
const REQUIREMENTS = readJSON<Requirement[]>("requirements.json")!;
const REPLIES = readJSON<RepliesCompiled>("replies.compiled.json", true);

/* -------------- API clients / config -------------- */
const cfg = cxConfig();
const apiEndpoint =
  cfg.location && cfg.location !== "global"
    ? `${cfg.location}-dialogflow.googleapis.com`
    : "dialogflow.googleapis.com";

const flows = new FlowsClient({ apiEndpoint });
const pages = new PagesClient({ apiEndpoint });
const trgc = new TransitionRouteGroupsClient({ apiEndpoint });
const entities = new EntityTypesClient({ apiEndpoint });
const intentsClient = new IntentsClient({ apiEndpoint });

/* ----------------- Utilities ----------------- */
const GATING_LOGIN =
  REPLIES?.services?.common?.gating_login ??
  "Online submission is available to verified residents (sign in to continue).";

function textMessages(msgs: string | string[]) {
  const arr = Array.isArray(msgs) ? msgs : [msgs];
  return { messages: arr.map((m) => ({ text: { text: [m] } })) };
}

/** Split long markdown into multiple CX text messages (safety). */
function toBatches(markdown: string, maxLen = 900): string[] {
  if (markdown.length <= maxLen) return [markdown];
  const lines = markdown.split(/\r?\n/);
  const out: string[] = [];
  let buf = "";
  for (const ln of lines) {
    if ((buf + "\n" + ln).length > maxLen) {
      if (buf) out.push(buf);
      buf = ln;
    } else {
      buf = buf ? buf + "\n" + ln : ln;
    }
  }
  if (buf) out.push(buf);
  return out;
}

function sanitizeId(s: string) {
  // CX display names allow many chars, but let’s keep IDs simple & unique-ish
  return s
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

function slugForIntent(base: string, variant: string) {
  return `REQ_${sanitizeId(base)}_${sanitizeId(variant)}_REQS`;
}

function tp(parts: string[]) {
  // Ensure repeatCount>=1
  return parts
    .filter((p) => p && p.trim().length > 0)
    .map((text) => ({ parts: [{ text }], repeatCount: 1 }));
}

/* ----------------- Entities ----------------- */
async function upsertEntityType(
  displayName: string,
  values: Array<{ value: string; synonyms?: string[] }>
) {
  // Find existing
  const [list] = await entities.listEntityTypes({ parent: cfg.parent });
  const found = list.find((e) => e.displayName === displayName);

  const entityType: protos.google.cloud.dialogflow.cx.v3.IEntityType = {
    displayName,
    kind: protos.google.cloud.dialogflow.cx.v3.EntityType.Kind.KIND_MAP,
    entities: values.map((v) => ({
      value: v.value,
      synonyms: Array.from(new Set([v.value, ...(v.synonyms || [])])),
    })),
  };

  if (!found) {
    await entities.createEntityType({
      parent: cfg.parent,
      entityType,
      languageCode: cfg.languageCode,
    });
    console.log(`Created entity: ${displayName}`);
  } else {
    await entities.updateEntityType({
      entityType: { name: found.name, ...entityType },
      updateMask: { paths: ["entities"] },
      languageCode: cfg.languageCode,
    });
    console.log(`Updated entity: ${displayName}`);
  }

  // Return fresh resource name
  const [after] = await entities.listEntityTypes({ parent: cfg.parent });
  const latest = after.find((e) => e.displayName === displayName);
  if (!latest?.name) throw new Error(`Failed to resolve ${displayName}`);
  return latest.name;
}

function buildBaseEntities() {
  return DOC_BASES.map((row) => ({
    value: row.base,
    synonyms: [
      ...(row.synonyms.en ?? []),
      ...(row.synonyms.fil ?? []),
    ],
  }));
}

function buildVariantEntities() {
  // Merge duplicates (e.g., “No Income” appears under multiple bases)
  const map = new Map<string, Set<string>>();
  for (const b of VARIANTS_BY_BASE) {
    for (const v of b.variants) {
      const key = v.name;
      if (!map.has(key)) map.set(key, new Set<string>());
      const set = map.get(key)!;
      (v.synonyms.en ?? []).forEach((s) => set.add(s));
      (v.synonyms.fil ?? []).forEach((s) => set.add(s));
    }
  }
  return Array.from(map.entries()).map(([value, set]) => ({
    value,
    synonyms: Array.from(set),
  }));
}

/* ----------------- Intents ----------------- */
type ParamDef = {
  id: string;
  entityDisplayName: "doc_base" | "doc_variant";
  isList?: boolean;
};
type IntentDef = {
  displayName: string;
  trainingPhrases: string[];
  parameters?: ParamDef[];
};

async function listIntentsMap() {
  const [existing] = await intentsClient.listIntents({ parent: cfg.parent });
  const byName = new Map(existing.map((i) => [i.displayName || "", i]));
  return byName;
}

async function upsertIntents(
  defs: IntentDef[],
  entityNames: { base: string; variant: string }
) {
  const byName = await listIntentsMap();

  for (const d of defs) {
    const found = byName.get(d.displayName);
    const parameters =
      d.parameters?.map((p) => ({
        id: p.id,
        isList: !!p.isList,
        entityType: p.entityDisplayName === "doc_base"
          ? entityNames.base
          : entityNames.variant,
      })) || [];

    const payload: protos.google.cloud.dialogflow.cx.v3.IIntent = {
      displayName: d.displayName,
      trainingPhrases: tp(d.trainingPhrases),
      parameters: parameters.length ? parameters : undefined,
    };

    if (!found) {
      const [resp] = await intentsClient.createIntent({
        parent: cfg.parent,
        intent: payload,
      });
      console.log(`Created intent: ${resp.displayName}`);
    } else {
      await intentsClient.updateIntent({
        intent: { name: found.name, ...payload },
        updateMask: { paths: ["training_phrases", "parameters"] },
      });
      console.log(`Updated intent: ${d.displayName}`);
    }
  }

  // Return fresh map displayName -> resource name
  const [after] = await intentsClient.listIntents({ parent: cfg.parent });
  const map = new Map<string, string>();
  after.forEach(
    (i) => i.displayName && i.name && map.set(i.displayName, i.name)
  );
  return map;
}

/* --------------- Route groups & pages --------------- */
function dedupeRoutes(existing: any[] = [], adds: any[] = []) {
  const key = (r: any) =>
    `${r.intent || ""}|${r.condition || ""}|${r.targetPage || ""}|${
      r.targetFlow || ""
    }`;
  const map = new Map(existing.map((r) => [key(r), r]));
  for (const r of adds) map.set(key(r), r);
  return Array.from(map.values());
}

function mergeEventHandlers(
  existing: protos.google.cloud.dialogflow.cx.v3.IEventHandler[] | null | undefined,
  upsert: protos.google.cloud.dialogflow.cx.v3.IEventHandler
) {
  const list = [...(existing ?? [])];
  const idx = list.findIndex((h) => h.event === upsert.event);
  if (idx >= 0) {
    list[idx] = { ...list[idx], triggerFulfillment: upsert.triggerFulfillment };
  } else {
    list.push(upsert);
  }
  return list;
}

async function getDefaultStartFlowName(): Promise<string> {
  const [list] = await flows.listFlows({ parent: cfg.parent });
  const found =
    list.find((f) => f.displayName === "Default Start Flow") || list[0];
  if (!found?.name) throw new Error("No Flow found in this agent.");
  return found.name!;
}

async function listPages(flowName: string) {
  const [list] = await pages.listPages({ parent: flowName });
  return list;
}

async function upsertPage(
  flowName: string,
  payload: protos.google.cloud.dialogflow.cx.v3.IPage,
  updatePaths: string[]
) {
  const [existing] = await pages.listPages({ parent: flowName });
  const found = existing.find((p) => p.displayName === payload.displayName);
  if (!found) {
    const [resp] = await pages.createPage({ parent: flowName, page: payload });
    console.log(`Created page: ${resp.displayName}`);
    return resp;
  } else {
    const [resp] = await pages.updatePage({
      page: { name: found.name, ...payload },
      updateMask: { paths: updatePaths },
    });
    console.log(`Updated page: ${payload.displayName}`);
    return resp;
  }
}

async function upsertTRG(
  flowName: string,
  displayName: string,
  routes: any[]
) {
  const [groups] = await trgc.listTransitionRouteGroups({ parent: flowName });
  const existing = groups.find((g) => g.displayName === displayName);
  const transitionRoutes = routes.map((r) => ({
    ...r,
    triggerFulfillment: r.triggerFulfillment || textMessages(""),
  }));

  if (!existing) {
    const [resp] = await trgc.createTransitionRouteGroup({
      parent: flowName,
      transitionRouteGroup: { displayName, transitionRoutes },
    });
    console.log(`Created route group: ${displayName}`);
    // attach to flow
    const [flow] = await flows.getFlow({ name: flowName });
    const next = [...(flow.transitionRouteGroups || []), resp.name!];
    await flows.updateFlow({
      flow: { name: flowName, transitionRouteGroups: next },
      updateMask: { paths: ["transition_route_groups"] },
    });
    console.log(`Attached route group to flow: ${displayName}`);
  } else {
    if (OVERWRITE_GROUPS) {
      await trgc.updateTransitionRouteGroup({
        transitionRouteGroup: {
          name: existing.name,
          displayName,
          transitionRoutes,
        },
        updateMask: { paths: ["transition_routes"] },
      });
      console.log(`Overwrote route group: ${displayName}`);
    } else {
      const merged = dedupeRoutes(existing.transitionRoutes || [], transitionRoutes);
      await trgc.updateTransitionRouteGroup({
        transitionRouteGroup: {
          name: existing.name,
          displayName,
          transitionRoutes: merged,
        },
        updateMask: { paths: ["transition_routes"] },
      });
      console.log(`Merged into route group: ${displayName}`);
    }
    // ensure attached
    const [flow] = await flows.getFlow({ name: flowName });
    const set = new Set(flow.transitionRouteGroups || []);
    if (!set.has(existing.name!)) {
      const next = [...set, existing.name!];
      await flows.updateFlow({
        flow: { name: flowName, transitionRouteGroups: next as string[] },
        updateMask: { paths: ["transition_route_groups"] },
      });
      console.log(`Attached route group to flow: ${displayName}`);
    }
  }
}

/* ----------------- Navigation & Info ----------------- */
function buildNavRoutes(map: Map<string, string>) {
  const pairs: Array<[string, string]> = [
    ["NAV_SERVICES", "You can check out our online services at /services"],
    [
      "NAV_FILE_INCIDENT",
      `File a minor incident online at ${INCIDENT_LINK}. Major/urgent cases must be reported in person at the barangay hall.`,
    ],
    ["NAV_PROGRAMS", "Programs: /Programs"],
    ["NAV_ANNOUNCEMENTS", "Announcements: /Announcements"],
    ["NAV_OFFICIALS", "Barangay officials: /OfficialsPage"],
    ["NAV_HOA_OFFICERS", "HOA officers: /OfficialsPage/HOAOfficersPage"],
    ["NAV_SITIO_OFFICERS", "Sitio officers: /OfficialsPage/SitioOfficersPage"],
    ["NAV_ABOUT", "About us: /aboutus"],
    ["NAV_HOME", "Home: /"],
  ];
  const routes: any[] = [];
  for (const [dn, msg] of pairs) {
    const name = map.get(dn);
    if (name) routes.push({ intent: name, triggerFulfillment: textMessages(msg) });
  }
  return routes;
}

function buildInfoRoutes(map: Map<string, string>) {
  const defs: Array<[string, string]> = [
    ["INFO_OFFICE_HOURS", `Office hours: ${OFFICE_HOURS}`],
    ["INFO_HOTLINES", `Hotline: ${CONTACT_PHONE}`],
    ["INFO_LOCATION", `Barangay Hall: ${HALL_ADDRESS}`],
    ["INFO_ANNOUNCEMENTS", "Latest announcements: /Announcements"],
    ["INFO_OFFICIALS", "Barangay officials: /OfficialsPage"],
  ];
  const routes: any[] = [];
  for (const [dn, msg] of defs) {
    const name = map.get(dn);
    if (name) routes.push({ intent: name, triggerFulfillment: textMessages(msg) });
  }
  return routes;
}

function buildIncidentRoutes(map: Map<string, string>) {
  const defs: Array<[string, string]> = [
    [
      "INCIDENT_HOW_TO_FILE",
      `Minor incidents: file online → ${INCIDENT_LINK}\nMajor/urgent: report **in person** at the barangay hall during ${OFFICE_HOURS} or call ${CONTACT_PHONE}.\nEmergency: 911.`,
    ],
    [
      "INCIDENT_DEPARTMENT_INFO",
      `Lupon: community mediation for minor disputes.\nVAWC: Violence Against Women and Children (urgent → 911).\nBCPC: child protection/welfare.\nGAD: gender programs/concerns.\nTip: kapitbahay dispute → Lupon; VAWC/child → VAWC/BCPC.`,
    ],
    [
      "INCIDENT_STATUS_MEANING",
      `Status glossary:\nNew/Received, Pending/Under Review, For Scheduling/Scheduled, Ongoing, For Resolution, Resolved/Settled, Archived, Dismissed/Withdrawn, Referred.`,
    ],
    [
      "INCIDENT_FIRST_STEP_DIALOGUE",
      "First step is a dialogue/mediation meeting facilitated by the barangay.",
    ],
    [
      "INCIDENT_ONLINE_VS_MAJOR",
      "Online is for minor issues only. Major incidents (injury, violence, threats, serious crimes) require in-person reporting. Emergencies: 911.",
    ],
    [
      "INCIDENT_PENDING_TOO_LONG",
      `We can follow up or reschedule. Check status at ${STATUS_PORTAL_LINK}, call ${CONTACT_PHONE}, or visit during ${OFFICE_HOURS}.`,
    ],
    [
      "INCIDENT_WHY_PENDING",
      `Possible causes: triage, waiting for documents, scheduling conflicts, respondent not reached, or queue/backlog. Share your incident number so we can check; call ${CONTACT_PHONE} or visit ${BARANGAY_NAME} during ${OFFICE_HOURS}.`,
    ],
    [
      "INCIDENT_CONTACT_INFO",
      `You can reach ${BARANGAY_NAME} via ${CONTACT_PHONE} or visit the barangay hall during ${OFFICE_HOURS}.`,
    ],
    [
      "INCIDENT_MULTIPLE_INCIDENTS",
      "Yes, you can file multiple incidents. Related cases may be consolidated; distinct ones will have separate incident numbers.",
    ],
    [
      "INCIDENT_SAFETY_ESCALATION",
      "If you’re in immediate danger, call **911** or go to the nearest police station right away. You can still report to us after you are safe.",
    ],
  ];
  const routes: any[] = [];
  for (const [dn, msg] of defs) {
    const name = map.get(dn);
    if (name) routes.push({ intent: name, triggerFulfillment: textMessages(msg) });
  }
  return routes;
}

/* ----------------- Services page ----------------- */
function serviceLinkFor(base: string) {
  const map = REPLIES?.services?.links || {};
  return map[base] || `/services/action?docB=${encodeURIComponent(base)}`;
}

function renderRequirement(r: Requirement) {
  const header = `Requirements for **${r.base} – ${r.variant}** (Age: ${r.age || "—"}; Validity: ${r.validity || "—"}; Frequency: ${r.frequency || "—"}):`;
  const bullets = (r.documents ?? []).map((d) => `- ${d}`).join("\n");
  const link = r.link || serviceLinkFor(r.base);
  const tail = `Start here: **${link}**`;
  return [header, bullets, tail].filter(Boolean).join("\n");
}

function servicesPagePayload(
  entityDocBase: string,
  entityDocVariant: string
): protos.google.cloud.dialogflow.cx.v3.IPage {
  const perComboRoutes = REQUIREMENTS.map((r) => {
    const body = renderRequirement(r);
    return {
      condition: `$session.params.doc_base = "${r.base}" && $session.params.doc_variant = "${r.variant}"`,
      triggerFulfillment: textMessages(toBatches(body)),
    };
  });

  return {
    displayName: "Services",
    form: {
      parameters: [
        {
          displayName: "doc_base",
          entityType: entityDocBase,
          required: true,
          fillBehavior: {
            initialPromptFulfillment: textMessages(
              "Which document do you need? (Barangay Certificate, Indigency, Clearance, Business Permit, Temporary Business Permit, Construction Permit, Other Documents)"
            ),
            repromptEventHandlers: [
              {
                event: "sys.no-match-1",
                triggerFulfillment: textMessages(
                  "Sure— which document do you need? (e.g., Barangay Certificate, Indigency, Clearance)"
                ),
              },
              {
                event: "sys.no-input-1",
                triggerFulfillment: textMessages(
                  "I didn’t hear a document name. Try “Barangay Certificate”, “Indigency”, or “Clearance”."
                ),
              },
            ],
          },
        },
        {
          displayName: "doc_variant",
          entityType: entityDocVariant,
          required: false,
          fillBehavior: {
            repromptEventHandlers: [
              {
                event: "sys.no-match-1",
                triggerFulfillment: textMessages(
                  "If you have a specific variant (e.g., Residency, No Income, Loan, Standard), say it now — or say “skip”."
                ),
              },
            ],
          },
        },
      ],
    },
    transitionRoutes: [
      {
        condition:
          'has($session.params.doc_variant) && !has($session.params.doc_base)',
        triggerFulfillment: textMessages(
          "Got it: **$session.params.doc_variant**. Is that for **Barangay Certificate**, **Barangay Indigency**, **Barangay Clearance**, **Business Permit**, **Temporary Business Permit**, **Construction Permit**, or **Other Documents**?"
        ),
      },
      {
        condition:
          'has($session.params.doc_base) && !has($session.params.doc_variant)',
        triggerFulfillment: textMessages(
          `Here’s where to request **$session.params.doc_base**: **/services/action?docB=$session.params.doc_base**. ${GATING_LOGIN}`
        ),
      },
      ...perComboRoutes,
      {
        condition:
          'has($session.params.doc_base) && has($session.params.doc_variant)',
        triggerFulfillment: textMessages(
          `Here’s the link for **$session.params.doc_base – $session.params.doc_variant**: /services/action?docB=$session.params.doc_base`
        ),
      },
    ],
    eventHandlers: [
      {
        event: "sys.no-match-default",
        triggerFulfillment: textMessages(
          `Try: "requirements for residency", "request barangay certificate", or say "services" to start over.`
        ),
      },
      {
        event: "sys.no-input-default",
        triggerFulfillment: textMessages(
          `I can help with Services, Incidents, Programs, Announcements, and Officials. Try: "services", "file an incident", or "announcements".`
        ),
      },
    ],
  };
}

/* --------------- Wire entry routes / tune --------------- */
async function upsertFlowRoutes(flowName: string, adds: any[]) {
  const [flow] = await flows.getFlow({ name: flowName });
  const merged = dedupeRoutes(flow.transitionRoutes || [], adds);
  await flows.updateFlow({
    flow: { name: flowName, transitionRoutes: merged },
    updateMask: { paths: ["transition_routes"] },
  });
  console.log("Upserted flow-level transition routes.");
}

async function wireEntrypoints(
  flowName: string,
  servicesPageName: string,
  map: Map<string, string>
) {
  const toServices: any[] = [];
  const navSvc = map.get("NAV_SERVICES");
  const reqSvc = map.get("REQUEST_SERVICE");
  const reqReq = map.get("REQUIREMENTS_QUERY");
  if (navSvc) toServices.push({ intent: navSvc, targetPage: servicesPageName });
  if (reqSvc) toServices.push({ intent: reqSvc, targetPage: servicesPageName });
  if (reqReq) toServices.push({ intent: reqReq, targetPage: servicesPageName });

  const pagesList = await listPages(flowName);
  const start =
    pagesList.find((p) => p.displayName === "Start Page") ||
    pagesList.find((p) =>
      (p.displayName || "").toLowerCase().includes("start")
    );

  if (start?.name) {
    const mergedRoutes = dedupeRoutes(start.transitionRoutes || [], toServices);
    const mergedHandlers = mergeEventHandlers(start.eventHandlers, {
      event: "sys.no-match-default",
      triggerFulfillment: textMessages(
        `I can help with **Services**, **Incidents**, **Programs**, **Announcements**, and **Officials**.\nTry: "services", "request barangay certificate", "file an incident", "announcements".`
      ),
    });

    await pages.updatePage({
      page: {
        name: start.name,
        displayName: start.displayName,
        transitionRoutes: mergedRoutes,
        eventHandlers: mergedHandlers,
      },
      updateMask: { paths: ["transition_routes", "event_handlers"] },
    });
    console.log("Updated Start Page: routes + fallback.");
  } else {
    await upsertFlowRoutes(flowName, toServices);
    const [flow] = await flows.getFlow({ name: flowName });
    const mergedHandlers = mergeEventHandlers(flow.eventHandlers, {
      event: "sys.no-match-default",
      triggerFulfillment: textMessages(
        `I can help with **Services**, **Incidents**, **Programs**, **Announcements**, and **Officials**.\nTry: "services", "request barangay certificate", "file an incident", "announcements".`
      ),
    });
    await flows.updateFlow({
      flow: { name: flowName, eventHandlers: mergedHandlers },
      updateMask: { paths: ["event_handlers"] },
    });
    console.log("Start Page not found — wired at flow level.");
  }
}

async function tuneFlow(flowName: string) {
  const [flow] = await flows.getFlow({ name: flowName });
  const mergedHandlers = mergeEventHandlers(flow.eventHandlers, {
    event: "sys.no-match-default",
    triggerFulfillment: textMessages(
      `Sorry, I didn't quite get that.\nTry: **services**, **programs**, **announcements**, **file an incident**.`
    ),
  });

  await flows.updateFlow({
    flow: {
      name: flowName,
      nluSettings: {
        ...flow.nluSettings,
        classificationThreshold: CLASSIFICATION_THRESHOLD,
      },
      eventHandlers: mergedHandlers,
    },
    updateMask: {
      paths: ["nlu_settings.classification_threshold", "event_handlers"],
    },
  });
  console.log(
    `Set classificationThreshold=${CLASSIFICATION_THRESHOLD} and fallback.`
  );
}

/* ------------ Build core intent defs from data ------------ */
function buildNavIntents(): IntentDef[] {
  return [
    {
      displayName: "NAV_SERVICES",
      trainingPhrases: [
        "services",
        "service",
        "request documents",
        "request document",
        "open services",
        "services page",
        "serbisyo",
        "humiling ng dokumento",
      ],
    },
    {
      displayName: "NAV_FILE_INCIDENT",
      trainingPhrases: [
        "file an incident",
        "incident",
        "report incident",
        "mag file ng reklamo",
        "reklamo",
      ],
    },
    {
      displayName: "NAV_PROGRAMS",
      trainingPhrases: ["programs", "projects", "activities", "mga programa"],
    },
    {
      displayName: "NAV_ANNOUNCEMENTS",
      trainingPhrases: ["announcements", "news", "updates", "balita", "anong bago"],
    },
    {
      displayName: "NAV_OFFICIALS",
      trainingPhrases: [
        "officials",
        "barangay officials",
        "opisyal",
        "sino ang mga opisyal",
      ],
    },
    {
      displayName: "NAV_HOA_OFFICERS",
      trainingPhrases: ["hoa officers", "homeowners officers", "opisyal ng hoa"],
    },
    {
      displayName: "NAV_SITIO_OFFICERS",
      trainingPhrases: ["sitio officers", "sitio leaders", "opisyal ng sitio"],
    },
    {
      displayName: "NAV_ABOUT",
      trainingPhrases: ["about", "about us", "tungkol sa barangay"],
    },
    {
      displayName: "NAV_HOME",
      trainingPhrases: ["home", "homepage", "go home", "bahay", "main page"],
    },
  ];
}

function buildServiceIntents(): IntentDef[] {
  return [
    {
      displayName: "REQUEST_SERVICE",
      trainingPhrases: [
        "Where can I request barangay certificate?",
        "How to apply for barangay certificate",
        "Need barangay certificate",
        "Kailangan ko ng certificate",
        "Get barangay certificate online",
        "requirements for barangay certificate residency",
        "Saan ako pwede mag request ng certificate",
      ],
      parameters: [
        { id: "doc_base", entityDisplayName: "doc_base" },
        { id: "doc_variant", entityDisplayName: "doc_variant" },
      ],
    },
    {
      displayName: "REQUIREMENTS_QUERY",
      trainingPhrases: [
        "What are the requirements for residency",
        "Requirements for barangay certificate residency",
        "Ano ang requirements ng certificate residency",
        "List the requirements for residency",
        "kailangan para sa residency",
        "requirements for no income",
        "requirements indigency no income",
      ],
      parameters: [
        { id: "doc_base", entityDisplayName: "doc_base" },
        { id: "doc_variant", entityDisplayName: "doc_variant" },
      ],
    },
  ];
}

function buildInfoIntents(): IntentDef[] {
  return [
    {
      displayName: "INFO_OFFICE_HOURS",
      trainingPhrases: ["office hours", "anong oras bukas", "schedule", "operating hours"],
    },
    {
      displayName: "INFO_HOTLINES",
      trainingPhrases: ["hotline", "contact number", "phone", "contact ng barangay"],
    },
    {
      displayName: "INFO_LOCATION",
      trainingPhrases: [
        "where is the barangay hall",
        "saan ang barangay hall",
        "location",
        "address",
      ],
    },
    {
      displayName: "INFO_ANNOUNCEMENTS",
      trainingPhrases: ["announcements", "news", "updates", "balita"],
    },
    {
      displayName: "INFO_OFFICIALS",
      trainingPhrases: [
        "who are the barangay officials",
        "sino ang mga opisyal",
        "officials",
      ],
    },
  ];
}

function buildIncidentIntents(): IntentDef[] {
  return [
    {
      displayName: "INCIDENT_HOW_TO_FILE",
      trainingPhrases: [
        "How can I file an incident",
        "Paano mag-file ng reklamo",
        "Where do I start my report",
      ],
    },
    {
      displayName: "INCIDENT_DEPARTMENT_INFO",
      trainingPhrases: [
        "Difference between Lupon VAWC BCPC GAD",
        "Saan ako mag-file Lupon o VAWC",
        "BCPC vs GAD",
        "department for domestic issues",
      ],
    },
    {
      displayName: "INCIDENT_STATUS_MEANING",
      trainingPhrases: [
        "Status codes meaning",
        "Ano ibig sabihin ng archived",
        "Why is my case pending",
        "scheduled meaning",
      ],
    },
    {
      displayName: "INCIDENT_FIRST_STEP_DIALOGUE",
      trainingPhrases: [
        "first step to resolve incident",
        "unang hakbang sa reklamo",
        "dialogue meeting",
      ],
    },
    {
      displayName: "INCIDENT_ONLINE_VS_MAJOR",
      trainingPhrases: [
        "pwede ba online lang",
        "is online filing enough",
        "minor vs major incident",
      ],
    },
    {
      displayName: "INCIDENT_PENDING_TOO_LONG",
      trainingPhrases: ["matagal nang pending", "pending too long", "can I follow up"],
    },
    {
      displayName: "INCIDENT_WHY_PENDING",
      trainingPhrases: ["why pending", "bakit pending pa rin", "any update on my case"],
    },
    {
      displayName: "INCIDENT_CONTACT_INFO",
      trainingPhrases: [
        "contact number ng barangay",
        "how can I contact you",
        "saan ang barangay hall",
      ],
    },
    {
      displayName: "INCIDENT_MULTIPLE_INCIDENTS",
      trainingPhrases: [
        "file multiple incidents",
        "pwede bang dalawa o higit pa",
        "separate cases",
      ],
    },
    {
      displayName: "INCIDENT_SAFETY_ESCALATION",
      trainingPhrases: ["help urgent", "may banta", "I'm scared right now"],
    },
  ];
}

/* ---- Static requirement intents per (base, variant) ---- */
function buildStaticRequirementIntents(): IntentDef[] {
  const intents: IntentDef[] = [];
  for (const r of REQUIREMENTS) {
    const id = slugForIntent(r.base, r.variant);
    // Build a few robust training phrases (EN/Fil + with/without “requirements” word)
    const baseSyn = DOC_BASES.find((b) => b.base === r.base)?.synonyms ?? {};
    const varSyn = VARIANTS_BY_BASE
      .find((b) => b.base === r.base)
      ?.variants.find((v) => v.name === r.variant)?.synonyms ?? {};

    const enBase = baseSyn.en?.[0] || r.base;
    const filBase = baseSyn.fil?.[0] || r.base;
    const enVar = varSyn.en?.[0] || r.variant;
    const filVar = varSyn.fil?.[0] || r.variant;

    const phrases = [
      `requirements for ${enVar} ${enBase}`,
      `requirements for ${enBase} ${enVar}`,
      `what are the requirements for ${enVar}`,
      `ano ang requirements para sa ${filVar}`,
      `${enVar} requirements`,
      `kailangan para sa ${filVar}`,
    ];

    intents.push({
      displayName: id,
      trainingPhrases: Array.from(new Set(phrases)),
    });
  }
  return intents;
}

/* --------------- Orchestrate ---------------- */
(async () => {
  try {
    // 1) Entities from files
    const baseName = await upsertEntityType("doc_base", buildBaseEntities());
    const variantName = await upsertEntityType(
      "doc_variant",
      buildVariantEntities()
    );

    // 2) Intents
    const coreIntents = [
      ...buildNavIntents(),
      ...buildServiceIntents(),
      ...buildInfoIntents(),
      ...buildIncidentIntents(),
    ];
    const coreMap = await upsertIntents(coreIntents, {
      base: baseName,
      variant: variantName,
    });

    // 3) (Optional) one intent per (base, variant) with static reply
    let staticReqIntentMap = new Map<string, string>();
    if (CREATE_STATIC_REQ_INTENTS) {
      const reqIntents = buildStaticRequirementIntents();
      staticReqIntentMap = await upsertIntents(reqIntents, {
        base: baseName,
        variant: variantName,
      });
    }

    // 4) Flow tune + route groups
    const flowName = await getDefaultStartFlowName();
    await tuneFlow(flowName);

    const navRoutes = buildNavRoutes(coreMap);
    if (navRoutes.length)
      await upsertTRG(flowName, "Navigation", navRoutes);

    const infoRoutes = buildInfoRoutes(coreMap);
    if (infoRoutes.length)
      await upsertTRG(flowName, "Info & FAQs", infoRoutes);

    const incidentRoutes = buildIncidentRoutes(coreMap);
    if (incidentRoutes.length)
      await upsertTRG(flowName, "Incidents & Justice", incidentRoutes);

    // 5) Services page with per-combo requirement replies
    const servicesPage = await upsertPage(
      flowName,
      servicesPagePayload(baseName, variantName),
      ["display_name", "form", "transition_routes", "event_handlers"]
    );

    // 6) Wire entry points to Services (NAV_SERVICES, REQUEST_SERVICE, REQUIREMENTS_QUERY)
    await wireEntrypoints(flowName, servicesPage.name!, coreMap);

    // 7) (Optional) Attach a route group that answers static requirement intents directly
    if (CREATE_STATIC_REQ_INTENTS && REQUIREMENTS.length) {
      const routes: any[] = [];
      for (const r of REQUIREMENTS) {
        const dn = slugForIntent(r.base, r.variant);
        const intentName = staticReqIntentMap.get(dn);
        if (!intentName) continue;
        const body = renderRequirement(r);
        routes.push({
          intent: intentName,
          triggerFulfillment: textMessages(toBatches(body)),
        });
      }
      if (routes.length)
        await upsertTRG(flowName, "Services – Requirements (Static)", routes);
    }

    console.log("sync:all:files completed ✅");
  } catch (err: any) {
    console.error("sync:all:files failed:", err?.message || err);
    process.exitCode = 1;
  }
})();
