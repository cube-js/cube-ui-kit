---
"@cube-dev/ui-kit": patch
---

`ItemAction`, `ItemButton` and other `Item`-based rows: an open tooltip now adds its id to the row's own `aria-describedby` instead of replacing it, so screen readers read both the caller's description and the tooltip.

`Item`, `ItemButton`, `TextItem` and other rows with an automatic tooltip: `tooltip={{ title: undefined }}` or `{{ title: null }}` now falls back to the automatic title, like `tooltip={{}}`, instead of opening an empty bubble.
