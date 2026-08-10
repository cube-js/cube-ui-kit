---
'@cube-dev/ui-kit': minor
---

Add row reordering to `ItemTable`.

`isReorderable` lets rows be dragged into a new order, built on React Aria's
collection drag-and-drop through the same `DraggableCollection` wrapper `Tabs`
and `ListBox` use — `RowCollection` and the table's own `SelectionManager`
satisfy its structural contract unchanged.

That covers the keyboard path as well as the pointer one: the grid takes a
single tab stop, arrows move between rows, Enter picks a row up and drops it,
Escape cancels. Rows carry a roving tabindex so React Aria's keyboard drag is
actually reachable — a `<tr>` is not focusable by default, which would have left
the announced "press Enter to drag" affordance unusable.

The drop line is drawn on the row itself rather than as an element between rows,
because a native table has nowhere to put one. `onReorder` reports the whole key
order rather than just the moved row, so it can be persisted directly.

`dropOnRow` covers dropping rows *onto* a row — a workbook into a folder — and
enables dragging on its own. It is a separate case from reordering and composes
with it: `isTarget` decides per row whether a drop lands on that row, and
anything that says no falls through to reordering. Cloud has to treat the two as
mutually exclusive because ag-grid cannot express both.

It replaces Cloud's `isDropOnRowEnabled`, `isDropTarget`, `isDropOnRowAllowed`
and `onDropOnRow` with a single object, and drops `dropTargetRowKeyRef` / `dropTargetRefreshColumnKey`
entirely — those exist only because ag-grid cannot re-render one cell from React
state. `DraggableCollection` gained optional `onItemDrop` /
`shouldAcceptItemDrop` to support it.

Body rows are now a `TableRow` component rather than a render function, since
`useDraggableItem` is a hook and the row count varies between renders.
