# remotion/ — tool videos

Separate package (not installed by the root `npm install`). Format per `content/videos/_TEMPLATE.md`: 20–40s, 1080×1350, 30fps, palette from `shared/tokens.css` (mirrored in `src/tokens.ts`).

```bash
cd remotion && npm install
npm run studio                              # preview
npm run render -- <composition-id> out/<slug>.mp4
```

One `<Composition>` per tool in `src/Root.tsx`; id = tool slug. The end card (`Credit`) is shared.
