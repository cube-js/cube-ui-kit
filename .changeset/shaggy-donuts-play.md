---
'@cube-dev/ui-kit': minor
---

Add `getItemDragInfo` to `ItemTable`, and drag previews to `DraggableCollection`.

Dragging a table row without a preview drags a *screenshot of the row*, which
for a full-width row is a page-wide slab covering whatever it is dragged over.
`getItemDragInfo` replaces that with a chip: one row shows its icon and label,
several show a count, since a single chip cannot honestly represent five
different rows.

`DraggableCollection` gained an optional `renderPreview`, so `Tabs` and
`ListBox` can use it too. It receives the dragged **keys** rather than React
Aria's serialized `DragItem`s, which only carry `text/plain` — a caller
rendering an icon needs the record.

This replaces Cloud's `getItemDragInfo`, which had to re-inject its icon into
ag-grid's ghost element on every drag tick because ag-grid overwrites the ghost
whenever the pointer leaves the grid.
