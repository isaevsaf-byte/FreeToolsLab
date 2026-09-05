# FreeToolsLab

Free, local-first tools. [freetoolslab.org](https://freetoolslab.org). Built by Safar Isaev.

Two principles: **local-first** (zero network requests at runtime) and **corporate-safe by default** (the math never needs identifiers; data leaves only by the user's explicit export). Rules for Claude Code live in [CLAUDE.md](CLAUDE.md); rules for the chat project in [PROJECT_INSTRUCTIONS.md](PROJECT_INSTRUCTIONS.md).

## Layout

```
CLAUDE.md               rules for Claude Code
PROJECT_INSTRUCTIONS.md rules for the Claude chat project
tools/                  one folder per tool: index.html + tool.js + i18n.js (+ og.png); registry.json = catalogue; _template/ = scaffold
content/                specs/ posts/ videos/ ideas.md calendar.md submissions.md  (see content/README.md)
board/                  AI board prompts: cpo-skeptic, editor, growth
shared/                 tokens.css tool.css i18n.js theme.js share.js anonymise.js (site.js is generated)
site/                   the website (Next.js static export, npm workspace): src/ public/ config.json + build config; out/ = build output
remotion/               separate package for tool videos
scripts/                gen · new · serve · build · check · og
vercel.json             build = npm run build, output = site/out
```

A tool is plain HTML + ES modules: it imports `../../shared/i18n.js` and `../../shared/share.js` directly, no framework, no bundler. Heavier tools may add a build step, as long as the output is static and nothing loads from a CDN.

## Commands

```bash
npm run dev            # static server for tools + shared at http://localhost:4173/tools/<slug>/
npm run dev:site       # Next.js dev server for the site shell (http://localhost:3000)
npm run new <slug>     # scaffold tools/<slug>/ from _template + registry stub
npm run og <slug>      # 1200x630 screenshot of ?og=1 -> tools/<slug>/og.png
npm run check          # network audit (Playwright) + i18n parity + Lighthouse a11y >= 95
npm run build          # static site -> site/out/  (site + tools + shared)
npm run preview        # serve site/out/
```

First run: `npm install && npx playwright install chromium`.
