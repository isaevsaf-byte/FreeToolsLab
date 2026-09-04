# Payment Terms Lens — video script

Format: static → motion transformation. 35s. 1080×1350. 30fps. Palette from shared/tokens.css. No emojis on screen. All numbers are the tool's illustrative defaults (GBP): £1.2m spend, 30 → 60 days, 6% / 12%, £4m supplier at 8% margin.

Thu 2026-09-10 15:15 UK.

| Time | On screen | Motion | Text |
|------|-----------|--------|------|
| 0:00–0:02 | "30 → 60 days" centred, mono, ink on bg | "30" static; "→ 60" types in, one glyph per 2 frames | Payment terms are a loan. |
| 0:02–0:06 | Two blocks: YOU (wide, panel-2) left, SUPPLIER (narrow, panel-2) right. Amber chunk labelled £98,630 sits inside SUPPLIER | chunk slides left into YOU with spring(damping 14); SUPPLIER block shrinks by the same width | £98,630 moves to you. For 30 days. |
| 0:06–0:11 | Bar 1 under YOU, green | grows to 50% width, spring; number counts 0 → 5,918 | You: +£5,918 a year at 6% |
| 0:11–0:16 | Bar 2 under SUPPLIER, red, same scale | grows to 100% width — visibly twice bar 1; counts 0 → 11,836 | Supplier: −£11,836 a year at 12% |
| 0:16–0:21 | Bracket spans the gap between bar ends; "£5,918" in muted | bracket draws in (interpolate stroke-dashoffset); label fades to 40% opacity | £5,918 leaves the pair. Nobody books it. |
| 0:21–0:26 | Wide muted bar "Supplier profit £320,000"; red bite from the left | bite grows to 3.7% of width, then pulses once | 3.7% of a £4m supplier's profit. Nine days of its sales. |
| 0:26–0:31 | Bars fade; green band "0.49% – 0.99%" appears between two thin rules | band widens from centre (interpolate scaleX) | A discount inside this band beats the extension. For both sides. |
| 0:31–0:34 | URL in mono | typewriter | freetoolslab.org/tools/payment-terms-lens |
| end 0:34–0:36 | Credit card | fade | Safar Isaev · FreeToolsLab |

Music: dry, minimal, 92 BPM, no melody — a soft kick every beat and one low hit. Accents: 0:06 (bar 1 lands), 0:11 (bar 2 lands — the loudest hit, this is the reveal), 0:21 (bite pulse), 0:26 (band opens). Silence on the last 2s.

Remotion: composition id `payment-terms-lens`, 1080×1350, 30fps, 1080 frames.
Props schema:
```ts
{
  spend: number;        // 1200000
  currentDays: number;  // 30
  proposedDays: number; // 60
  buyerRate: number;    // 6
  supplierRate: number; // 12
  supplierRevenue: number; // 4000000
  margin: number;       // 8
  currency: "GBP" | "USD" | "EUR";
}
```
Derived in the composition with the same formulas as tools/payment-terms-lens/tool.js (copy the compute() block — do not re-derive).
Main transition: `spring({ frame, fps, config: { damping: 14, stiffness: 120 } })` drives every bar width; `interpolate(frame, [a, b], [0, value])` with `Easing.out(Easing.cubic)` drives the counters. Scene cuts are hard, no crossfades except the final credit.
