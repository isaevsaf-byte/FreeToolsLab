// npm run check
//   1. registry schema + generated files (gen)
//   2. i18n key parity EN/RU for every tool (and the site dictionary)
//   3. static build -> out/
//   4. Playwright: every page x {en,ru}: zero external requests after load AND after interaction,
//      html[lang] correct, no "[[missing.key]]", no broken same-origin assets
//   5. Lighthouse accessibility >= 95 per page (EN)
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import lighthouse from "lighthouse";
import { build } from "./build.mjs";
import { c, freePort, log, OUT, ROOT, TEMPLATE, TOOLS, toolDirs } from "./lib.mjs";
import { serve } from "./serve.mjs";
import { flattenKeys } from "../shared/i18n.js";

const A11Y_MIN = 95;
const failures = [];
const warnings = [];
const fail = (s) => (failures.push(s), log.fail(s));
const warn = (s) => (warnings.push(s), log.warn(s));
const t0 = Date.now();

/* 1 + 3. gen + build ---------------------------------------------------- */
log.head("1/5 registry + generated files · 3/5 static build");
try {
  build({ quiet: true });
} catch (e) {
  fail(`build failed: ${e.message}`);
  summary();
}

/* 2. i18n parity -------------------------------------------------------- */
log.head("2/5 i18n parity (EN ↔ RU)");
const slugs = toolDirs();
for (const dir of [...slugs.map((s) => path.join(TOOLS, s)), TEMPLATE]) {
  const file = path.join(dir, "i18n.js");
  const name = path.relative(ROOT, file);
  if (!fs.existsSync(file)) {
    fail(`${name} missing`);
    continue;
  }
  const bundle = (await import(pathToFileURL(file).href)).default;
  parity(name, bundle);
}
try {
  const dict = (await import(pathToFileURL(path.join(ROOT, "lib", "dictionary.ts")).href)).dictionary;
  parity("lib/dictionary.ts", dict);
} catch (e) {
  warn(`lib/dictionary.ts could not be imported for parity (${e.message.split("\n")[0]})`);
}

