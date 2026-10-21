---
'@cube-dev/ui-kit': patch
---

Update Tasty to 3.12.0 (from 3.11.2). A faded color such as `#dark.15` now compiles to `color-mix(in oklab, var(--dark-color) 15%, transparent)` instead of relative color syntax, and the selection color of code blocks follows. `color-mix()` is widely available, while relative color syntax needs Chrome 125, Firefox 128 or Safari 18. An opaque token fades to the same color as before. For apps built on the kit:

- Alpha composes, so a token that is already translucent is faded further. A `$prop` alpha must hold a number: `$fade: '.5'` works, `'50%'` no longer does.
- `false` writes nothing in `padding`, `margin`, `inset`, `scrollMargin`, `scrollPadding`, the size styles and `outlineOffset`, set directly or under a state. Before, `width: { '': false, ellipsis: 'max 100%' }` wrote `width: auto; min-width: initial; max-width: initial` outside `ellipsis`.
- Named and system colors, such as `red` or `Highlight`, are colors in `border`, `outline`, `shadow`, `scrollbar`, `fade` and color tokens. They are emitted lowercase.
- `transition: 'none'` turns transitions off, alone or under a state. Before, it emitted a declaration the browser dropped.
- A custom property written as CSS keeps its case: `var(--myGap)` no longer becomes `var(--mygap)`.
- `mergeStyles()` and the `Styles` type are exported from `@tenphi/tasty/zero`, and Tasty's Babel plugin supports Babel 8.
