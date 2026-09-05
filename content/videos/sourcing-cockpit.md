# Sourcing Cockpit — video

Tue 2026-09-15 08:15 UK · 1080×1350 · 30fps · 45 s · no emojis on screen · figures are the artifact's illustrative defaults (GBP).

## Approach: real screen recording + Remotion overlays (same pipeline as Payment Terms Lens)

The footage IS the artifact. Playwright drives `content/artifacts/sourcing-cockpit.html` (served locally, dark theme, 1080×1350 viewport at 2× or a 1180-wide desktop viewport cropped and panned) and records it; every click is logged with a timestamp. Remotion adds title, captions synced to the clicks, click ripples, two zooms and the credit card. Nothing is redrawn by hand.

Pipeline: `scripts/record.mjs` with a new scenario `sourcing-cockpit` → `demo.webm` + `events.json` → Remotion composition `ToolDemo` → mp4.

Why this scenario works on video: every click produces a visible consequence somewhere else on the screen (award date, red slip bar, funnel, savings). The story is "one click, three numbers move".

## Shot list (as recorded)

Title 2.8 s: kicker "How you can run projects with Claude Code", "Status is a state, not a deck." → footage 39.6 s → credit 2.2 s.

| Time in video | Caption |
|---|---|
| 1.8 s | One link. The whole sourcing project. |
| 6.3 s | Six stages. Six vendors. One number. |
| 10.5 s | Legal slipped a week. Log it. |
| 12.8 s | The award date moves. Nobody rewrites a slide. |
| 17.8 s | Plan vs actual. The slip is red. |
| 21.5 s | Award. The list becomes a recommendation. |
| 27.5 s | Legal signed. One click. |
| 30.7 s | One PNG for the steering email. |
| 36.7 s | keep this cockpit updated from my Friday notes |

Zooms: the ring (open), the award-date line, the award card, the snapshot dialog, the prompt in the footer.

## Pipeline
- Record: `node scripts/record-page.mjs sourcing-cockpit` (generic page recorder; shot list in `scripts/record/sourcing-cockpit.mjs`; page `content/artifacts/sourcing-cockpit.html?theme=dark&seed=negotiation`, seed = pre-award state, not persisted). Output `remotion/public/sourcing-cockpit/`.
- Convert to the ToolDemo format (captions and zooms carry `dur`) into `remotion/public/demo/sourcing-cockpit.{mp4,events.json}`, then `cd remotion && npx remotion render src/index.ts sourcing-cockpit out/sourcing-cockpit.mp4`.
- Music: `remotion/public/music/sourcing-cockpit.mp3`, generated with vidIQ (royalty-free, 48 s, 25 credits, 2026-09-05), wired through the `music` prop of `ToolDemo` (fade in 1 s, fade out over the credit, volume 0.3). Brief: soft, steady, no melody hook, 90-100 bpm, something like a muted electric piano over a light beat; no vocals; must sit under captions on a phone speaker.
