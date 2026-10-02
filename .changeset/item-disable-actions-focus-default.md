---
"@cube-dev/ui-kit": patch
---

The `no-redundant-default-prop` lint rule no longer flags `disableActionsFocus={true}` on `Item` as redundant. Its registry, like the `Item` docs, listed the default as `true`, while the component defaults to `false`. So the autofix removed a prop that was doing something, and the item's actions became focusable again.
