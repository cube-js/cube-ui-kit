---
"@cube-dev/ui-kit": minor
---

Outline and primary buttons now draw their edge as a 1px ring in their own fill color instead of a solid border: a little lighter along the top and bottom, darker along the sides. The fill itself darkens slightly toward the top and bottom, so the ring's light edges stand out. The same treatment works for every variant, state, theme and scheme, because its colors come from the fill itself, with the strength set by the new `$glass-edge-lift`, `$glass-edge-shade` and `$glass-fill-shade` tokens. Buttons also sit on a soft outer shadow (`$glass-halo`, `$glass-accent-halo`) that collapses while pressed, and primary buttons glow softly in their own color. Button sizes are unchanged. Inside a `ButtonSplit`, buttons no longer overlap by 1px, so each seam shows both buttons' edges side by side and the group is 1px wider per seam.
