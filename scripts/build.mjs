// Full static build: gen -> next build (out/) -> copy tools/* and shared/* into out/.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { gen } from "./gen.mjs";
import { copyDir, isMain, log, OUT, REGISTRY, ROOT, SHARED, TOOLS, toolDirs } from "./lib.mjs";

export function assemble() {
  if (!fs.existsSync(path.join(OUT, "index.html"))) throw new Error("out/index.html missing — run `next build` first");
  const skip = (rel) => !/(^|\/)(README\.md|\.DS_Store)$/.test(rel);
  const dirs = toolDirs();
  for (const slug of dirs) copyDir(path.join(TOOLS, slug), path.join(OUT, "tools", slug), skip);
  copyDir(SHARED, path.join(OUT, "shared"), (rel) => /\.(js|css)$/.test(rel));
  fs.mkdirSync(path.join(OUT, "tools"), { recursive: true });
  fs.copyFileSync(REGISTRY, path.join(OUT, "tools", "registry.json"));
  log.ok(`assembled out/: site + ${dirs.length} tool(s) [${dirs.join(", ") || "none"}] + shared/`);
}

export function build({ quiet = false } = {}) {
  gen({ quiet });
  log.info("next build …");
  execSync("npx next build", { cwd: ROOT, stdio: quiet ? "pipe" : "inherit" });
  assemble();
}

if (isMain(import.meta.url)) {
  try {
    build();
  } catch (e) {
    log.fail(e.message);
    process.exit(1);
  }
}
