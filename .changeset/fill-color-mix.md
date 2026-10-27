---
'@cube-dev/ui-kit': minor
---

Update Tasty to 3.15.0 and paint every two-color fill as one solid background color, so axe-core and Lighthouse can check the text contrast of buttons, items and table cells. Table rows now publish `#row-overlay` as an opaque color plus `$row-overlay-weight`, the percentage cells mix it into `#row-base` at. If your table styles set `#row-overlay` to a translucent color such as `#purple.1`, set the opaque color and its weight instead: `'#row-overlay': '#purple', '$row-overlay-weight': '10%'`.
