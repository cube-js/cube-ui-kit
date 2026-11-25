---
"@cube-dev/ui-kit": minor
---

Borders are a `.5px` hairline on screens of 2dppx and up: `$border-width` (the `bw` unit) is `.5px` there and stays `1px` on lower-density screens and in high contrast. Where the hairline is drawn, `#border`, `#<theme>-border` and `#<theme>-alert-border` step a quarter further from their surface so the thinner line keeps its contrast. Size anything that sits against a border with `bw` (`-1bw`, `(1x - 1bw)`), not a literal `1px`.
