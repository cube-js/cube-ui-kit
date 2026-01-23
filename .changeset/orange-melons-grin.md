---
"@cube-dev/ui-kit": patch
---

Fixed inset, padding, and margin style handlers to correctly assign values to directions in the order they appear. Previously, `inset: 'right 1x top 0'` would incorrectly map values based on direction position rather than input order. Now values are correctly assigned: first value to first direction, second value to second direction, etc.
