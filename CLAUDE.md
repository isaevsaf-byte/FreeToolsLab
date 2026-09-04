# FreeToolsLab

Free, local-first tools. freetoolslab.org. Built by Safar Isaev.

## Two principles (everything else is implementation)
1. LOCAL-FIRST. Zero network requests at runtime. No fetch, no analytics, no CDN fonts or scripts. Verified by `npm run check` (Playwright: Network log must be empty after load and after interaction).
2. CORPORATE-SAFE BY DEFAULT. A user must be able to use the tool with real work data under a strict corporate policy, because nothing leaves their machine:
   - The math never needs identifiers. Names, supplier names, contract numbers are labels, not inputs.
   - Any tool that accepts pasted/uploaded data has "Anonymise" ON by default (names -> C-001...; mapping kept in memory only, "Show original" toggle).
   - The only way data leaves is the user's explicit export (Copy result / Download CSV / ICS). Never auto-save, never sync.
   - Example data is fictional. Never real companies.
   - UI wording: "Designed to be usable under strict data policies — nothing leaves your browser. Check your own policy." Never promise compliance.

## Stack (build allowed, network not)
- Static build is fine: Vite + React or Svelte, TypeScript. Libraries are BUNDLED at build time (D3, Papa Parse, date-fns, DuckDB-wasm, etc.) — never loaded from a CDN at runtime. Output is static files on static hosting.
- Shared: `shared/tokens.css`, `shared/i18n`, `shared/share` as workspace packages.
- Heavy work: Web Workers. Big data: IndexedDB / DuckDB-wasm. Files: File System Access API with fallback to <input type=file>. Offline: PWA manifest + service worker (cache-only, no network).
- Optional "smart" features: BRING YOUR OWN KEY. User pastes their own Anthropic API key; calls go browser -> API directly; key stored only in memory (or localStorage behind the "Remember on this device" toggle). The lab never proxies, logs, or sees it. Label clearly: "Uses your key. Your data goes to Anthropic under your account, not to us."
- State lives in the URL (`?a=...&b=...`) so a result is shareable — settings only, never the user's data. localStorage only behind an explicit toggle labelled "Remember on this device".
- Bilingual EN/RU via `data-i18n` keys; `shared/i18n` reads `?lang=` then `navigator.language`. Both languages get equal care — no machine-translation leftovers.
- Every tool has: inputs with sensible defaults and units -> live-updating result -> ONE primary visual (SVG or Canvas) -> "Copy result" button producing plain text with the numbers and the tool URL -> Assumptions/disclaimer block -> credit block (author + "Support the Lab") -> text link to /subscribe.
- Accessibility: labels on every input, keyboard-operable sliders, focus visible, prefers-reduced-motion respected, contrast >= 4.5:1.
- Mobile first. Test at 375px width.

## Design
- Match the site: near-black `#0A0D14` ground, monospace headings ("IBM Plex Mono", ui-monospace), system sans body, green status pill `#22C55E`. Tokens in `shared/tokens.css` — never hardcode colours in a tool.
- Semantic colours: green = good/after, amber = caution, red = risk/before. Accent is separate from semantics.
- Numbers use `font-variant-numeric: tabular-nums`. Currency symbol follows a selector (GBP/USD/EUR), default GBP.

## Adding a tool (checklist — do all of it)
1. `npm run new <slug>` -> scaffolds `tools/<slug>/` from `tools/_template/` and a registry stub.
2. Fill `tools/registry.json` entry: id, name_en, name_ru, tagline_en, tagline_ru, category, status: "live", added: ISO date, url, post_url.
3. Modules list is generated from registry — do not hand-edit HTML.
4. OG image 1200x630 -> `tools/<slug>/og.png` (`npm run og <slug>`: Playwright screenshot of `?og=1` view).
5. `content/posts/YYYY-MM-DD-<slug>.md` with the post draft (structure: number -> surprising explanation -> one principle -> question; ends with tool link + "Tell me what broke.").
6. `content/calendar.md`: move from "next" to "shipped".
7. `npm run check`: no external requests, both languages render, Lighthouse a11y >= 95.

## Formulas
- Every formula in a comment block at the top of the tool's script AND in the visible "Assumptions" section. Users must be able to audit the math.
- Benchmarks (APQC $54/PO, Hackett -58% cycle time, Ardent 61.1%/91.7% SUM, 25.6-day onboarding) are defaults with source labels and are editable. Own examples in GBP; benchmarks in source currency.

## Support the Lab (donations)
- The lab is free and stays free. Supporters fund the AI subscriptions and hosting that make the next tool possible.
- Links live in exactly three places: the `/support` page, the site footer ("Support the Lab"), and the last line of a tool's credit block. Never in the tool's working area, never as a popup, never gating a feature.
- Platforms come from `site/config.json` (single source): Ko-fi (one-off + monthly), GitHub Sponsors, Buy Me a Coffee.
- Wording EN: "Free forever. If a tool saved you an hour, buy the lab a coffee — it pays for the AI subscriptions behind the next one."
  RU: "Бесплатно навсегда. Если инструмент сэкономил вам час — купите лаборатории кофе: это оплачивает AI-подписки, на которых делается следующий."
- BYOK and support are explained together on `/support`: "Your key pays for your own usage. Your coffee pays for building the next tool."
- Transparency block on `/support`: what the money covers (Claude/Cursor/Vercel/Remotion/domain) and a line "Tools shipped this month: N".

## Never
- Never collect email inside a tool. Never add a chat widget, cookie banner, or tracker. Never link to safarisaev.ai from a tool.
- Never require a name, supplier, or contract identifier to compute anything.
- Never make a network request the user didn't explicitly trigger with their own key.
- Never ship without both languages.
- Never invent a benchmark. If unsure, label "illustrative".

## Commands (create these first if missing)
- `npm run dev` — static dev server
- `npm run check` — network audit (Playwright) + i18n key parity + Lighthouse a11y
- `npm run og <slug>` — regenerate OG image
- `npm run new <slug>` — scaffold from template + registry stub

## Repo map
- `tools/` — one folder per tool; `registry.json` is the catalogue
- `content/ideas.md` — backlog with statuses; `content/calendar.md` — 8-week plan; `content/posts/` — post drafts + metrics; `content/videos/` — Remotion scripts; `content/submissions.md` — ideas from people
- `board/` — AI board prompts (cpo-skeptic, editor, growth)
- `site/config.json` — support links, contact, socials
- `PROJECT_INSTRUCTIONS.md` — paste into the Claude Project (chat)
