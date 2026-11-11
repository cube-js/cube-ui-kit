---
"@cube-dev/ui-kit": patch
---

The default scrollbar thumb is darker: `#scrollbar-thumb` is now 70% of `#text` instead of 50%, so it reaches the 3:1 contrast WCAG 1.4.11 asks of it against every surface, in light, dark and high-contrast schemes. A `$scrollbar-thumb-color` you set yourself is unchanged.
