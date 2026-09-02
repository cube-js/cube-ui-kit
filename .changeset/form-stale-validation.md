---
'@cube-dev/ui-kit': patch
---

Fix `Form` publishing stale validation results: changing a field's value (by typing, `setFieldValue()` or `setFieldsValue()`) now invalidates a validation that is still running for the previous value, so an async validator that settles late can no longer show an error, or a valid state, for a value the user has already replaced. The pending `validateField()` promise still settles for its caller.
