// node scripts/record-page.mjs <slug>  -> remotion/public/<slug>/{demo.mp4,events.json}
//
// Generic page recorder: films ANY page served from the repo root (a tool, or an artifact source under
// content/artifacts/) with Playwright (CDP screencast) at a phone-size viewport (540x675 CSS px @2x =
// 1080x1350) and logs every interaction with a timestamp. The per-page shot list is a plain list of
// steps in scripts/record/<slug>.mjs (exports `steps(api)` and optionally `query`).
// scripts/record.mjs is the tool-specific recorder; this one exists so artifacts can be filmed too.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import { c, log, ROOT } from "./lib.mjs";
import { serve } from "./serve.mjs";

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const scriptPath = slug && path.join(ROOT, "scripts", "record", `${slug}.mjs`);
if (!slug || !fs.existsSync(scriptPath)) {
  log.fail("usage: node scripts/record-page.mjs <slug>   (scripts/record/<slug>.mjs must exist)");
  process.exit(1);
}

const VIEW = { width: 540, height: 675 }; // CSS px; @2x -> 1080x1350
const SCALE = 2;
const outDir = path.join(ROOT, "remotion", "public", slug);
const tmpDir = path.join(outDir, ".rec");
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });

const { steps, query = "lang=en&theme=dark" } = await import(scriptPath);

let srv, browser;
try {
  srv = await serve(ROOT);
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: SCALE, acceptDownloads: true, reducedMotion: "no-preference" });
  const page = await context.newPage();
  // headless has no clipboard; let "copy" actions succeed so the page shows its success state
  await context.addInitScript(() => { Object.defineProperty(navigator, "clipboard", { value: { write: async () => {}, writeText: async () => {} }, configurable: true }); });
  page.on("pageerror", (e) => log.fail(`page error: ${e.message}`));

  // CDP screencast: device-pixel frames with real timestamps, so footage and events share one clock.
  const cdp = await context.newCDPSession(page);
  const frames = [];
  let firstTs = null;
  cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
    const file = path.join(tmpDir, `f${String(frames.length).padStart(6, "0")}.jpg`);
    fs.writeFileSync(file, Buffer.from(data, "base64"));
    frames.push({ file, ts: metadata.timestamp });
    if (firstTs === null) firstTs = metadata.timestamp;
    await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 95, maxWidth: VIEW.width * SCALE, maxHeight: VIEW.height * SCALE, everyNthFrame: 1 });
  const events = [];
  const now = () => Date.now() / 1000 - (firstTs ?? Date.now() / 1000);

  const centre = async (sel) => {
    const box = await page.locator(sel).first().boundingBox();
    if (!box) throw new Error(`not visible: ${sel}`);
    return { x: Math.round((box.x + box.width / 2) * SCALE), y: Math.round((box.y + box.height / 2) * SCALE) };
  };

  const api = {
    page,
    now,
    async goto(pathname) {
      await page.goto(`${srv.url}${pathname}?${query}`, { waitUntil: "load" });
      await page.waitForFunction(() => document.body?.dataset.ready === "1", null, { timeout: 15000 });
      await page.evaluate(() => document.fonts.ready);
    },
    async hold(seconds) {
      await page.waitForTimeout(seconds * 1000);
    },
    async note(caption, { zoom, scale = 1.15 } = {}) {
      const ev = { t: now(), caption };
      if (zoom) ev.zoom = { ...(await centre(zoom)), scale };
      events.push(ev);
    },
    async tap(sel, caption, { zoom, scale = 1.15 } = {}) {
      const loc = page.locator(sel).first();
      await loc.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      const at = await centre(sel);
      const ev = { t: now(), ...at, tap: true };
      if (caption) ev.caption = caption;
      await loc.click();
      if (zoom) {
        await page.waitForTimeout(100);
        ev.zoom = { ...(await centre(zoom)), scale };
      }
      events.push(ev);
    },
    async keys(sel, key, times, gapMs, caption, { zoom, scale = 1.15 } = {}) {
      const loc = page.locator(sel).first();
      await loc.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      await loc.focus();
      const ev = { t: now(), ...(await centre(sel)), tap: true, caption };
      events.push(ev);
      for (let i = 0; i < times; i++) {
        await page.keyboard.press(key);
        await page.waitForTimeout(gapMs);
      }
      if (zoom) ev.zoom = { ...(await centre(zoom)), scale };
    },
    /** Type into an input (no event logged; the Apply tap that follows is the visible action). */
    async fill(sel, value) {
      await page.locator(sel).first().fill(String(value));
    },
    /** Wait for a selector to be visible. */
    async waitFor(sel, timeout = 10000) {
      await page.locator(sel).first().waitFor({ state: "visible", timeout });
    },
    async scrollTo(sel, block = "center") {
      await page.locator(sel).first().evaluate((el, b) => el.scrollIntoView({ block: b, behavior: "smooth" }), block);
      await page.waitForTimeout(500);
    },
    async download(sel, filename, caption) {
      const [dl] = await Promise.all([page.waitForEvent("download"), api.tap(sel, caption)]);
      await dl.saveAs(path.join(outDir, filename));
      events.at(-1).file = filename;
    },
  };

  await steps(api);
  const end = now();
  await cdp.send("Page.stopScreencast");
  await page.waitForTimeout(200);
  await browser.close();
  await srv.close();
  if (frames.length < 2) throw new Error("screencast produced no frames");

  const list = frames
    .map((f, i) => `file '${f.file}'\nduration ${Math.max(0.001, (i + 1 < frames.length ? frames[i + 1].ts : firstTs + end) - f.ts).toFixed(4)}`)
    .join("\n") + `\nfile '${frames.at(-1).file}'\n`;
  const listFile = path.join(tmpDir, "frames.txt");
  fs.writeFileSync(listFile, list);
  const mp4 = path.join(outDir, "demo.mp4");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listFile, "-vf", `scale=${VIEW.width * SCALE}:${VIEW.height * SCALE},fps=30`, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "slow", "-movflags", "+faststart", mp4]);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.writeFileSync(path.join(outDir, "events.json"), JSON.stringify({ slug, duration: end, width: VIEW.width * SCALE, height: VIEW.height * SCALE, events }, null, 2) + "\n");
  log.ok(`recorded ${c.cyan(path.relative(ROOT, mp4))} (${end.toFixed(1)}s, ${events.length} events)`);
} catch (e) {
  log.fail(e.stack || e.message);
  await browser?.close();
  await srv?.close();
  process.exit(1);
}
