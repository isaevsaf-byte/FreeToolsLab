// npm run new <slug>  -> scaffolds tools/<slug>/ from tools/_template/ and adds a registry stub.
import fs from "node:fs";
import path from "node:path";
import { gen } from "./gen.mjs";
import {
  c,
  escapeHtml,
  escapeJs,
  log,
  readRegistry,
  slugToTitle,
  TEMPLATE,
  TOOLS,
  writeRegistry,
} from "./lib.mjs";

const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+$/.test(slug) || slug.startsWith("_")) {
  log.fail("usage: npm run new <slug>   (lowercase letters, digits, hyphens)");
  process.exit(1);
}
const dir = path.join(TOOLS, slug);
if (fs.existsSync(path.join(dir, "index.html"))) {
  log.fail(`tools/${slug}/index.html already exists`);
  process.exit(1);
}

// 1. registry stub (or reuse the existing entry)
const registry = readRegistry();
let entry = registry.tools.find((t) => t.id === slug);
if (!entry) {
  entry = {
    id: slug,
    name_en: slugToTitle(slug),
    name_ru: slugToTitle(slug),
    tagline_en: "",
    tagline_ru: "",
    category: "procurement",
    status: "next",
    added: "",
    url: `/tools/${slug}/`,
    post_url: "",
  };
  registry.tools.push(entry);
  writeRegistry(registry);
  log.ok(`registry stub added for "${slug}" (status: next)`);
} else {
  log.ok(`registry entry found for "${slug}" (status: ${entry.status})`);
}

// 2. copy template with placeholders filled
const fill = {
  __SLUG__: slug,
  __NAME_EN__: entry.name_en,
  __NAME_RU__: entry.name_ru,
  __TAGLINE_EN__: entry.tagline_en || `Fill the tagline in tools/registry.json and tools/${slug}/i18n.js.`,
  __TAGLINE_RU__: entry.tagline_ru || `Заполните tagline в tools/registry.json и tools/${slug}/i18n.js.`,
};
fs.mkdirSync(dir, { recursive: true });
for (const file of ["index.html", "tool.js", "i18n.js"]) {
  const esc = file.endsWith(".html") ? escapeHtml : escapeJs;
  let text = fs.readFileSync(path.join(TEMPLATE, file), "utf8");
  for (const [k, v] of Object.entries(fill)) text = text.split(k).join(esc(v));
  fs.writeFileSync(path.join(dir, file), text);
}
log.ok(`tools/${slug}/ scaffolded (index.html, tool.js, i18n.js)`);

// 3. regenerate derived files
gen({ quiet: true });

console.log(`
${c.bold("Next (CLAUDE.md checklist):")}
  1. Replace the illustrative inputs/formulas/visual in tools/${slug}/tool.js + index.html
  2. Fill tools/registry.json: taglines, category, status "live" + added date when it ships
  3. Formulas: comment block at the top of tool.js AND the visible Assumptions block
  4. ${c.cyan(`npm run dev`)}  -> http://localhost:4173/tools/${slug}/   (?lang=ru · ?og=1)
  5. ${c.cyan(`npm run og ${slug}`)}  -> tools/${slug}/og.png
  6. content/posts/YYYY-MM-DD-${slug}.md  ·  content/calendar.md: next -> shipped
  7. ${c.cyan("npm run check")}
`);
