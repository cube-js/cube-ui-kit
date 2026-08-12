---
'@cube-dev/ui-kit': patch
---

**DataTable, ItemTable**: resizing a column no longer moves its neighbours.

A column with no explicit width is `flex: 1` and shares the leftover space.
Resizing made only the dragged column fixed, leaving every other one in the flex
pool to re-split a leftover that had just changed — so dragging one divider
resized all of them, including columns to the *left* of the handle. Dragging a
column by +8px measurably took 3px off each of the other three.

Every column is now frozen at its current width when a drag starts, so the drag
changes exactly one. Columns after it are pushed along and the table grows or
shrinks, rather than the neighbours absorbing the difference.
