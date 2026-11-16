---
'@cube-dev/ui-kit': patch
---

`Tabs` no longer scrolls the page to bring the active tab into view. When a tab becomes active, on mount or on a selection change, only the tab strip scrolls so that tab is fully visible: a page with a tab strip below the fold now opens at its top instead of scrolled down to the strip.
