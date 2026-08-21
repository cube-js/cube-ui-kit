---
'@cube-dev/ui-kit': patch
---

Update Tasty to 3.1.0. Colour-token opacity is now applied with CSS relative colour syntax instead of the token's channel components, so every `#token.N` value — `#surface-text.04`, `#purple.10` and the rest — emits `oklch(from var(--surface-text-color) l c h / .04)`. The colours are unchanged, `#current.N` still composes with the alpha it inherits, and the `--*-color-rgb` companion variables are untouched, so raw CSS that reads them directly (`rgb(var(--primary-color-rgb) / .2)` in `GlobalStyles`) keeps working. Tasty also now treats `light-dark()` and `contrast-color()` as colours, alongside `color-mix()` and `color()`.
