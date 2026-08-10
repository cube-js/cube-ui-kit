---
'@cube-dev/ui-kit': minor
---

Add row selection to `ItemTable`.

`selectionMode="multiple"` adds the checkbox column and a select-all header
checkbox; `single` adds the column without it. Selection is keyed rather than
indexed, so it survives sorting, searching and paging — and a row filtered out
by a search keeps its key instead of being silently deselected.

Shift-click extends the range from the last plainly-clicked row, and
shift-clicking back toward the anchor shrinks it rather than leaving the
overshoot selected.

`selectAllMode` scopes the header checkbox to the current page (default), every
row passing the current filter, or the `'all'` sentinel for consumers whose
query can act on rows the client never loaded.

Three distinct ways a row can be special: `disabledKeys` makes it inert,
`isRowSelectable` leaves it interactive with only its checkbox inert (explained
by `selectionTooltip`), and `getRowProps().isDimmed` is purely visual and stays
selectable.

Adds `@react-stately/selection` as a direct dependency — `SelectionManager` is
not re-exported by `react-stately`, and a direct dependency is what makes its
types resolve under `preserveSymlinks`.
