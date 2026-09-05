// npm run record <slug>  -> remotion/public/demo/<slug>.mp4 + <slug>.events.json (+ <slug>.export.png)
// Drives the real tool in a phone-size viewport (540x675 @2x = 1080x1350), records the screen and logs
// every tap / caption / zoom with a timestamp so Remotion can overlay them. Nothing is redrawn by hand.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { c, log, ROOT } from "./lib.mjs";

const slug = process.argv[2] || "payment-terms-lens";
const base = process.env.TOOL_URL || `http://localhost:4173/tools/${slug}/`;
const OUT = path.join(ROOT, "remotion", "public", "demo");
const W = 540, H = 675, SCALE = 2;
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: SCALE,
  recordVideo: { dir: OUT, size: { width: W * SCALE, height: H * SCALE } },
  acceptDownloads: true,
  reducedMotion: "no-preference",
});
const page = await ctx.newPage();
const t0 = Date.now();
const now = () => (Date.now() - t0) / 1000;
const events = [];
const pause = (s) => page.waitForTimeout(s * 1000);
const caption = (text, dur) => events.push({ t: now(), dur, caption: text });
async function center(sel) {
  const el = await page.$(sel);
  const b = await el.boundingBox();
  return { el, x: (b.x + b.width / 2) * SCALE, y: (b.y + b.height / 2) * SCALE };
}
async function tap(sel) {
  await page.$eval(sel, (el) => el.scrollIntoView({ block: "center" }));
  await pause(0.5);
  const { el, x, y } = await center(sel);
  events.push({ t: now(), x, y, tap: true });
  await el.click();
}
async function zoom(sel, scale, dur) {
  const { x, y } = await center(sel);
  events.push({ t: now(), dur, zoom: { x, y, scale } });
}
async function scrollTo(sel, block = "start") {
  await page.evaluate(([s, b]) => document.querySelector(s).scrollIntoView({ behavior: "smooth", block: b }), [sel, block]);
  await pause(0.8);
}

// ---- the shot list (see content/videos/<slug>.md) ----
await page.goto(base + "?lang=en", { waitUntil: "networkidle" });
await page.waitForSelector("body[data-ready='1']");
await page.evaluate(() => document.fonts.ready);
await pause(0.6);
caption("£1.2m a year. Terms 30 → 60.", 3);
await pause(2.4);

await zoom("[data-out='headline']", 1.18, 3.2);
caption("Your side.", 3);
await pause(3.4);

await scrollTo(".rates", "start");
caption("The supplier pays £11,836.", 3.2);
await zoom("[data-out='flyValR']", 1.15, 3);
await pause(3.4);

caption("Smaller supplier, dearer money.", 4);
const sr = await page.$("#sr");
await sr.focus();
for (let i = 0; i < 12; i++) { await page.keyboard.press("ArrowRight"); await pause(0.09); }
await pause(0.4);
await zoom("[data-out='flyValR']", 1.15, 2.6);
await pause(2.8);

await scrollTo(".ask", "start");
caption("Now read it as the supplier.", 3.2);
await tap("[data-who='supplier']");
await pause(3.2);

await tap("[data-who='buyer']");
await pause(0.6);
await scrollTo("#refine", "start");
await page.evaluate(() => { document.querySelector("#refine").open = true; });
await pause(0.6);
caption("2% for 20 days is 37% a year.", 4.2);
await tap("[data-preset='30,10,2']");
await pause(0.8);
await scrollTo(".stats", "start");
await zoom("[data-out='apr']", 1.2, 3);
await pause(3.2);

await scrollTo("[data-action='png']", "center");
caption("Copy the picture into your next call.", 3.4);
const [dl] = await Promise.all([page.waitForEvent("download"), tap("[data-action='png']")]);
await dl.saveAs(path.join(OUT, `${slug}.export.png`));
events.push({ t: now() + 0.4, dur: 2.6, image: `demo/${slug}.export.png` });
await pause(3.2);
const footage = now();

await ctx.close();
await browser.close();
const webm = fs.readdirSync(OUT).find((f) => f.endsWith(".webm"));
const mp4 = path.join(OUT, `${slug}.mp4`);
execSync(`ffmpeg -y -loglevel error -i "${path.join(OUT, webm)}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${mp4}"`);
fs.unlinkSync(path.join(OUT, webm));
fs.writeFileSync(path.join(OUT, `${slug}.events.json`), JSON.stringify({ slug, video: `demo/${slug}.mp4`, width: W * SCALE, height: H * SCALE, footage, events }, null, 2));
log.ok(`recorded ${c.cyan(`remotion/public/demo/${slug}.mp4`)} (${footage.toFixed(1)}s, ${events.length} events)`);
