---
'@cube-dev/ui-kit': minor
---

`RadioGroup` with `type="button"` now groups its buttons like `ButtonSplit`: zero gap, shared corner radius (only the first/last items keep their outer-side radius), overlapping borders, and the selected button is lifted via `z-index` so its brand-tinted border is visible from all four sides. Hover / focus-visible bump higher still so they always read on top.

Outline-style selected borders no longer use the alpha-blended `#<theme>-text.15` (which doubled up at every overlap into a darker stripe) — they now use the new opaque `#<theme>-border` token. The token comes from the existing neutral `border` ramp re-resolved per colored theme at `saturation: 0.5`, giving each theme a subtly hue-tinted border with no extra palette bookkeeping. This affects `DEFAULT_OUTLINE_STYLES`, `DANGER_OUTLINE_STYLES`, `SUCCESS_OUTLINE_STYLES`, `WARNING_OUTLINE_STYLES`, and `NOTE_OUTLINE_STYLES`.
