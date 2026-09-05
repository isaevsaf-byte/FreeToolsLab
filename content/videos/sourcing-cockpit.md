# Sourcing Cockpit — video

Tue 2026-09-15 08:15 UK · 1080×1350 · 30fps · 40 s · no emojis on screen · figures are the artifact's illustrative defaults (GBP).

## Approach: real screen recording + Remotion overlays (same pipeline as Payment Terms Lens)

The footage IS the artifact. Playwright drives `content/artifacts/sourcing-cockpit.html` (served locally, dark theme, 1080×1350 viewport at 2× or a 1180-wide desktop viewport cropped and panned) and records it; every click is logged with a timestamp. Remotion adds title, captions synced to the clicks, click ripples, two zooms and the credit card. Nothing is redrawn by hand.

Pipeline: `scripts/record.mjs` with a new scenario `sourcing-cockpit` → `demo.webm` + `events.json` → Remotion composition `ToolDemo` → mp4.

Why this scenario works on video: every click produces a visible consequence somewhere else on the screen (award date, red slip bar, funnel, savings). The story is "one click, three numbers move".

## Shot list (as recorded, `npm run record sourcing-cockpit`)

Title 2 s "Status is a state, not a deck." → footage 35.8 s → credit 2 s "Live cockpit: link in the first comment · Safar Isaev".

| Time in video | Caption | |
|---|---|---|
| 2.7 s | One link. The whole sourcing project. | zoom
| 6.7 s | Six stages. Six vendors. One number. |
| 10.7 s | Legal slipped a week. Log it. |
| 12.7 s | The award date moves. Nobody rewrites a slide. | zoom
| 17.3 s | Plan vs actual. The slip is red. |
| 21.0 s | Award. The list becomes a recommendation. | zoom
| 26.3 s | Legal signed. One click. |
| 29.5 s | One PNG for the steering email. |
| 34.3 s | keep this cockpit updated from my Friday notes | zoom

Footage: `remotion/public/sourcing-cockpit/demo.mp4`, events: `events.json`. Script: `scripts/record/sourcing-cockpit.mjs`. The page is `content/artifacts/sourcing-cockpit.html?theme=dark&seed=negotiation` (seed = pre-award state, not persisted).

## Render
```
cd remotion && npx remotion render src/index.ts sourcing-cockpit out/sourcing-cockpit.mp4
```
Composition id `sourcing-cockpit`, 1080×1350, 30fps. Reuses `ToolDemo`.
