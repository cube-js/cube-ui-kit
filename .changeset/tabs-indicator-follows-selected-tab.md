---
'@cube-dev/ui-kit': patch
---

**Tabs:** the selection indicator of `default` and `narrow` tabs now follows the selected tab when it changes size or moves while the selection stays the same: a title that loads after the tab is selected, a renamed tab, a tab before it that grows or shrinks, a tab added or closed before it, or a reorder through `keyOrder`. Before, it kept the width and place it measured when the tab was selected, so a tab opened with a short placeholder title kept a short indicator once its real title loaded, and the published (compiled) build did not re-measure when tabs were added, closed or reordered either.
