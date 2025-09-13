/**
 * tools/cx-training/src/cx/syncAll.ts
 *
 * One-shot setup for your agent with **no file reads** (all data inlined).
 *
 * Run: npm run sync:all
 *
 * Prereqs:
 * - .env in tools/cx-training has PROJECT_ID, LOCATION, AGENT_ID, LANGUAGE_CODE, GOOGLE_APPLICATION_CREDENTIALS
 * - Entities 'doc_base' and 'doc_variant' already created via sync:entities (or create them manually first)
 */

import "dotenv/config";
import {
  FlowsClient,
  PagesClient,
  TransitionRouteGroupsClient,
  EntityTypesClient,
  IntentsClient,
  protos,
} from "@google-cloud/dialogflow-cx";
import { cxConfig } from "./auth.js";

// ---------- Inline data (edit/extend as you wish) ----------

// Top-level configuration strings
const BARANGAY_NAME = process.env.BARANGAY_NAME || "Barangay Fairview Park";
const OFFICE_HOURS = process.env.OFFICE_HOURS || "Mon–Fri, 8:00 AM–5:00 PM";
const CONTACT_PHONE = process.env.CONTACT_PHONE || "0917-XXX-XXXX";
const INCIDENT_LINK = process.env.INCIDENT_LINK || "/IncidentReport";
const STATUS_PORTAL_LINK = process.env.STATUS_PORTAL_LINK || "/IncidentReport";
const HALL_ADDRESS =
  process.env.HALL_ADDRESS || "Barangay Hall (set exact address)";
const CLASSIFICATION_THRESHOLD = Number(
  process.env.CLASSIFICATION_THRESHOLD || "0.28"
);

// Static links per base (used when only doc_base is known)
const SERVICE_LINK = (base: string) =>
  `/services/action?docB=${encodeURIComponent(base)}`;

const GATING_LOGIN =
  "Online submission is available to verified residents (sign in to continue).";

// A **small** starter set of requirements. Add more entries from your JSON
// by copying objects with the same shape (base, variant, bullets, age, etc.).
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

const REQS: Requirement[] = [
  // Barangay Certificate — Residency
  {
    base: "Barangay Certificate",
    variant: "Residency",
    age: "18+",
    frequency: "No limit",
    validity: "1 year",
    documents: [
      "Signature over printed name",
      "One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President",
      "Picture taking at the barangay",
    ],
    link: SERVICE_LINK("Barangay Certificate"),
  },
  // Barangay Indigency — No Income
  {
    base: "Barangay Indigency",
    variant: "No Income",
    age: "18+",
    frequency: "No limit",
    validity: "1 year",
    documents: [
      "Signature over printed name",
      "One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President",
      "Interview at the barangay",
    ],
    link: SERVICE_LINK("Barangay Indigency"),
  },
  // Barangay Clearance — Loan
  {
    base: "Barangay Clearance",
    variant: "Loan",
    age: "18+",
    frequency: "No limit",
    validity: "1 year",
    documents: [
      "Signature over printed name",
      "One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President",
    ],
    link: SERVICE_LINK("Barangay Clearance"),
  },
  // Business Permit — New
  {
    base: "Business Permit",
    variant: "New",
    age: "18+",
    frequency: "No limit",
    validity: "1 year",
    documents: [
      "Signature over printed name",
      "Valid ID",
      "Certified True Copy of Title of Property / Contract of Lease",
      "Certified True Copy of DTI Registration",
      "Picture of CCTV installed in the establishment",
    ],
    requestor: "Residents / Non Residents",
    link: SERVICE_LINK("Business Permit"),
  },
  // Construction Permit — Standard
  {
    base: "Construction Permit",
    variant: "Standard",
    age: "18+",
    frequency: "No limit",
    validity: "1 year",
    documents: [
      "Signature over printed name",
      "Valid ID",
      "Certified True Copy of Title of Property / Contract of Lease",
      "Certified True Copy of Tax Declaration",
      "Approved Building / Construction Plan",
    ],
    requestor: "Residents / Non Residents",
    link: SERVICE_LINK("Construction Permit"),
  },
];

