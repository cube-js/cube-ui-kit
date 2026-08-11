---
'@cube-dev/ui-kit': minor
---

**DataTable**: column reordering. `isColumnReorderable` lets a user drag a header
sideways or move the focused column with `Alt`+`←` / `→`; clicking still sorts
and the resize handle still resizes. `columnOrder` / `defaultColumnOrder` /
`onColumnOrderChange` work with or without dragging, so a column manager
elsewhere in the page can drive the order on its own, and `storageKey` now
persists the order alongside the widths.

Structural and pinned columns stay put — `pin` is already the ordering authority
for a pinned column — and a single column opts out with `isReorderable: false`.
A stale order is safe: unknown keys are ignored, and a column missing from the
list lands after the neighbour it had in `columns` rather than at the end.
