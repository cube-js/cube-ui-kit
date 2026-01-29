---
"@cube-dev/ui-kit": minor
---

Improved sub-element selector affix (`$`) with new capabilities:

- **Compact syntax**: No spaces required around combinators (`'>Body>Row>'` now works)
- **Pseudo-elements on root**: Use `$: '::before'` to style root pseudo-elements
- **Pseudo on sub-elements**: Use `@` placeholder for pseudo on keyed elements (`$: '>@:hover'`)
- **Multiple selectors**: Comma-separated patterns (`$: '::before, ::after'`)
- **Sibling combinators**: Support `+` and `~` after elements (`$: '>Item+'`)
- **Validation**: Standalone `+` or `~` warns and skips (targets outside root scope)
