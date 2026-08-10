---
'@cube-dev/ui-kit': patch
---

Fix `ItemTable` trapping the mouse wheel when it has nothing to scroll.

The scroller carried a blanket `overscroll-behavior: contain`, which is what
stops a horizontal swipe at the scroll edge from triggering browser
back-navigation. But Chrome honours it on any `overflow: auto` element,
including one whose content fits — so a five-row table swallowed the wheel and
the page behind it would not move.

Containment is now measured and applied per axis, only where the table can
genuinely scroll. The back-navigation protection is unchanged for a
horizontally scrollable table, and everything else chains to the page as usual.

Also fixes the last row's separator doubling up with the footer's top border
into a single 2px line.
