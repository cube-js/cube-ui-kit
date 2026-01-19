---
"@cube-dev/ui-kit": patch
---

Fixed variant switching causing DOM element recreation. Components with `variants` now preserve their DOM element and state when the `variant` prop changes.
