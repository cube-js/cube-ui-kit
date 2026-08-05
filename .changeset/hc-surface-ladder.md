---
'@cube-dev/ui-kit': patch
---

Retune the surface ladder and the themed borders.

- `#surface-2`, `#surface-3` and `#surface-4` gain wider high-contrast tone pairs (`['-2','-4']`, `['-4','-8']`, `['-6','-12']`), so nested panels stay distinguishable when a user asks for more contrast. The tinted `<theme>-surface` widens the same way.
- `#border` deepens in high contrast too (`['-10','-30']`).
- The tinted `<theme>-border` used by OUTLINE-variant items drops from `saturation: 0.5` to `0.3` and takes the same wider HC pair, so a themed border reads as a border rather than a second accent.
- `Alert` borders now use `#<theme>-border` instead of a 20%-alpha accent fill, which is what makes the themed borders consistent between alerts and outline items. The `special` alert border moves to `#primary-border` for the same reason.

Scope, measured across all 156 tokens in all four scheme variants: **67 tokens moved** — 67 in `@dark & @hc` and 61 in `@hc`. Only **six** move in the normal and dark schemes, and they are exactly the themed borders (`#primary-border`, `#purple-border`, `#success-border`, `#danger-border`, `#warning-border`, `#note-border`), from the saturation change. Everything else is high-contrast only.
