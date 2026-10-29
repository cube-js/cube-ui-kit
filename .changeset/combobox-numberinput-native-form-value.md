---
"@cube-dev/ui-kit": patch
---

`ComboBox` and `NumberInput` with a `name` now submit their value in a native `<form>`, as `TextInput` and `Select` do. A hidden input carries ComboBox's selected key (its typed text with `allowsCustomValue`) and NumberInput's number, not the text either input shows. A disabled field submits nothing. In tests, user-event submits on Enter without a submit button only when the form holds a single `<input>`, and it counts the hidden one, so such a form whose only field is one of these needs a submit button; browsers still submit it.
