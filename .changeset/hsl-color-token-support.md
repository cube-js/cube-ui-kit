---
'@cube-dev/ui-kit': patch
---

Add HSL to RGB conversion support for color token declarations. HSL color tokens (e.g., `'#primary': 'hsl(200 40% 50%)'`) now generate RGB triplets for `--name-color-rgb` variables, enabling opacity syntax support: `#name.3` → `rgb(var(--name-color-rgb) / .3)`.

