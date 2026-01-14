---
"@cube-dev/ui-kit": patch
---

Fix infinite loop crash when selecting measures in DataPane. Memoized ref callbacks in Item and TextItem components to prevent React from repeatedly detaching/attaching refs during commit phase, which was causing "Maximum update depth exceeded" errors.