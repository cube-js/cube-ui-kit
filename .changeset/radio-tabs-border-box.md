---
'@cube-dev/ui-kit': patch
---

`Tabs` with `type="radio"` now keeps its pill inside the `Tabs` box in an app without a global `box-sizing: border-box` reset. Before, the pill painted `1x` past the box, so a sibling placed with a flex `gap` ended up touching it.
