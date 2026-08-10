---
'@cube-dev/ui-kit': minor
---

Add `paginationMode="infinite"` to `ItemTable`.

Infinite scroll replaces the page control with load-on-scroll. The table never
slices in this mode — `data` is the list accumulated so far — and `onLoadMore`
fires once the end of it comes into view, guarded by `hasMore` and
`isLoadingMore`.

Driven by an `IntersectionObserver` on a sentinel at the end of the body rather
than a scroll handler: `loadMoreMargin` expresses "prefetch this far before the
end" directly, and it costs nothing per scroll tick. The observer re-arms only
once `isLoadingMore` clears, so a request in flight is never fired twice by a
sentinel still sitting in view. Under virtualization the trailing spacer holds
the remaining height, so the sentinel marks the true end of the list rather than
the end of the rendered window.

A batch in flight appends skeleton rows rather than a spinner: they keep the row
grid, read as "more rows of this shape are coming", and grow the scroll height
smoothly — and they match what the first load already shows.

This replaces Cloud's `onBodyScroll` handler with its 200px threshold and ref
guard.
