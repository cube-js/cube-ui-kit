---
"@cube-dev/ui-kit": patch
---

`NumberInput`: a `suffix` now sits next to the number, before the stepper buttons, by default, so a unit reads `40 px ⌃⌄` instead of `40 ⌃⌄ px`. This matches the documented `suffixPosition` default of `before`, which previously behaved like `after`. `suffixPosition="after"` still places the suffix after the steppers; pass it (or move the control to `actions`, which always renders last) to keep the old order for a suffix that is a control rather than a unit. The docs now describe `suffixPosition` as the suffix's position relative to the steppers; the validation and loading icon always comes before both.
