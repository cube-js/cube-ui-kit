---
"@cube-dev/ui-kit": minor
---

Context menus open on a touch long press. Every menu that opens on right-click — `useContextMenu` targets, `Tree` and `Tabs` context menus, and `ItemTable`/`DataTable` row and column menus — now also opens at the touch point when a finger is held still for 500 ms, on iOS too, which fires no `contextmenu` event. Lifting the finger doesn't also press the row, a text selection doesn't start, and iOS's link and image callout is off on those elements. A tap, a scroll and a mouse long press behave as before.
