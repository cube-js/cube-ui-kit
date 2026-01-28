---
"@cube-dev/ui-kit": minor
---

Add custom property opacity syntax for color tokens. You can now use `$name` syntax to reference a CSS custom property as the opacity value:

- `#purple.$disabled` → `rgb(var(--purple-color-rgb) / var(--disabled))`
- `#dark-05.$my-opacity` → `rgb(var(--dark-05-color-rgb) / var(--my-opacity))`

This allows for dynamic opacity values that can be controlled via CSS custom properties.
