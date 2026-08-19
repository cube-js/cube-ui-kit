---
'@cube-dev/ui-kit': patch
---

`ColorInput` and `ColorPicker` keep the `20px` swatch they have always drawn.

Giving `ColorSwatch` a size of its own changed both of them by accident. `ColorInput` passed the field's size straight through, so a `medium` field's swatch went `20px → 24px` and a `large` one `20px → 28px`; the `ColorPicker` trigger was left to track its button and moved `20px → 24px` the same way. Measured in a real browser against `main`, at every field size.

Neither was a size anyone asked for. The swatch in a color field reads as a value the field is showing, not as part of the control, so it is now pinned at `20px` in both — identical to `main` at `small`, `medium` and `large`.

The `size` prop and the automatic fitting are unchanged and remain the right thing for a swatch you place yourself in a `Button` or an `Item`, where the host has the padding that makes it work. A text input hangs its prefix off the border with none of its own, which is why the fields opt out.

Also corrects the docs, which gave the automatic fit in a `large` control as `32px` where it is `28px`.
