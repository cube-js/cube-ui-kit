---
"@cube-dev/ui-kit": minor
---

`ListBox`, `FilterListBox` and `FilterPicker` can load more options as the list scrolls near its end, with the props `ItemTable` uses for infinite scroll: `onLoadMore`, `hasMore`, `isLoadingMore` and `loadMoreMargin` (200 px by default). `onLoadMore` fires once the end of the list comes within `loadMoreMargin` of view, when the options are too few to fill the list, and when keyboard navigation reaches the last loaded option; it waits while `isLoadingMore` is true. While a page loads, a "Loading more…" row follows the last option, and screen readers hear that more options are loading. While more can load, focus doesn't wrap from the last loaded option to the first.
