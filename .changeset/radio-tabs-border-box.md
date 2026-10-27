---
'@cube-dev/ui-kit': patch
---

`Tabs` with `type="radio"` now keeps its pill inside the `Tabs` box in an app without a global `box-sizing: border-box` reset. Before, the pill painted `1x` past the box, so it sat `1x` closer to a sibling than the flex `gap` between them, and a `width` on `Tabs` made the pill `1x` wider than that width.
