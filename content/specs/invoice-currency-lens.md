# Invoice Currency Lens — spec (draft, not scheduled)

RU name: «В какой валюте платить». Category: procurement. Status: idea → spec. Source: Safar, 2026-09-06 (Uzbekistan import cases).

## Problem (one sentence)
The same goods are quoted in two currencies (say KZT and USD) and the importer pays in a third (UZS); the cheaper quote on paper is often the dearer one in home currency once bank cross rates, conversion fees and the payment delay are counted.

## Who uses it, when
- Importer's buyer or finance lead choosing the invoice currency before signing (Uzbekistan, Kazakhstan, any market where the home currency is not freely traded).
- Exporter's sales lead deciding which currency to quote in (symmetric: "I am the seller").

## Inputs (defaults · units · label)
| Input | Default | Unit | Label |
|---|---|---|---|
| Home currency | USD | selector: USD, UZS, KZT, RUB, GBP, EUR, CNY | |
| Quote A: amount and currency | 1,000,000 KZT | | your figure |
| Quote B: amount and currency | 2,100 USD | | your figure |
| Bank rate, home per unit of A | 24.0 | UZS per KZT | your bank's SELL rate today (what you pay) |
| Bank rate, home per unit of B | 12,650 | UZS per USD | your bank's SELL rate today |
| Conversion fee A / B | 1.0 / 0.5 | % | your bank's tariff, illustrative default |
| Payment in | 60 | days | from the contract |
| Expected move of A vs home over the period | +2 | % | your assumption, illustrative; 0 = no view |
| Expected move of B vs home over the period | +3 | % | your assumption, illustrative |
| Hedge cost A / B (optional) | 0 / 0 | % | forward or option premium if you hedge |

No live FX feed: the tool is local-first, and the only rate that matters is the one your bank actually gives you. The user types it.

## Formulas
```
cost_today_X      = amount_X × rate_X × (1 + fee_X)                      # home currency, paid today
cost_at_pay_X     = amount_X × rate_X × (1 + move_X) × (1 + fee_X)       # expected, at payment date
cost_hedged_X     = amount_X × rate_X × (1 + fee_X) × (1 + hedge_X)      # locked today
delta             = cost_at_pay_B − cost_at_pay_A                        # > 0: A cheaper
break_even_move_A = cost_at_pay_B / (amount_A × rate_A × (1 + fee_A)) − 1
                    # how much A must strengthen vs home before the answer flips
implied_cross     = (amount_B × rate_B) / (amount_A × rate_A)            # the supplier's cross rate vs your bank's
```
Cross-rate leak: if the bank converts home → USD → KZT (no direct market), rate_A = rate_USD_sell / KZT_per_USD_buy; the tool shows this as an optional "via USD" mode with both legs.

## Outputs
1. Cost in home currency today, for A and B, side by side.
2. Expected cost at payment date (with the user's move assumptions), and hedged cost.
3. Verdict: "Quote A is cheaper by 1,250,000 UZS (2.4%) at today's rates; it flips if KZT strengthens more than 2.6% vs UZS by day 60."
4. Implied supplier cross rate vs your bank's cross rate (the hidden margin).

## The single visual
Two horizontal bars in home currency, one per quote, each split into: base (amount × rate), conversion fee slice, expected FX move slice (hatched, can be negative). A vertical marker at the cheaper total; a thin "break-even" line showing how far bar A can grow before it crosses bar B.

## Edge cases
- Same currency in both quotes → tool says so and compares fees only.
- move = 0 → today's cost only, band hidden.
- Missing rate → n/a for that quote, no crash.
- Home currency equals a quote currency → that quote has no conversion.

## Shareable result (Copy result)
```
Invoice Currency Lens
Quote A: 1,000,000 KZT · Quote B: 2,100 USD · paid in 60 days in UZS
Today: A = 24,240,000 UZS · B = 26,698,000 UZS
Expected at day 60: A = 24,725,000 · B = 27,499,000
Cheaper: A by 2,774,000 UZS (10.1%). Flips if KZT gains 11% vs UZS.
<url with settings>
```

## Must NOT
- Fetch rates from anywhere. No FX API, no CDN. The user types the bank's rate.
- Show "forecasts": every move assumption is the user's own, labelled illustrative.
- Give advice: it's a comparison at the numbers you entered.

## Open questions for Safar
- Default home currency: USD (Safar, 2026-09-06). Rates are typed the way banks print them: the number is always ≥ 1 (527 KZT per 1 USD, 1.17 USD per 1 EUR); the tool inverts when needed.
- Do we need the "via USD" two-leg mode in v1, or is a direct rate input enough?
- Post hook candidate: "The cheaper quote was 10% dearer. Your bank's cross rate, not the supplier's, decides."
