---
"@cube-dev/ui-kit": patch
---

Make a `Skeleton` one "Content is loading" region rather than one per bar, and hide the placeholders inside it, and in a table's loading rows, from screen readers. A standalone `Placeholder` is still that region, and is no longer an empty `aria-live` region. `Result` and `Banner` hide their status icons from screen readers rather than letting them be read as unnamed graphics.
