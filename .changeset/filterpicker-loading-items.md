---
'@cube-dev/ui-kit': minor
---

Simplify `isLoadingItems` in `FilterPicker` and `FilterListBox` — it now shows a loading spinner in the search input suffix inside the popover instead of a full disclaimer. The trigger no longer shows a loading icon for `isLoadingItems`. Remove `loadingItemsLabel` prop. Unify `emptyLabel` to cover all empty states: when provided, it overrides both the "No items" and "No results found" defaults.

During an in-flight server fetch (`filter={false}` + `isLoadingItems={true}`), stale items that do not text-match the current search are now hidden client-side via `contains`. This avoids confusing UI where unrelated stale items remain visible alongside the user's typed value. Once the fetch resolves and `isLoadingItems` flips back to `false`, the parent's items are shown as-is.

Locally-injected selected custom values (the ones that persist via `customKeys` in multi-select with `allowsCustomValue`) now also respect the search input regardless of `filter={false}`. Previously they remained visible while the parent's items were filtered, which created an inconsistent UI. `filter={false}` only governs how parent-provided items are filtered — it does not exempt FilterListBox's own injected items.

Improve virtual-focus behavior with `allowsCustomValue`:

- While the user is typing and the server fetch is in flight, non-matching stale items are hidden and focus moves to the new custom-value suggestion so the user can press Enter to add it immediately.
- When the fetch resolves with no matches, focus stays on the custom value.
- When the fetch resolves with matches, focus moves to the first real item.
- With client-side filtering, when no items match the search, focus moves to the custom-value suggestion (same UX as the server-side path).