function parity(name, bundle) {
  const en = flattenKeys(bundle?.en);
  const ru = flattenKeys(bundle?.ru);
  const missRu = en.filter((k) => !ru.includes(k));
  const missEn = ru.filter((k) => !en.includes(k));
  if (missRu.length) fail(`${name}: missing in RU: ${missRu.join(", ")}`);
  if (missEn.length) fail(`${name}: missing in EN: ${missEn.join(", ")}`);
  const empty = (obj, lang) => flattenKeys(obj).filter((k) => lookup(obj, k) === "").map((k) => `${lang}.${k}`);
  const blanks = [...empty(bundle?.en, "en"), ...empty(bundle?.ru, "ru")];
  if (blanks.length) warn(`${name}: empty strings: ${blanks.join(", ")}`);
  if (!missRu.length && !missEn.length) log.ok(`${name}: ${en.length} keys, parity OK`);
}
function lookup(obj, key) {
  return key.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

/* 4. Playwright network audit ------------------------------------------- */
log.head("4/5 network audit + render (Playwright, 375px)");
const pages = ["/", "/tools/", "/support/", "/subscribe/", ...slugs.map((s) => `/tools/${s}/`)];
const cdpPort = await freePort();
const srv = await serve(OUT);
let browser;
try {
  browser = await chromium.launch({ args: [`--remote-debugging-port=${cdpPort}`] });
} catch (e) {
  fail(`could not launch Chromium: ${e.message.split("\n")[0]}  → run: npx playwright install chromium`);
  await srv.close();
  summary();
}
const context = await browser.newContext({ viewport: { width: 375, height: 812 }, locale: "en-GB" });
await context.grantPermissions(["clipboard-read", "clipboard-write"]);

for (const p of pages) {
  for (const lang of ["en", "ru"]) {
    const label = `${p}?lang=${lang}`;
    const page = await context.newPage();
    const external = new Set();
    const broken = new Set();
    const errors = [];
    page.on("request", (r) => {
      const u = r.url();
      if (/^https?:/.test(u) && !u.startsWith(srv.url)) external.add(u);
    });
    page.on("response", (r) => {
      if (r.url().startsWith(srv.url) && r.status() >= 400) broken.add(`${r.status()} ${r.url().slice(srv.url.length)}`);
    });
    page.on("requestfailed", (r) => {
      // Next.js aborts its own <Link> prefetches (net::ERR_ABORTED) — that is not a broken asset.
      const reason = r.failure()?.errorText || "";
      if (r.url().startsWith(srv.url) && !/ERR_ABORTED/.test(reason))
        broken.add(`${reason} ${r.url().slice(srv.url.length)}`);
    });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("download", (d) => d.cancel().catch(() => {}));

    try {
      const resp = await page.goto(`${srv.url}${label}`, { waitUntil: "networkidle" });
      if (!resp || resp.status() >= 400) {
        fail(`${label}: HTTP ${resp?.status()}`);
        await page.close();
        continue;
      }
      const isTool = p.startsWith("/tools/") && p !== "/tools/";
      if (isTool) await page.waitForSelector("body[data-ready='1']", { timeout: 10000 });
      await page.waitForTimeout(300); // let LangSync / hydration settle
      const loadExternal = [...external];

      const htmlLang = await page.evaluate(() => document.documentElement.lang);
      if (htmlLang !== lang) fail(`${label}: <html lang> is "${htmlLang}", expected "${lang}"`);
      const text = await page.evaluate(() => document.body.innerText || "");
      if (text.includes("[[")) fail(`${label}: missing i18n keys: ${(text.match(/\[\[[^\]]+\]\]/g) || []).join(", ")}`);
      if (text.replace(/\s+/g, "").length < 40) fail(`${label}: page rendered (almost) empty`);

      // interaction: every input, select, range, button — then network must still be silent
      for (const el of await page.$$("input[type=number]")) {
        const v = Number(await el.inputValue()) || 0;
        await el.fill(String(v + 1));
      }
      for (const el of await page.$$("input[type=range]")) {
        await el.focus();
        await page.keyboard.press("ArrowRight");
      }
      for (const el of await page.$$("select")) {
        const values = await el.$$eval("option", (os) => os.map((o) => o.value));
        if (values.length > 1) await el.selectOption(values[1]);
      }
      for (const el of await page.$$("button:visible")) {
        await el.click({ timeout: 2000 }).catch(() => {});
      }
      await page.waitForTimeout(500);
      await page.waitForLoadState("networkidle");

      const afterExternal = [...external].filter((u) => !loadExternal.includes(u));
      if (loadExternal.length) fail(`${label}: external requests on load: ${loadExternal.join(", ")}`);
      if (afterExternal.length) fail(`${label}: external requests after interaction: ${afterExternal.join(", ")}`);
      if (broken.size) fail(`${label}: broken same-origin requests: ${[...broken].join(", ")}`);
      if (errors.length) warn(`${label}: console/page errors: ${errors.slice(0, 3).join(" | ")}`);
      if (!loadExternal.length && !afterExternal.length && !broken.size) log.ok(`${label}: 0 external requests, lang OK`);
    } catch (e) {
      fail(`${label}: ${e.message.split("\n")[0]}`);
    }
    await page.close();
  }
}

/* 5. Lighthouse a11y ---------------------------------------------------- */
log.head(`5/5 Lighthouse accessibility (>= ${A11Y_MIN})`);
for (const p of pages) {
  const url = `${srv.url}${p}?lang=en`;
  try {
    const r = await lighthouse(url, {
      port: cdpPort,
      output: "json",
      logLevel: "silent",
      onlyCategories: ["accessibility"],
    });
    const score = Math.round((r.lhr.categories.accessibility.score ?? 0) * 100);
    const failing = Object.values(r.lhr.audits)
      .filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== "informative")
      .map((a) => a.id);
    if (score < A11Y_MIN) fail(`${p}: a11y ${score} — ${failing.join(", ")}`);
    else log.ok(`${p}: a11y ${score}${failing.length ? c.dim(`  (${failing.join(", ")})`) : ""}`);
  } catch (e) {
    fail(`${p}: lighthouse error: ${e.message.split("\n")[0]}`);
  }
}

await browser.close();
await srv.close();
summary();

function summary() {
  const s = ((Date.now() - t0) / 1000).toFixed(0);
  console.log("");
  if (failures.length) {
    log.fail(c.bold(`${failures.length} failure(s), ${warnings.length} warning(s) · ${s}s`));
    process.exit(1);
  }
  log.ok(c.bold(`all checks passed · ${warnings.length} warning(s) · ${s}s`));
  process.exit(0);
}
