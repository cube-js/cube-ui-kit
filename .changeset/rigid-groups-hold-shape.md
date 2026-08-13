---
'@cube-dev/ui-kit': patch
---

`Board`: a multi-widget selection now moves as one rigid block for the whole drag, and displaces the widgets standing wherever it lands instead of being pushed around by them. Previously, dragging a group **up** could leave it where it was while only some of the widgets above it slid down, and members with different neighbours above them ended up on different rows — letting an unrelated widget (a full-width divider, for example) land between them. Dragging a group **sideways** was worse: the group itself sank below the widgets it was supposed to move aside, which made those widgets look pinned in place. Members keep their exact offsets until the drag ends, at which point the board compacts as usual.
