---
"@cube-dev/ui-kit": patch
---

Fixed a bug where styles would intermittently disappear from elements after garbage collection. The issue occurred when multiple CSS rules were deleted at non-contiguous indices, causing index corruption for remaining rules.
