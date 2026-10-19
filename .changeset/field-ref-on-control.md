---
'@cube-dev/ui-kit': minor
---

A field's `ref` now points at its control with or without the field chrome, so a bare field's is never `null`, and the new `labelRef` reaches its label; reach the wrapper with `fieldProps={{ ref }}`. `wrapWithField(control, props)` takes no ref, and its three-argument form is deprecated. A bare date picker's `ref.focus()` now focuses its first segment, and `FileInput`'s ref resolves to its element instead of the inner button's handle.
