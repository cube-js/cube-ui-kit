---
"@cube-dev/ui-kit": patch
---

`ComboBox` and `NumberInput` with a `name` now submit their value in a native `<form>`, as `TextInput` and `Select` do. A hidden input carries ComboBox's selected key (its typed text with `allowsCustomValue`) and NumberInput's number, not the text either input shows. A disabled field submits nothing.
