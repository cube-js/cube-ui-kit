---
"@cube-dev/ui-kit": patch
---

Fix FilterPicker `renderSummary` to be evaluated regardless of selection state. The custom summary renderer and `renderSummary={false}` now work correctly even when no items are selected, providing consistent control over trigger content display.

