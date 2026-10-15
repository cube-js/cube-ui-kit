---
"@cube-dev/ui-kit": patch
---

`Layout.Pane` now keeps its `minSize` on screen. With `flexShrink={1}`, a pane gives way only down to its `minSize` (`2x` when unset) instead of always down to `2x`, as `ResizablePanel` did, and a `minSize` given as a CSS length now takes effect. Resizing a pane that has given way starts from the size it is drawn at, so the first moves are no longer lost.
