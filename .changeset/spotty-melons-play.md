---
'@cube-dev/ui-kit': minor
---

Add column resize to `ItemTable`.

`isResizable` puts a grab handle on each column's trailing edge, built on React
Aria's `useMove` — the same hook behind `Board`'s widgets — so the handle takes
keyboard input for free: arrow keys to resize, Home/End to jump to the column's
minimum and maximum. That is an accessibility affordance ag-grid never gave
Cloud. Widths clamp to each column's `minWidth` / `maxWidth`, and a column opts
out with its own `isResizable: false`.

Each resizable column draws a visible edge at rest rather than only on hover —
an affordance you have to find by hovering an 8px strip is one nobody finds. The
grab area is centred on the column boundary rather than tucked inside the cell,
so it can be taken from either side of the line.

`onColumnResize` fires once the gesture ends rather than on every pixel, and
`columnWidths` is in the default `persist` list, so pairing `isResizable` with
`storageKey` restores a resized table on reload. A controlled `columnWidths`
still tracks the pointer during the drag — the width is drafted internally and
handed over when the gesture settles.
