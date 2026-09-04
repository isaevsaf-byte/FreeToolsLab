---
date: 2026-09-08
tool: payment-terms-lens
type: build
slot: Tue 08:15 UK
url:
metrics_24h: { impressions: , reactions: , comments: , out_of_network_pct: }
metrics_7d:  { impressions: , reactions: , comments: , tool_visits: }
board: { skeptic: "Ship it", editor_hook_score: 7, growth_targets: ["Philip Ideson (Art of Procurement)", "Kelly Barner (Art of Supply)", "Pierre Mitchell (Spend Matters)", "Small Business Commissioner UK (Fair Payment Code)", "DPW / Matthias Gutzmann"] }
---

<!-- Structure: number → surprising explanation → one principle → question. Short lines. No emojis. ≤3 hashtags.
     Numbers are the tool's illustrative defaults (GBP): £1.2m spend, 30 → 60 days, 6% buyer rate, 12% supplier rate,
     £4m supplier at 8% margin. Rates carry "say" on purpose — not benchmarks.
     Board 2026-09-05: Skeptic "Ship it" (fix: money is not lost, the supplier's lender books it — applied);
     Editor rewrite applied, hook 7/10; Growth targets in frontmatter. -->

£5,918 a year leaves the deal when 30-day terms become 60.

Not saved by you. Not earned by the supplier.
Its lender has it.

Longer terms are a loan. The supplier lends you 30 days.
On £1.2m a year that is £98,630, parked on your side.
Your cost of capital, say 6%: worth £5,918 a year.
The supplier's borrowing rate, say 12%: costs £11,836 a year.
Half of that leaves the pair. Neither of you books it.

For a £4m supplier that cost is 3.7% of its profit.
Nine days of its sales, frozen, to save you 0.5% of spend.

The same maths shows the fix.
A discount of 0.49%–0.99% for keeping 30 days beats the extension.
For both sides.

One principle: never price a terms change at one rate.
The loan costs what the lender pays, not what the borrower saves.

What rate does your smallest strategic supplier borrow at?

Live: freetoolslab.org/tools/payment-terms-lens/ — tell me what broke.
Free, no tracking. Nothing leaves your browser.

#procurement #workingcapital #supplierrisk

<!-- BOARD 2026-09-05
CPO Skeptic — No, would not use next week: his terms moves run through supply-chain finance (supplier paid at buyer
rate + bank spread), so the leak is ~0 and v1 cannot model it. Wrong/missing: "evaporates" was false (lender books it);
"early-payment discount" mislabelled (it is a discount for keeping current terms; v1 cannot model 2/10 net 30).
Forward when: SCF toggle + "supplier reprices X% into next quote" net line (logged: ideas.md #21).
Verdict: Ship it. Risk: every FD with an SCF programme replies "solved in 2015".

Editor — cut "Here is the mechanism." (announces instead of showing). Principle was inverted; fixed to
"The loan costs what the lender pays, not what the borrower saves." Fix block moved above principle. Hook 7/10:
precise pound figure stops the scroll, but £5,918 is small in absolute terms; the surprise waits for line two.

Growth — comment first, link never (Mon–Tue):
  Philip Ideson: "Terms extensions are priced at the buyer's rate. The leak sits at the supplier's."
  Kelly Barner: "Nine days of a supplier's sales frozen to save 0.5% of spend."
  Pierre Mitchell: "Working-capital targets never carry a supplier-rate column."
  Small Business Commissioner UK: "Late payment's cost is computable: supplier rate minus buyer rate."
  DPW / Matthias Gutzmann: "Which demo shows the supplier's side of 30→60?"
Reuse: the tool's RU "Copy result" is the RU post — same GBP numbers, Wed 08:15. Nothing new to write.
24h metric: out-of-network share of impressions. ≥40% → double down: Thursday video opens on £5,918, DM the five.
-->
