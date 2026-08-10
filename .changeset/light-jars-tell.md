---
'@cube-dev/ui-kit': minor
---

Add row links, row actions and a row menu to `ItemTable`.

`rowLink` turns the row-header cell into a stretched anchor covering the whole
row. Because it is a real `<a href>`, ⌘-click, middle-click and "Open in new
tab" work natively — none of which an `onClick` handler can give you. The anchor
sits below the cells' own content in the stacking order, so a button or menu
trigger inside a cell still takes its own clicks, and its accessible name comes
from the row-header cell. The linked cell is styled as a link — the anchor
itself is invisible, so without it a row gives no sign that it navigates.
`onRowAction` is the non-navigational alternative.

`rowMenu` supplies `Menu.Item` children and `rowContextMenu` decides where they
are exposed — a `⋮` trigger column, right-click and Shift+F10, or both. A row
whose menu resolves to nothing gets no trigger, and right-clicking it falls
through to the browser's own context menu. Mirrors `Tree`'s
`menu`/`contextMenu`/`onAction` API.
