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
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE, acceptDownloads: true, reducedMotion: "no-preference" });
const page = await ctx.newPage();

// CDP screencast: device-pixel frames (1080x1350 at @2x) with timestamps; ffmpeg turns them into a constant-rate video.
const FR = path.join(OUT, `${slug}.frames`);
fs.rmSync(FR, { recursive: true, force: true });
fs.mkdirSync(FR, { recursive: true });
const cdp = await ctx.newCDPSession(page);
const frames = [];
let firstTs = null;
cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
  const file = path.join(FR, `f${String(frames.length).padStart(5, "0")}.jpg`);
  fs.writeFileSync(file, Buffer.from(data, "base64"));
  if (firstTs === null) firstTs = metadata.timestamp;
  frames.push({ t: metadata.timestamp - firstTs, file });
  cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: W * SCALE, maxHeight: H * SCALE, everyNthFrame: 1 });

// event clock = the screencast clock (seconds since the first frame)
const now = () => (firstTs === null ? 0 : Date.now() / 1000 - firstTs);
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
await pause(0.3);
await cdp.send("Page.stopScreencast").catch(() => {});
await ctx.close();
await browser.close();

// constant-rate video from timestamped frames (each frame holds until the next one)
const end = footage + 0.3;
const list = frames
  .map((f, i) => {
    const next = i + 1 < frames.length ? frames[i + 1].t : end;
    return `file '${f.file}'\nduration ${Math.max(0.001, next - f.t).toFixed(4)}`;
  })
  .join("\n") + `\nfile '${frames[frames.length - 1].file}'\n`;
fs.writeFileSync(path.join(FR, "list.txt"), list);
const mp4 = path.join(OUT, `${slug}.mp4`);
execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i "${path.join(FR, "list.txt")}" -vf "fps=30,scale=${W * SCALE}:${H * SCALE}:force_original_aspect_ratio=decrease,pad=${W * SCALE}:${H * SCALE}:(ow-iw)/2:(oh-ih)/2:color=white" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${mp4}"`);
fs.rmSync(FR, { recursive: true, force: true });
fs.writeFileSync(path.join(OUT, `${slug}.events.json`), JSON.stringify({ slug, video: `demo/${slug}.mp4`, width: W * SCALE, height: H * SCALE, footage: end, events }, null, 2));
log.ok(`recorded ${c.cyan(`remotion/public/demo/${slug}.mp4`)} (${end.toFixed(1)}s, ${frames.length} frames, ${events.length} events)`);
