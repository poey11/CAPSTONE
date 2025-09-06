// tools/cx-training/src/cx/syncEntities.ts
// ESM-friendly: explicit .js extension + JSON via createRequire

import { clients, cxConfig } from "./auth.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// ✅ JSON without import attributes
const bases = require("../../data/entities/doc_bases.json") as any[];
const variantsByBase = require("../../data/entities/doc_variants_by_base.json") as any[];

/**
 * Creates/updates @doc_base and @doc_variant (KIND_MAP + fuzzy).
 * Run: npm run sync:entities
 */
async function upsertEntityType(
  displayName: string,
  entities: { value: string; synonyms: string[] }[]
) {
  const { parent } = cxConfig();
  const [list] = await clients.entities.listEntityTypes({ parent });
  const et = list.find((e: any) => e.displayName === displayName); // ← avoid TS7006

  const payload = {
    displayName,
    kind: "KIND_MAP" as const,
    enableFuzzyExtraction: true,
    entities: entities.map((e) => ({ value: e.value, synonyms: e.synonyms })),
  };

  if (!et) {
    const [resp] = await clients.entities.createEntityType({ parent, entityType: payload });
    console.log(`Created entity: ${resp.displayName}`);
  } else {
    const name = et.name!;
    const [resp] = await clients.entities.updateEntityType({
      entityType: { name, ...payload },
      updateMask: { paths: ["entities", "enable_fuzzy_extraction", "kind"] },
    });
    console.log(`Updated entity: ${resp.displayName}`);
  }
}

function flattenDocBase() {
  return bases.map((b: any) => ({
    value: b.base,
    synonyms: Array.from(new Set([b.base, ...b.synonyms.en, ...b.synonyms.fil])),
  }));
}

function flattenVariants() {
  const out: { value: string; synonyms: string[] }[] = [];
  for (const b of variantsByBase as any[]) {
    for (const v of b.variants) {
      out.push({
        value: v.name,
        synonyms: Array.from(new Set([v.name, ...v.synonyms.en, ...v.synonyms.fil])),
      });
    }
  }
  return out;
}

(async () => {
  await upsertEntityType("doc_base", flattenDocBase());
  await upsertEntityType("doc_variant", flattenVariants());
})();
