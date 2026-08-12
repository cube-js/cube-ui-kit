---
'@cube-dev/ui-kit': patch
---

**ItemTable, DataTable**: correct the `isSortable` documentation. It read
`@default true`, which was never what the code did — `TableView` requires
`isSortable === true` before a header becomes a control at all, so sorting is
opt in per column and a table with no sortable column has inert headers.

Adds the pattern most lists actually want, which had no story: a fixed order the
user cannot change, via `sortMode="client"` with a `sort` and no sortable
column. `sortMode` has to be explicit there — left to default it resolves to
`'off'` when nothing is sortable, and a `sort` prop alone sorts nothing.

Also documents `ItemTable`'s column-menu props, and adds a `DataTable` story for
the query-results layout: pagination off, footer slots in its place, and a
tighter `.5x` footer.
