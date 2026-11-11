---
"@cube-dev/ui-kit": patch
---

The default scrollbar thumb (`#scrollbar-thumb`) is stronger: 70% of `#text` instead of 50%, so it reaches the 3:1 contrast WCAG 1.4.11 asks of it against `#surface` to `#surface-4` in light, dark and high-contrast schemes. An override of `#scrollbar-thumb`, or a color given to the `scrollbar` style, is unaffected.
