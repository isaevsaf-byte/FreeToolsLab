# Payment Terms Lens — spec

Ship: Tue 2026-09-08 08:15 UK · slug `payment-terms-lens` · category procurement · v1

## Problem (one sentence)
A payment-terms change is always computed for the buyer's cash; what the same 30 days cost the supplier — at its borrowing rate, relative to its size — is never on the slide.

## Who uses it, when
- Category / procurement lead, the week before proposing "30 → 60" to a supplier or to finance.
- Finance business partner checking a working-capital target against supplier risk.
- A supplier's finance lead preparing a counter (the tool is symmetric — no login, no data).

## Inputs (defaults · units · source)
| Input | Default | Unit | Label |
|---|---|---|---|
| Currency | GBP | GBP / USD / EUR | selector |
| Annual spend with this supplier | 1,200,000 | per year | your figure |
| Current payment terms | 30 | days | your figure |
| Proposed payment terms | 60 | days | your figure |
| Your cost of capital | 6 | % p.a. | illustrative — use your WACC / short-term rate |
| Supplier annual revenue | 4,000,000 | per year | your estimate (public accounts, or ask) |
| Supplier borrowing rate | 12 | % p.a. | illustrative — overdraft / invoice finance |
| Supplier operating margin | 8 | % | illustrative |

No names, no supplier identifiers. Nothing is pasted or uploaded → no anonymiser needed.

## Formulas (explicit — mirrored in tool.js header and the Assumptions block)
```
daily_spend        = spend / 365
delta_days         = proposed_terms − current_terms
cash_shift         = daily_spend × delta_days                 # one-off working capital moved supplier → buyer (negative = buyer → supplier)
buyer_gain_pa      = cash_shift × buyer_rate                   # per year, for as long as the terms hold
supplier_cost_pa   = cash_shift × supplier_rate
value_leak_pa      = supplier_cost_pa − buyer_gain_pa          # destroyed inside the pair when supplier_rate > buyer_rate
supplier_profit    = supplier_revenue × supplier_margin
cost_pct_of_profit = supplier_cost_pa / supplier_profit
days_of_revenue    = cash_shift / (supplier_revenue / 365)     # supplier cash locked, in days of its own sales
share_of_supplier  = spend / supplier_revenue                  # how dependent the supplier is on you
fair_band_low      = delta_days / 365 × buyer_rate             # early-payment discount that equals your gain
fair_band_high     = delta_days / 365 × supplier_rate          # discount that equals the supplier's cost
```
The fair band is the set of discounts (for keeping current terms) that beats the extension for *both* sides.

## Outputs
1. Cash moved (one-off) and direction.
2. Your gain per year · Supplier cost per year · Value leaked per year.
3. Supplier impact: cost as % of its profit · cash locked in days of its revenue · your share of its revenue.
4. "What's fair" panel: discount band low–high (%) and its value in money.

## The single visual (SVG, animates on input, reduced-motion safe)
Four horizontal bars, one scale, labelled with the numbers:
- Cash moved — amber, with an arrow supplier → you (flips when delta_days < 0).
- Your gain / year — green.
- Supplier cost / year — red. The height difference *is* the insight.
- Supplier profit — muted bar with a red bite = cost_pct_of_profit. This is the "supplier shrinks" frame.

## Edge cases
- delta_days = 0 → all zero, note "no change".
- delta_days < 0 → you become the lender: signs flip, wording flips, fair band hidden.
- spend > supplier_revenue → warn "spend exceeds supplier revenue — check inputs", clamp share at 100 %.
- margin = 0 or profit ≤ 0 → % of profit shows "—".
- buyer_rate ≥ supplier_rate → value_leak ≤ 0, note "no leak: you borrow dearer than the supplier".
- Any field empty/NaN → treated as 0, result cards still render.

## Shareable result (Copy result)
```
Payment Terms Lens
Terms 30 → 60 days on £1,200,000 / year
Cash moved to you: £98,630 (one-off)
Your gain: £5,918 / year at 6%
Supplier cost: £11,836 / year at 12% — 3.7% of its profit, 9 days of its sales
Value leaked between you: £5,918 / year
Fair instead: 0.49%–0.99% early-payment discount
<url with settings>
```

## Must NOT
- Ask for a supplier name, contract or PO number.
- Claim benchmark rates — every rate is "illustrative", editable.
- Present the result as advice; disclaimer stays.
- Make any network request; no export except Copy result / CSV.

## Post hook (for editor)
"A 30-day terms extension is a loan. You borrow at 6%. The supplier lends at 12%. Half the money evaporates."

## v1.2 (2026-09-05, approved by Safar)
- **Perspective**: "I am the buyer / the supplier" chip. Numbers identical, wording flips (`sup.*` overrides in i18n.js). URL `who=supplier`.
- **Discount**: "Discount for paying at the proposed terms" (%), preset `2/10 net 30`. `discount_value = spend × discount`; `buyer_net = buyer_interest + discount_value`; `supplier_net = − supplier_interest − discount_value`. The leak is unchanged (a discount transfers 1:1).
- **SCF toggle** + bank spread (illustrative 1.5%): `supplier_rate_eff = buyer_rate + spread`; the leak collapses to `cash × spread`.
- **Option B**: second proposed terms + discount on the same inputs; table A vs B with nets per side and a verdict (better for both / split).
- **Missing data**: spend + both terms required; everything else optional, outputs show n/a.
- Visual "Where the money goes": loan band with arrow, yearly cost split into "reaches you" vs "goes to its lender", supplier profit bite. Download PNG renders it client-side.
- Currencies: GBP USD EUR CNY RUB UZS (defaults scaled by rough FX, user numbers untouched).
