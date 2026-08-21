---
'@cube-dev/ui-kit': patch
---

Update Tasty so colour-token opacity is applied with CSS relative colour syntax instead of the token's channel components. Every `#token.N` value — `#surface-text.04`, `#purple.10` and the rest — now emits `oklch(from var(--surface-text-color) l c h / .04)`. The colours are unchanged, and the `--*-color-rgb` companion variables are untouched, so raw CSS that reads them directly (`rgb(var(--primary-color-rgb) / .2)` in `GlobalStyles`) keeps working.
