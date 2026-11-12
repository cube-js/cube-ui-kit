---
'@cube-dev/ui-kit': patch
---

**Tabs:** the selection indicator of `default` and `narrow` tabs now sits under the selected tab when the tabs are drawn inside an element with `transform: scale(…)`, such as a zoomable canvas, and stays there when that scale changes. Before, it was placed at the scale's share of the tab's offset and width.
