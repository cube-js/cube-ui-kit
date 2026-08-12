---
'@cube-dev/ui-kit': minor
---

**DataTable, ItemTable**: add a built-in column menu. A column exposes one
through `header.menu`, opened from a `⋮` trigger in the header, by right-click,
or with Shift+F10 — `columnContextMenu` picks which of those surfaces are live.
The pressed key comes back through `header.onMenuAction` and then
`onColumnMenuAction(action, columnKey)`, as written and without React's `.$`
prefix, so the menu's contents stay entirely the consumer's.

Sorting is the one thing the table knows how to do itself, so the reserved keys
`sort-asc`, `sort-desc` and `clear-sort` are labelled, disabled when they would
do nothing, and applied before the consumer hears about them. `columnSortMenu()`
returns those items ready to drop into `header.menu`.

Also fixes `isMenuEmpty` so an empty fragment counts as an empty menu, which is
the shape a conditionally-assembled `rowMenu` or `header.menu` produces — such a
menu now renders no trigger instead of one that opens nothing.
