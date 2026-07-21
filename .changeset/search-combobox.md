---
'@cube-dev/ui-kit': minor
---

Add `SearchComboBox` — a search-styled combobox for "search and act" flows. It fires `onSelect`/`onSubmit` and clears the input after each action, supports external (server-side) filtering with `filter={false}`, delays the loading indicator (via `loadingDelay`, default 1s) to avoid flicker on fast responses, and accepts a custom `emptyLabel`.
