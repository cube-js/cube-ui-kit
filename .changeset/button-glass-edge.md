---
"@cube-dev/ui-kit": minor
---

Outline and primary buttons now draw their edge as a 1px ring in their own fill color instead of a solid border: a little lighter along the top and bottom, darker along the sides. The same ring works for every variant, state, theme and scheme, because its colors come from the fill itself, with the strength set by the new `$glass-edge-lift` and `$glass-edge-shade` tokens. Buttons also sit on a soft outer shadow (`$glass-halo`, `$glass-accent-halo`) that collapses while pressed, and primary buttons glow softly in their own color. Sizes and layout are unchanged.
