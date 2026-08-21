---
'@cube-dev/ui-kit': patch
---

Update Tasty so colour-token opacity is applied with `color-mix()` instead of the token's channel components. Every `#token.N` value — `#surface-text.04`, `#purple.10` and the rest — now emits `color-mix(in oklab, var(--surface-text-color) 4%, transparent)`. The colours are unchanged, and the `--*-color-rgb` companion variables are untouched, so raw CSS that reads them directly (`rgb(var(--primary-color-rgb) / .2)` in `GlobalStyles`) keeps working.
