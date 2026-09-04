// Shared helpers for FreeToolsLab scripts (Node >= 20, ESM).
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const TOOLS = path.join(ROOT, "tools");
export const TEMPLATE = path.join(TOOLS, "_template");
export const REGISTRY = path.join(TOOLS, "registry.json");
export const SCHEMA = path.join(TOOLS, "registry.schema.json");
export const SITE_CONFIG = path.join(ROOT, "site", "config.json");
export const SHARED = path.join(ROOT, "shared");
export const OUT = path.join(ROOT, "out");

const tty = process.stdout.isTTY;
const paint = (code) => (s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : String(s));
export const c = {
  red: paint(31),
  green: paint(32),
  yellow: paint(33),
  cyan: paint(36),
  dim: paint(2),
  bold: paint(1),
};
export const log = {
  ok: (s) => console.log(`${c.green("✔")} ${s}`),
  warn: (s) => console.log(`${c.yellow("!")} ${s}`),
  fail: (s) => console.log(`${c.red("✖")} ${s}`),
  info: (s) => console.log(`${c.dim("·")} ${s}`),
  head: (s) => console.log(`\n${c.bold(s)}`),
};

export const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
export const writeJson = (p, obj) => fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
export const readRegistry = () => readJson(REGISTRY);
export const writeRegistry = (r) => writeJson(REGISTRY, r);
export const readSiteConfig = () => readJson(SITE_CONFIG);

export const isMain = (metaUrl) =>
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(metaUrl);

/** Validate the registry against the subset of JSON Schema used in registry.schema.json. */
export function validateRegistry(registry, schema = readJson(SCHEMA)) {
  const errors = [];
  if (!Array.isArray(registry?.tools)) return ["registry.tools must be an array"];
  const item = schema.properties.tools.items;
  const ids = new Set();
  registry.tools.forEach((t, i) => {
    const where = `tools[${i}]${t?.id ? ` (${t.id})` : ""}`;
    for (const req of item.required) if (!(req in t)) errors.push(`${where}: missing "${req}"`);
    for (const [k, rule] of Object.entries(item.properties)) {
      if (!(k in t)) continue;
      const v = t[k];
      if (rule.type === "string" && typeof v !== "string") errors.push(`${where}: "${k}" must be a string`);
      if (rule.pattern && typeof v === "string" && !new RegExp(rule.pattern).test(v))
        errors.push(`${where}: "${k}" must match ${rule.pattern}`);
      if (rule.enum && !rule.enum.includes(v)) errors.push(`${where}: "${k}" must be one of ${rule.enum.join(" | ")}`);
      if (rule.maxLength && typeof v === "string" && v.length > rule.maxLength)
        errors.push(`${where}: "${k}" is longer than ${rule.maxLength} chars`);
    }
    if (t.id) {
      if (ids.has(t.id)) errors.push(`${where}: duplicate id`);
      ids.add(t.id);
      if (t.url && t.url !== `/tools/${t.id}/`) errors.push(`${where}: url must be /tools/${t.id}/`);
    }
    if (t.status === "live" && !/^\d{4}-\d{2}-\d{2}$/.test(t.added || ""))
      errors.push(`${where}: a live tool needs an ISO "added" date`);
  });
  return errors;
}

/** Tool folders that have an index.html (servable). Excludes `_template`. */
export function toolDirs() {
  return fs
    .readdirSync(TOOLS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name)
    .filter((name) => fs.existsSync(path.join(TOOLS, name, "index.html")))
    .sort();
}

export const slugToTitle = (slug) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

/** Recursive copy. `filter(relPath, dirent)` returns false to skip. */
export function copyDir(src, dst, filter = () => true, rel = "") {
  fs.mkdirSync(dst, { recursive: true });
  for (const d of fs.readdirSync(src, { withFileTypes: true })) {
    const r = rel ? `${rel}/${d.name}` : d.name;
    if (!filter(r, d)) continue;
    const s = path.join(src, d.name);
    const t = path.join(dst, d.name);
    if (d.isDirectory()) copyDir(s, t, filter, r);
    else fs.copyFileSync(s, t);
  }
}

export function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

export const escapeHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const escapeJs = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
