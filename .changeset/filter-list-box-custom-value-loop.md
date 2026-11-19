---
"@cube-dev/ui-kit": patch
---

A standalone `FilterListBox` with `items`, a render function and `allowsCustomValue` no longer throws "Maximum update depth exceeded" when a selected key isn't among the items: the selected value is listed at the top as a custom value. `FilterPicker` wasn't affected.
