# remotion/ — tool videos

Separate npm package (install it with `cd remotion && npm install`). Format per `content/videos/_TEMPLATE.md`: 1080×1350, 30 fps, palette from `shared/tokens.css` (mirrored in `src/tokens.ts`).

## Pipeline: real screen recording + Remotion on top

1. `npm run dev` in the repo root (static server on :4173).
2. `npm run record <slug>` — Playwright drives the real tool at 540×675 @2x, records the screen and logs every tap, caption and zoom with a timestamp → `public/demo/<slug>.mp4`, `<slug>.events.json`, `<slug>.export.png`. The shot list lives in `scripts/record.mjs` (one block per tool).
3. `cd remotion && npx remotion render src/index.ts <slug> out/<slug>.mp4` — `ToolDemo` plays the footage and adds the title card, captions, tap ripples, zooms, the PNG reveal and the credit card. `npm run studio` to preview.

Nothing is redrawn by hand, so the video cannot drift from the product. `public/demo/*.mp4` and `out/` are git-ignored: re-record to regenerate.
