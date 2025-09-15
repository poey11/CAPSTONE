/**
 * Create one Transition Route Group per Base ("Services — <Base>") and attach them to the Start Page.
 * Uses your existing REQUEST_SERVICE and REQUIREMENTS_QUERY intents, plus requirements JSON.
 *
 * Run:
 *   npm run sync:services-at-start
 *
 * Add to package.json "scripts":
 *   "sync:services-at-start": "tsx src/cx/syncServicesAtStart.ts"
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import {
  FlowsClient,
  PagesClient,
  TransitionRouteGroupsClient,
  IntentsClient,
  protos,
} from "@google-cloud/dialogflow-cx";
import { cxConfig } from "./auth.js";

// ---------- ENV / constants ----------
const cfg = cxConfig();
const apiEndpoint =
  cfg.location && cfg.location !== "global"
    ? `${cfg.location}-dialogflow.googleapis.com`
    : "dialogflow.googleapis.com";

const flows = new FlowsClient({ apiEndpoint });
const pages = new PagesClient({ apiEndpoint });
const trgc = new TransitionRouteGroupsClient({ apiEndpoint });
const intents = new IntentsClient({ apiEndpoint });

const DATA_DIR = process.env.DATA_DIR || "data/entities";
const BARANGAY_NAME = process.env.BARANGAY_NAME || "Barangay Fairview Park";
const OFFICE_HOURS = process.env.OFFICE_HOURS || "Mon–Fri, 8:00 AM–5:00 PM";
const CONTACT_PHONE = process.env.CONTACT_PHONE || "0917-XXX-XXXX";

const GATING_LOGIN =
  "Online submission is available to verified residents (sign in to continue).";

type Req = {
  base: string;
  variant: string;
  age?: string;
  frequency?: string;
  validity?: string;
  documents?: string[];
  requestor?: string;
  link?: string;
};

// ---------- helpers ----------
function text(msg: string) {
  return { messages: [{ text: { text: [msg] } }] };
}

function readJson<T = any>(rel: string): T {
  const f = path.resolve(process.cwd(), rel);
  return JSON.parse(fs.readFileSync(f, "utf8"));
}

function bullets(list: string[] = []) {
  return list.map((d) => `- ${d}`).join("\n");
}

function serviceLink(base: string) {
  return `/services/action?docB=${encodeURIComponent(base)}`;
}

function normalizeBaseNameForTRG(base: string) {
  return base.replace(/[^\w\s-]/g, "").trim();
}

async function getDefaultStartFlowName(): Promise<string> {
  const [list] = await flows.listFlows({ parent: cfg.parent });
  const found =
    list.find((f) => f.displayName === "Default Start Flow") || list[0];
  if (!found?.name) throw new Error("No Flow found in this agent.");
  return found.name!;
}

async function getStartPage(flowName: string) {
  const [list] = await pages.listPages({ parent: flowName });
  const start =
    list.find((p) => p.displayName === "Start Page") ||
    list.find((p) => (p.displayName || "").toLowerCase().includes("start"));
  if (!start?.name) throw new Error("Start Page not found in this flow.");
  return start;
}

async function listOrCreateTRG(flowName: string, displayName: string, routes: any[]) {
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
    console.log(`Created TRG: ${displayName}`);
    return resp.name!;
  } else {
    await trgc.updateTransitionRouteGroup({
      transitionRouteGroup: {
        name: existing.name,
        displayName,
        transitionRoutes,
      },
      updateMask: { paths: ["transition_routes"] },
    });
    console.log(`Updated TRG: ${displayName}`);
    return existing.name!;
  }
}

async function attachTRGsToPage(pageName: string, trgNames: string[]) {
  const [page] = await pages.getPage({ name: pageName });
  const set = new Set([...(page.transitionRouteGroups || []), ...trgNames]);
  const next = Array.from(set);
  await pages.updatePage({
    page: { name: pageName, transitionRouteGroups: next },
    updateMask: { paths: ["transition_route_groups"] },
  });
  console.log(`Attached ${trgNames.length} TRGs to Start Page.`);
}

function requirementReply(r: Req): string {
  const head = `Requirements for **${r.base} – ${r.variant}** (Age: ${r.age || "—"}; Validity: ${r.validity || "—"}; Frequency: ${r.frequency || "—"}):`;
  const body = bullets(r.documents || []);
  const link = r.link || serviceLink(r.base);
  return [head, body, `Start here: **${link}**`].filter(Boolean).join("\n");
}

function baseReply(base: string, gating = true): string {
  const link = serviceLink(base);
  return `Here’s where to request **${base}**: **${link}**.${gating ? " " + GATING_LOGIN : ""}`;
}

// ---------- main builder ----------
(async () => {
  try {
    const flowName = await getDefaultStartFlowName();
    const startPage = await getStartPage(flowName);

    // Load files from data/entities
    const reqs: Req[] = readJson<Req[]>(path.join(DATA_DIR, "requirements.json"));

    // Map: base -> reqs[]
    const byBase = new Map<string, Req[]>();
    for (const r of reqs) {
      if (!byBase.has(r.base)) byBase.set(r.base, []);
      byBase.get(r.base)!.push(r);
    }

    // Get intent names
    const [intentList] = await intents.listIntents({ parent: cfg.parent });
    const nameByDisplay = new Map(
      intentList.map((i) => [i.displayName || "", i.name || ""])
    );
    const INTENT_REQ = nameByDisplay.get("REQUEST_SERVICE");
    const INTENT_REQS = nameByDisplay.get("REQUIREMENTS_QUERY");
    if (!INTENT_REQ || !INTENT_REQS) {
      throw new Error("Missing intents REQUEST_SERVICE / REQUIREMENTS_QUERY. Run your intent sync first.");
    }

    // Build one TRG per Base
    const trgNames: string[] = [];
    for (const [base, list] of byBase.entries()) {
      const trgDisplay = `Services — ${normalizeBaseNameForTRG(base)}`;
      const routes: any[] = [];

      // Base-only: send link + gating (catch both intents)
      routes.push({
        intent: INTENT_REQ,
        condition: `has($session.params.doc_base) && !$session.params.doc_variant && $session.params.doc_base = "${base}"`,
        triggerFulfillment: text(baseReply(base, true)),
      });
      routes.push({
        intent: INTENT_REQS,
        condition: `has($session.params.doc_base) && !$session.params.doc_variant && $session.params.doc_base = "${base}"`,
        triggerFulfillment: text(
          `${baseReply(base, true)}\nIf you need specific variant requirements (e.g., Residency, No Income, Loan), please specify.`
        ),
      });

      // Base+Variant exact matches → requirements
      for (const r of list) {
        routes.push({
          intent: INTENT_REQ,
          condition: `$session.params.doc_base = "${r.base}" && has($session.params.doc_variant) && $session.params.doc_variant = "${r.variant}"`,
          triggerFulfillment: text(requirementReply(r)),
        });
        routes.push({
          intent: INTENT_REQS,
          condition: `$session.params.doc_base = "${r.base}" && has($session.params.doc_variant) && $session.params.doc_variant = "${r.variant}"`,
          triggerFulfillment: text(requirementReply(r)),
        });
      }

      // Create/Update TRG and collect its resource name
      const trgName = await listOrCreateTRG(flowName, trgDisplay, routes);
      trgNames.push(trgName);
    }

    // Attach all service TRGs to the Start Page (page-level)
    await attachTRGsToPage(startPage.name!, trgNames);

    // Add a simple page-level fallback so unrecognized asks are guided
    const [page] = await pages.getPage({ name: startPage.name! });
    const handlers = [...(page.eventHandlers || [])];
    const idx = handlers.findIndex((h) => h.event === "sys.no-match-default");
    const fallback = {
      event: "sys.no-match-default",
      triggerFulfillment: text(
        `I can help with **Services**, **Incidents**, **Programs**, **Announcements**, and **Officials**.\nTry: "services", "request barangay certificate", "requirements for residency", or "file an incident".`
      ),
    };
    if (idx >= 0) handlers[idx] = fallback as any;
    else handlers.push(fallback as any);

    await pages.updatePage({
      page: { name: startPage.name!, eventHandlers: handlers },
      updateMask: { paths: ["event_handlers"] },
    });
    console.log("Updated Start Page fallback.");

    console.log("sync:services-at-start completed ✅");
  } catch (err: any) {
    console.error("sync:services-at-start failed:", err?.message || err);
    process.exitCode = 1;
  }
})();
