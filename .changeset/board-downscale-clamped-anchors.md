---
'@cube-dev/ui-kit': patch
---

`<Board collisionMode="downscale">` (and the cross-board half of `"swap"`) now shrinks a widget into free room on **either** side of a blocker, not just the left.

`gridBounds` clamps a drag anchor to `cols - w`, which assumes the widget keeps the width it started with. So when the blocker sat to the left and the room to its right was narrower than the widget, every anchor a pointer could produce landed inside the blocker — the mode whose whole job is to shrink the widget into that room never got offered it, and the drop just reverted. Dropping into room on the _left_ always worked, because column 0 is reachable whatever the widget's width.

A blocked drop now also considers the cells the widget already covers that the clamp put out of the pointer's reach, taking the largest fit among them. Anchors a pointer could have selected on its own are untouched, so every drop that resolved before resolves to exactly the same cell. The row axis clamps the same way, so boards with a finite `maxRows` get the same fix below a blocker.
