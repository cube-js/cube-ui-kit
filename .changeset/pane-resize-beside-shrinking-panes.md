---
"@cube-dev/ui-kit": patch
---

`Layout.Pane` with `flexShrink={1}` now resizes correctly when other panes in the same flex container also give way. The edge follows the pointer and moves exactly 10px per arrow key (50px with Shift) instead of losing part of each move to the panes beside it, and the pane stays where it is dropped. The room comes from the panes after the edge, down to their `minSize`, where the resize stops; the panes before the edge keep their size. A pane that gives way keeps the size it was left at and reports it through `onSizeChange`. Beside such panes, a resize that ends where it began, such as an arrow key pressed at the stop, leaves every pane as it was and reports nothing. A drag only across a pane's grip, or a key across it outside a drag, no longer reports a size change.
