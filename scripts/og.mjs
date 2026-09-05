// npm run og <slug> [--no-build]  -> tools/<slug>/og.png (1200x630 screenshot of ?og=1)
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { build } from "./build.mjs";
import { c, log, OUT, TOOLS } from "./lib.mjs";
import { serve } from "./serve.mjs";

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const noBuild = args.includes("--no-build");
if (!slug || !fs.existsSync(path.join(TOOLS, slug, "index.html"))) {
  log.fail("usage: npm run og <slug>   (tools/<slug>/index.html must exist)");
  process.exit(1);
}

try {
  if (!noBuild || !fs.existsSync(path.join(OUT, "tools", slug, "index.html"))) build({ quiet: true });
  const srv = await serve(OUT);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(`${srv.url}/tools/${slug}/?og=1&lang=en&theme=dark`, { waitUntil: "networkidle" });
  await page.waitForSelector("body[data-ready='1']", { timeout: 10000 });
  await page.evaluate(() => document.fonts.ready);
  const target = path.join(TOOLS, slug, "og.png");
  await page.screenshot({ path: target, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  fs.copyFileSync(target, path.join(OUT, "tools", slug, "og.png"));
  await browser.close();
  await srv.close();
  log.ok(`OG image written: ${c.cyan(path.relative(process.cwd(), target))}`);
} catch (e) {
  log.fail(e.message);
  process.exit(1);
}
