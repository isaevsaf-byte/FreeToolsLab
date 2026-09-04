// Generates derived files and validates the catalogue. Runs before dev/build/check/og/new.
//   - shared/site.js   <- site/config.json (so vanilla tools can read credit lines / links without fetch)
//   - validates tools/registry.json against tools/registry.schema.json
//   - warns about registry <-> folder drift
import fs from "node:fs";
import path from "node:path";
import { isMain, log, readRegistry, readSiteConfig, SHARED, TOOLS, toolDirs, validateRegistry } from "./lib.mjs";

export function gen({ quiet = false } = {}) {
  const registry = readRegistry();
  const errors = validateRegistry(registry);
  if (errors.length) {
    errors.forEach((e) => log.fail(`registry: ${e}`));
    throw new Error(`tools/registry.json has ${errors.length} error(s)`);
  }

  const site = readSiteConfig();
  const out = path.join(SHARED, "site.js");
  const body =
    `// GENERATED from site/config.json by scripts/gen.mjs — do not edit, edit site/config.json.\n` +
    `export const SITE = ${JSON.stringify(site, null, 2)};\n`;
  if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== body) fs.writeFileSync(out, body);

  const dirs = new Set(toolDirs());
  const known = new Set(registry.tools.map((t) => t.id));
  const warnings = [];
  for (const t of registry.tools) {
    if (t.status === "live" && !dirs.has(t.id))
      warnings.push(`"${t.id}" is live in the registry but tools/${t.id}/index.html does not exist`);
  }
  for (const d of dirs) if (!known.has(d)) warnings.push(`tools/${d}/ exists but is not in tools/registry.json`);
  if (!quiet) {
    log.ok(`registry valid (${registry.tools.length} tools, ${dirs.size} with code) · shared/site.js up to date`);
    warnings.forEach((w) => log.warn(w));
  }
  return { registry, site, warnings };
}

if (isMain(import.meta.url)) {
  try {
    gen();
  } catch (e) {
    log.fail(e.message);
    process.exit(1);
  }
}
