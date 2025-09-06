// tools/cx-training/src/cx/syncIntents.ts
import { clients, cxConfig } from "./auth.js";

type CoreParam = { id: "doc_base" | "doc_variant"; entityDisplayName: "doc_base" | "doc_variant"; isList?: boolean };
type CoreIntent = { displayName: string; trainingPhrases: string[]; parameters?: CoreParam[] };

const CORE_INTENTS: CoreIntent[] = [
  {
    displayName: "REQUEST_SERVICE",
    trainingPhrases: [
      "Where can I request barangay documents?",
      "Where can I request barangay certificate?",
      "How to apply for a document",
      "Need a certificate from the barangay",
      "Kailangan ko ng certificate",
      "Get a document online",
    ],
    parameters: [
      { id: "doc_base", entityDisplayName: "doc_base" },
      { id: "doc_variant", entityDisplayName: "doc_variant" },
    ],
  },
  {
    displayName: "REQUIREMENTS_QUERY",
    trainingPhrases: [
      "What are the requirements for the certificate",
      "Requirements for a barangay document",
      "Ano ang requirements ng dokumento",
      "Kailangan para sa variant ng certificate",
      "List the requirements for this document",
    ],
    parameters: [
      { id: "doc_base", entityDisplayName: "doc_base" },
      { id: "doc_variant", entityDisplayName: "doc_variant" },
    ],
  },
  { displayName: "INCIDENT_HOW_TO_FILE", trainingPhrases: ["How can I file an incident", "Paano mag-file ng reklamo", "Where do I start my report"] },
  { displayName: "INCIDENT_DEPARTMENT_INFO", trainingPhrases: ["Difference between Lupon VAWC BCPC GAD", "Saan ako mag-file Lupon o VAWC", "BCPC vs GAD"] },
  { displayName: "INCIDENT_STATUS_MEANING", trainingPhrases: ["Status codes meaning", "Ano ibig sabihin ng archived", "Why is my case pending"] },
  { displayName: "INFO_OFFICE_HOURS", trainingPhrases: ["Office hours", "Anong oras bukas barangay"] },
  { displayName: "INFO_HOTLINES", trainingPhrases: ["Hotline number", "Contact number ng barangay"] },
  { displayName: "INFO_LOCATION", trainingPhrases: ["Where is the barangay hall", "Saan ang barangay hall"] },
  { displayName: "INFO_ANNOUNCEMENTS", trainingPhrases: ["Any announcements", "Anong bago"] },
  { displayName: "INFO_OFFICIALS", trainingPhrases: ["Who are the barangay officials", "Sino ang mga opisyal"] },
];

async function resolveEntityTypeNames() {
  const { parent } = cxConfig();
  const [list] = await clients.entities.listEntityTypes({ parent });
  const byDisplay = new Map(list.map((e) => [e.displayName || "", e.name || ""]));
  const docBase = byDisplay.get("doc_base");
  const docVariant = byDisplay.get("doc_variant");
  if (!docBase || !docVariant) throw new Error("Missing entity types 'doc_base'/'doc_variant'. Run sync:entities first.");
  return { docBase, docVariant };
}

function buildTrainingPhrases(phrases: string[]) {
  // Add repeatCount to satisfy CX requirement
  return phrases.map((text) => ({ parts: [{ text }], repeatCount: 1 }));
}

async function upsertIntent(def: CoreIntent, entities: { docBase: string; docVariant: string }) {
  const { parent } = cxConfig();
  const [existing] = await clients.intents.listIntents({ parent });
  const found = existing.find((i) => i.displayName === def.displayName);

  const parameters =
    def.parameters?.map((p) => ({
      id: p.id,
      isList: p.isList ?? false,
      entityType: p.entityDisplayName === "doc_base" ? entities.docBase : entities.docVariant,
    })) || [];

  const payload: any = {
    displayName: def.displayName,
    trainingPhrases: buildTrainingPhrases(def.trainingPhrases),
    parameters: parameters.length ? parameters : undefined,
  };

  if (!found) {
    const [resp] = await clients.intents.createIntent({ parent, intent: payload });
    console.log(`Created intent: ${resp.displayName}`);
  } else {
    const name = found.name!;
    const [resp] = await clients.intents.updateIntent({
      intent: { name, ...payload },
      updateMask: { paths: ["training_phrases", "parameters"] },
    });
    console.log(`Updated intent: ${resp.displayName}`);
  }
}

(async () => {
  try {
    const entities = await resolveEntityTypeNames();
    for (const def of CORE_INTENTS) await upsertIntent(def, entities);
  } catch (err: any) {
    console.error("sync:intents failed:", err?.message || err);
    process.exitCode = 1;
  }
})();
