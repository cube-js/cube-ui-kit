---
'@cube-dev/ui-kit': patch
---

**Tabs:** inside an element with `transform: scale(…)`, such as a zoomable canvas, the selection indicator of `default` and `narrow` tabs now sits under the selected tab and stays there when the scale changes, and a strip with more tabs than fit scrolls the active tab fully into view. Before, both were off by the scale: the indicator was placed at the scale's share of the tab's offset and width, and the strip scrolled only that share of the way.
