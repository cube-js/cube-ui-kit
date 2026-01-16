---
"@cube-dev/ui-kit": patch
---

Fix FilterListBox custom value styles not appearing until hover and leaking to other items after filter is cleared. The issue was caused by ListBox virtualization using index-based keys instead of actual item keys, causing React to incorrectly reuse DOM elements. Added `getItemKey` to the virtualizer to use actual item keys for proper DOM reconciliation.