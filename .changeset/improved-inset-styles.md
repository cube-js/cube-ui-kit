---
"@cube-dev/ui-kit": patch
---

Refactored `inset` style handler with smart output strategy:

- When using the `inset` prop or `insetBlock`/`insetInline` props: outputs `inset` CSS shorthand for efficiency
- When using individual `top`, `right`, `bottom`, `left` props: outputs individual CSS properties to allow proper CSS cascade with modifiers

This fix resolves an issue where conditional modifiers on individual direction props (e.g., `top: { '': 0, 'side=bottom': 'initial' }`) would incorrectly override all four directions instead of just the specified one.
