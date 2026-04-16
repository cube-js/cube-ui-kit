---
'@cube-dev/ui-kit': minor
---

Simplify `isLoadingItems` in `FilterPicker` and `FilterListBox` — it now shows a loading spinner in the search input suffix inside the popover instead of a full disclaimer. The trigger no longer shows a loading icon for `isLoadingItems`. Remove `loadingItemsLabel` prop. Unify `emptyLabel` to cover all empty states: when provided, it overrides both the "No items" and "No results found" defaults.