// ---------- Clients / config ----------
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

// ---------- Helpers ----------
function text(msg: string) {
  return { messages: [{ text: { text: [msg] } }] };
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

function dedupeRoutes(existing: any[] = [], adds: any[] = []) {
  const key = (r: any) =>
    `${r.intent || ""}|${r.condition || ""}|${r.targetPage || ""}|${
      r.targetFlow || ""
    }`;
  const map = new Map(existing.map((r) => [key(r), r]));
  for (const r of adds) map.set(key(r), r);
  return Array.from(map.values());
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
  const list = await listPages(flowName);
  const existing = list.find((p) => p.displayName === payload.displayName);
  if (!existing) {
    const [resp] = await pages.createPage({ parent: flowName, page: payload });
    console.log(`Created page: ${resp.displayName}`);
    return resp;
  } else {
    const [resp] = await pages.updatePage({
      page: { name: existing.name, ...payload },
      updateMask: { paths: updatePaths },
    });
    console.log(`Updated page: ${resp.displayName}`);
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
    triggerFulfillment: r.triggerFulfillment || text(""),
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
    await trgc.updateTransitionRouteGroup({
      transitionRouteGroup: {
        name: existing.name,
        displayName,
        transitionRoutes,
      },
      updateMask: { paths: ["transition_routes"] },
    });
    console.log(`Updated route group: ${displayName}`);
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

// ---------- Intents upsert ----------
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

function tp(parts: string[]) {
  return parts.map((text) => ({ parts: [{ text }], repeatCount: 1 }));
}

async function resolveDocEntities() {
  const [list] = await entities.listEntityTypes({ parent: cfg.parent });
  const map = new Map(list.map((e) => [e.displayName || "", e.name || ""]));
  const base = map.get("doc_base");
  const variant = map.get("doc_variant");
  if (!base || !variant)
    throw new Error(
      "Missing entity types 'doc_base'/'doc_variant'. Run sync:entities first."
    );
  return { base, variant };
}

async function upsertIntents(defs: IntentDef[]) {
  const [existing] = await intentsClient.listIntents({ parent: cfg.parent });
  const byName = new Map(existing.map((i) => [i.displayName || "", i]));

  const { base, variant } = await resolveDocEntities();

  for (const d of defs) {
    const found = byName.get(d.displayName);
    const parameters =
      d.parameters?.map((p) => ({
        id: p.id,
        isList: !!p.isList,
        entityType: p.entityDisplayName === "doc_base" ? base : variant,
      })) || [];

    const payload: any = {
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
      const [resp] = await intentsClient.updateIntent({
        intent: { name: found.name, ...payload },
        updateMask: { paths: ["training_phrases", "parameters"] },
      });
      console.log(`Updated intent: ${resp.displayName}`);
    }
  }

  // Return a fresh map displayName -> resource name
  const [after] = await intentsClient.listIntents({ parent: cfg.parent });
  const map = new Map<string, string>();
  after.forEach(
    (i) => i.displayName && i.name && map.set(i.displayName, i.name)
  );
  return map;
}

// ---------- Definitions ----------

// Navigation intents (no params)
const NAV_INTENTS: IntentDef[] = [
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

// Core services intents (with params)
const SERVICE_INTENTS: IntentDef[] = [
  {
    displayName: "REQUEST_SERVICE",
    trainingPhrases: [
      "Where can I request barangay certificate?",
      "Where can I request barangay documents?",
      "How to apply for barangay certificate",
      "Need barangay certificate",
      "Kailangan ko ng certificate",
      "Get barangay certificate online",
      "requirements for barangay certificate residency",
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

// Info / FAQs (no params)
const INFO_INTENTS: IntentDef[] = [
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

// Incidents (no params)
const INCIDENT_INTENTS: IntentDef[] = [
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

// ---------- Build route groups ----------
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
    if (name) routes.push({ intent: name, triggerFulfillment: text(msg) });
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
    if (name) routes.push({ intent: name, triggerFulfillment: text(msg) });
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
    if (name) routes.push({ intent: name, triggerFulfillment: text(msg) });
  }
  return routes;
}

// ---------- Services page ----------
function servicesPagePayload(
  entityDocBase: string,
  entityDocVariant: string
): protos.google.cloud.dialogflow.cx.v3.IPage {
  // Build per-combination routes from REQS
  const perComboRoutes = REQS.map((r) => {
    const bullets = (r.documents ?? []).map((d) => `- ${d}`).join("\n");
    const header = `Requirements for **${r.base} – ${r.variant}**${
      r.age || r.frequency || r.validity
        ? ` (Age: ${r.age || "—"}; Frequency: ${r.frequency || "—"}; Validity: ${
            r.validity || "—"
          })`
        : ""
    }:`;

    const body = [header, bullets, `Start here: **${r.link || SERVICE_LINK(r.base)}**`]
      .filter(Boolean)
      .join("\n");

    return {
      condition: `$session.params.doc_base = "${r.base}" && $session.params.doc_variant = "${r.variant}"`,
      triggerFulfillment: text(body),
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
            initialPromptFulfillment: text(
              "Which document do you need? (Barangay Certificate, Indigency, Clearance, Business Permit, Temporary Business Permit, Construction Permit, Other Documents)"
            ),
            // Parameter-level reprompts must use specific system events
            repromptEventHandlers: [
              {
                event: "sys.no-match-1",
                triggerFulfillment: text(
                  "Sure — which document do you need? (e.g., Barangay Certificate, Indigency, Clearance)"
                ),
              },
              {
                event: "sys.no-input-1",
                triggerFulfillment: text(
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
                triggerFulfillment: text(
                  "If you have a specific variant (e.g., Residency, No Income, Loan, Standard), say it now — or say “skip”."
                ),
              },
            ],
          },
        },
      ],
    },
    transitionRoutes: [
      // Variant only -> ask user to pick base
      {
        condition:
          'has($session.params.doc_variant) && !has($session.params.doc_base)',
        triggerFulfillment: text(
          "Got it: **$session.params.doc_variant**. Is that for **Barangay Certificate**, **Barangay Indigency**, **Barangay Clearance**, **Business Permit**, **Temporary Business Permit**, **Construction Permit**, or **Other Documents**?"
        ),
      },
      // Base only -> generic link + gating
      {
        condition:
          'has($session.params.doc_base) && !has($session.params.doc_variant)',
        triggerFulfillment: text(
          `Here’s where to request **$session.params.doc_base**: **/services/action?docB=$session.params.doc_base**. ${GATING_LOGIN}`
        ),
      },
      // Specific base+variant combos with full requirement text
      ...perComboRoutes,
      // Fallback when both base+variant present but not in the hard-coded list
      {
        condition:
          'has($session.params.doc_base) && has($session.params.doc_variant)',
        triggerFulfillment: text(
          `Here’s the link for **$session.params.doc_base – $session.params.doc_variant**: /services/action?docB=$session.params.doc_base`
        ),
      },
    ],
    // Page-level fallbacks (allowed events)
    eventHandlers: [
      {
        event: "sys.no-match-default",
        triggerFulfillment: text(
          `Try: "requirements for residency", "request barangay certificate", or say "services" to start over.`
        ),
      },
      {
        event: "sys.no-input-default",
        triggerFulfillment: text(
          `I can help with Services, Incidents, Programs, Announcements, and Officials. Try: "services", "file an incident", or "announcements".`
        ),
      },
    ],
  };
}

// ---------- Start wiring helpers (resilient) ----------
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
  // Build the three “go to Services” routes (NAV_SERVICES, REQUEST_SERVICE, REQUIREMENTS_QUERY)
  const toServices: any[] = [];
  const navSvc = map.get("NAV_SERVICES");
  const reqSvc = map.get("REQUEST_SERVICE");
  const reqReq = map.get("REQUIREMENTS_QUERY");

  if (navSvc) toServices.push({ intent: navSvc, targetPage: servicesPageName });
  if (reqSvc) toServices.push({ intent: reqSvc, targetPage: servicesPageName });
  if (reqReq) toServices.push({ intent: reqReq, targetPage: servicesPageName });

  // Try to wire the Start Page if we can find it…
  const list = await listPages(flowName);
  const start =
    list.find((p) => p.displayName === "Start Page") ||
    list.find((p) => (p.displayName || "").toLowerCase().includes("start"));

  if (start?.name) {
    const mergedRoutes = dedupeRoutes(start.transitionRoutes || [], toServices);
    const mergedHandlers = mergeEventHandlers(start.eventHandlers, {
      event: "sys.no-match-default",
      triggerFulfillment: text(
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
    console.log("Updated Start Page: merged routes + fallback.");
  } else {
    // …otherwise, fall back to Flow-level transition routes (works regardless of the start page name)
    await upsertFlowRoutes(flowName, toServices);

    // Also ensure a good flow-level fallback (in case a page-level one doesn’t exist)
    const [flow] = await flows.getFlow({ name: flowName });
    const mergedHandlers = mergeEventHandlers(flow.eventHandlers, {
      event: "sys.no-match-default",
      triggerFulfillment: text(
        `I can help with **Services**, **Incidents**, **Programs**, **Announcements**, and **Officials**.\nTry: "services", "request barangay certificate", "file an incident", "announcements".`
      ),
    });
    await flows.updateFlow({
      flow: { name: flowName, eventHandlers: mergedHandlers },
      updateMask: { paths: ["event_handlers"] },
    });
    console.log(
      "Start Page not found — added entry routes at flow level instead."
    );
  }
}

// ---------- Flow-level fallback + NLU threshold ----------
async function tuneFlow(flowName: string) {
  const [flow] = await flows.getFlow({ name: flowName });

  const mergedHandlers = mergeEventHandlers(flow.eventHandlers, {
    event: "sys.no-match-default",
    triggerFulfillment: text(
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
    `Set classificationThreshold=${CLASSIFICATION_THRESHOLD} and merged flow-level fallback.`
  );
}

// ---------- Orchestration ----------
(async () => {
  try {
    const flowName = await getDefaultStartFlowName();

    // 1) Ensure all intents exist/updated
    const allIntentDefs: IntentDef[] = [
      ...NAV_INTENTS,
      ...SERVICE_INTENTS,
      ...INFO_INTENTS,
      ...INCIDENT_INTENTS,
    ];
    const intentMap = await upsertIntents(allIntentDefs);

    // 2) Tune flow + fallback (merged)
    await tuneFlow(flowName);

    // 3) Route groups (flow-level)
    const navRoutes = buildNavRoutes(intentMap);
    if (navRoutes.length) await upsertTRG(flowName, "Navigation", navRoutes);

    const infoRoutes = buildInfoRoutes(intentMap);
    if (infoRoutes.length)
      await upsertTRG(flowName, "Info & FAQs", infoRoutes);

    const incidentRoutes = buildIncidentRoutes(intentMap);
    if (incidentRoutes.length)
      await upsertTRG(flowName, "Incidents & Justice", incidentRoutes);

    // 4) Services page (no webhook; uses inline data above)
    const { base, variant } = await resolveDocEntities();
    const servicesPage = await upsertPage(
      flowName,
      servicesPagePayload(base, variant),
      ["display_name", "form", "transition_routes", "event_handlers"]
    );

    // 5) Wire entry routes (Start Page if found, else flow-level)
    await wireEntrypoints(flowName, servicesPage.name!, intentMap);

    console.log("sync:all completed ✅");
  } catch (err: any) {
    console.error("sync:all failed:", err?.message || err);
    process.exitCode = 1;
  }
})();
