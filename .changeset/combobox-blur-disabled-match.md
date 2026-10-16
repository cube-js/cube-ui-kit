---
"@cube-dev/ui-kit": patch
---

`ComboBox` no longer selects a disabled item when focus leaves the input. Typing the label of an item in `disabledKeys`, or text that leaves a disabled item as the only match, used to select it on blur and report it through `onSelectionChange`, although it cannot be picked with the pointer or keyboard. Such text now counts as invalid input: the input shows the selected item's label again (or nothing when no item is selected), and with `clearOnBlur` both the selection and the input are cleared. A disabled item that is already selected stays selected when focus leaves.
