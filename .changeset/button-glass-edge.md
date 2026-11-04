---
"@cube-dev/ui-kit": minor
---

Outline and primary buttons now draw their edge as a glass rim instead of a solid border: a light highlight along the top and bottom and a soft shade along the sides. In dark mode, primary buttons keep only a thin highlight, with no side shade. Buttons also sit in a soft outer shadow, in the border color in light mode and near-black in dark mode, that collapses while pressed. Sizes and layout are unchanged. The rim and the shadow come from the new `$glass-shadow` (neutral surfaces), `$glass-accent-shadow` (brand fills) and `$glass-halo` tokens, which adapt to dark and high-contrast schemes.
