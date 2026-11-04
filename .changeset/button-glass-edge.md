---
"@cube-dev/ui-kit": minor
---

Outline and primary buttons now draw their edge as a glass rim instead of a solid border: a light highlight along the top and bottom and a soft shade along the sides. In dark mode, primary buttons keep only a thin highlight, with no side shade. Buttons also sit in a soft outer shadow that collapses while pressed: in the border color in light mode, and in dark mode a faint black around outline buttons and a denser one around primary buttons. Sizes and layout are unchanged. The rim and the shadow come from the new `$glass-shadow` and `$glass-halo` (neutral surfaces) and `$glass-accent-shadow` and `$glass-accent-halo` (brand fills) tokens, which adapt to dark and high-contrast schemes.
