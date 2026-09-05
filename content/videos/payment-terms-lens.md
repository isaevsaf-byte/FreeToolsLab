# Payment Terms Lens — video

Thu 2026-09-10 15:15 UK · 1080×1350 · 30fps · 28 s · no emojis on screen · numbers are the tool's illustrative defaults (GBP).

## Status

Pipeline built 2026-09-05: `scripts/record.mjs` + `scripts/record/payment-terms-lens.mjs` + Remotion `ToolDemo`. First render: `remotion/out/payment-terms-lens.mp4`, 30.8 s (1.5 s title + 27.3 s footage + 2 s credit). Timings below are the plan; actual tap times are in `remotion/public/payment-terms-lens/events.json`. Open: trim footage holds by ~3 s to land on 28 s; title font falls back to system sans until Manrope is bundled; no sound yet.

## Approach: real screen recording + Remotion on top (chosen)

The footage IS the tool. Playwright drives the real page at a phone-size viewport (540×675 @2x → 1080×1350) and records it; every tap is logged with a timestamp and coordinates. Remotion adds what a raw recording lacks: a 1.5 s title, short captions synced to the taps, a tap ripple, one zoom on the number that changes, and the credit card. Nothing is re-drawn by hand, so the video can never drift from the product, and the same pipeline films every future tool.

Pipeline: `scripts/record.mjs` (Playwright + CDP screencast: interactions → `demo.mp4` + `events.json` + `export.png`) → Remotion composition `ToolDemo` (`<OffthreadVideo src=demo.mp4>` + overlays driven by `events.json`) → `render` → mp4.

## Shot list (what the script does, second by second)

| Time | Screen (real tool) | Playwright action | Remotion overlay |
|------|--------------------|-------------------|------------------|
| 0:00–0:01.5 | dark title card | — | "Payment terms are a loan." (Manrope 800) |
| 0:01.5–0:04 | tool loads, defaults: 30 → 60, £1.2m | goto, wait ready | caption: "£1.2m a year. Terms 30 → 60." |
| 0:04–0:08 | headline "Moving to 60 days saves you £5,918 a year." | pause | zoom 1.15 on the headline number; caption: "Your side." |
| 0:08–0:12 | butterfly: supplier bar twice as long | scroll to visual | caption: "The supplier pays £11,836." tap ripple none |
| 0:12–0:16 | supplier rate slider 12 → 18 | 12 ArrowRight presses, 80 ms apart | caption: "Smaller supplier, dearer money." zoom on the red value |
| 0:16–0:19 | tap "the supplier" | click chip | labels flip; caption: "Now read it as the supplier." |
| 0:19–0:23 | More → 2/10 net 30 | open details, click chip | tiles appear; caption: "2% for 20 days is 37% a year." zoom on 37% |
| 0:23–0:26 | tap Download PNG, the PNG appears | click | caption: "Copy the picture into your next call." |
| 0:26–0:28 | credit card | — | "freetoolslab.org/tools/payment-terms-lens · Safar Isaev" fade |

Music: none or a single soft UI click per tap (from events.json), one low hit at 0:19 (the 37% reveal). Silence on the credit.

Captions: ≤ 7 words, bottom third, mono, one at a time. Cursor: not shown; a 300 ms ripple at each logged tap instead.

## Remotion notes
- Composition id `payment-terms-lens`, 1080×1350, 30fps, 840 frames.
- Props: `{ video: string; events: { t: number; x: number; y: number; caption?: string; zoom?: { x: number; y: number; scale: number } }[] }`.
- Zoom = `spring({ damping: 14 })` on `transform: scale()` with transform-origin at the event point; captions `interpolate` opacity over 6 frames.
- Title and credit cards use tokens from `shared/tokens.css` (mirrored in `remotion/src/tokens.ts`).

## Option B (kept for reference): motion graphics from scratch
The earlier script (blocks, bars and counters animated in Remotion without footage) is in git history (commit 2b4159d). Use it only if the recording approach fails on LinkedIn compression.
