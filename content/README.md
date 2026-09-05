# content/ — what lives where

One tool = one slug (e.g. `payment-terms-lens`). Everything about it is named by that slug:

| What | Where | Example |
|---|---|---|
| Spec (formulas, inputs, visual, edge cases) | `specs/<slug>.md` | `specs/payment-terms-lens.md` |
| LinkedIn post (Tuesday) + metrics + board verdicts | `posts/<ship-date>-<slug>.md` | `posts/2026-09-08-payment-terms-lens.md` |
| Video script (Thursday), second by second | `videos/<slug>.md` | `videos/payment-terms-lens.md` |
| Backlog of ideas with statuses | `ideas.md` | idea → spec → build → live → killed |
| 8-week shipping plan, what shipped | `calendar.md` | |
| Ideas from other people | `submissions.md` | |

Templates: `posts/_TEMPLATE.md`, `videos/_TEMPLATE.md`. The tool itself lives in `../tools/<slug>/`.
