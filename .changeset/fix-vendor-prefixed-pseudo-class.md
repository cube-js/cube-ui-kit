---
"@cube-dev/ui-kit": patch
---

**Fix:** Vendor-prefixed pseudo-classes (e.g. `:-webkit-autofill`, `:-moz-placeholder`) are now correctly tokenized as pseudo-classes instead of being misinterpreted as boolean modifiers (`[data-webkit-autofill]`).
