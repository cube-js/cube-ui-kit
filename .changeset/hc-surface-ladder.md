---
'@cube-dev/ui-kit': patch
---

Deepen the surface elevation ladder in high contrast. `#surface-2`, `#surface-3`, `#surface-4` and the tinted `<theme>-surface` now carry high-contrast tone pairs (`['-2', '-3']`, `['-4', '-6']`, `['-6', '-9']`), so nested panels stay distinguishable when a user asks for more contrast.

Scope, measured across all 156 tokens in all four scheme variants: 67 tokens moved, **all of them in `@hc` / `@dark & @hc` only**. The normal and dark schemes are byte-identical to the previous release.
