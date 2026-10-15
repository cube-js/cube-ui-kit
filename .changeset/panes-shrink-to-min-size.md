---
"@cube-dev/ui-kit": patch
---

`Layout.Pane` now shrinks down to its `minSize` (`2x` when unset) when its flex container runs short, so the content beside it keeps its room, as `ResizablePanel` did. Before, it held its full size and pushed that content out.
