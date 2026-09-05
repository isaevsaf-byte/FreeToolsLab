# FreeToolsLab

Free, local-first tools. [freetoolslab.org](https://freetoolslab.org). Built by Safar Isaev.

Two principles: **local-first** (zero network requests at runtime) and **corporate-safe by default** (the math never needs identifiers; data leaves only by the user's explicit export). Rules for Claude Code live in [CLAUDE.md](CLAUDE.md); rules for the chat project in [PROJECT_INSTRUCTIONS.md](PROJECT_INSTRUCTIONS.md).

## Layout

```
CLAUDE.md, PROJECT_INSTRUCTIONS.md   rules for Claude Code / the chat project
tools/            one folder per tool: index.html + tool.js + i18n.js (+ og.png)
  registry.json   the catalogue; Modules page and landing are generated from it
  _template/      scaffold source for `npm run new`
shared/           tokens.css · tool.css · i18n.js · theme.js · share.js · anonymise.js · site.js (generated)
content/          ideas.md · calendar.md · specs/ · posts/ · videos/ · submissions.md
board/            AI board prompts (cpo-skeptic, editor, growth)
remotion/         separate package for tool videos
site/config.json  support links, contact, credit lines (single source)
src/              the site shell (Next.js, static export): app/ components/ lib/ store/
public/           favicons
scripts/          gen · new · serve · build · check · og
next.config.ts, tailwind.config.ts, postcss.config.js, tsconfig.json   site build config
out/              build output (git-ignored)
```

A tool is plain HTML + ES modules: it imports `../../shared/i18n.js` and `../../shared/share.js` directly, no framework, no bundler. Heavier tools may add a build step, as long as the output is static and nothing loads from a CDN.

## Commands

```bash
npm run dev            # static server for tools + shared at http://localhost:4173/tools/<slug>/
npm run dev:site       # Next.js dev server for the site shell (http://localhost:3000)
npm run new <slug>     # scaffold tools/<slug>/ from _template + registry stub
npm run og <slug>      # 1200x630 screenshot of ?og=1 -> tools/<slug>/og.png
npm run check          # network audit (Playwright) + i18n parity + Lighthouse a11y >= 95
npm run build          # static site -> out/  (site + tools + shared)
npm run preview        # serve out/
```

First run: `npm install && npx playwright install chromium`.
