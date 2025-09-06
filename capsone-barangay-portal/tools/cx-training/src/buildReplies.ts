// tools/cx-training/src/buildReplies.ts
// Bundles reply templates + navigation + requirements into dist/replies.compiled.json
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// ✅ Works in ESM without import attributes / assertions
const services = require("../data/replies/services.json");
const navigation = require("../data/replies/navigation.json");
const requirements = require("../data/entities/requirements.json");

type Requirement = {
  base: string;
  variant?: string;
  age?: string;
  frequency?: string;
  validity?: string;
  documents?: string[];
  requestor?: string;
  link?: string;
};

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}
function warn(msg: string) {
  console.warn(`[buildReplies] ${msg}`);
}

function validate() {
  if (!services?.links || !services?.intents) {
    throw new Error("services.json must contain { links, intents }");
  }
  if (!navigation || typeof navigation !== "object") {
    throw new Error("navigation.json must be an object map of label -> href");
  }
  if (!Array.isArray(requirements)) {
    throw new Error("requirements.json must be an array");
  }

  const basesFromReqs = new Set<string>();
  const dupCheck = new Set<string>();
  for (const r of requirements as Requirement[]) {
    if (!r.base) throw new Error("requirements item missing 'base'");
    basesFromReqs.add(r.base);
    const key = `${r.base}::${r.variant ?? ""}`.toLowerCase();
    if (dupCheck.has(key)) {
      warn(`Duplicate requirement block for ${r.base}${r.variant ? " – " + r.variant : ""}`);
    } else {
      dupCheck.add(key);
    }
    if (!r.link) {
      const fallback = (services.links as Record<string, string>)[r.base];
      if (!fallback) warn(`No link for base '${r.base}' in requirements.json and no fallback in services.links`);
    }
  }

  for (const b of basesFromReqs) {
    if (!(b in (services.links as Record<string, string>))) {
      warn(`services.links is missing a link for base '${b}'`);
    }
  }
}

function buildOutput() {
  return {
    services,
    navigation,
    requirements,
    _meta: {
      generatedAt: new Date().toISOString(),
      counts: {
        requirements: (requirements as Requirement[]).length,
        serviceLinks: Object.keys(services.links || {}).length,
        navigationItems: Object.keys(navigation || {}).length,
      },
    },
  };
}

(function main() {
  try {
    validate();
    const out = buildOutput();
    const distDir = path.resolve(process.cwd(), "dist");
    ensureDir(distDir);
    const outPath = path.join(distDir, "replies.compiled.json");
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf-8");
    console.log(`[buildReplies] Wrote ${outPath}`);
  } catch (err: any) {
    console.error("[buildReplies] Failed:", err?.message || err);
    process.exitCode = 1;
  }
})();
