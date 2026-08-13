---
'@cube-dev/ui-kit': patch
---

`Board`: a multi-widget selection now moves as one rigid block for the whole drag. Dragging a group **up** displaces the widgets standing in its way instead of stalling behind them — previously the group could refuse to move at all while only some of the widgets above it slid down, and members with different neighbours above them ended up on different rows, letting an unrelated widget (a full-width divider, for example) land between them. Members keep their exact offsets until the drag ends, at which point the board compacts as usual.
