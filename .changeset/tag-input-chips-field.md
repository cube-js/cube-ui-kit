---
"@cube-dev/ui-kit": minor
---

Add `TagInput`, a multi-value field whose values show as removable chips below a single-line input. Values are committed with Enter or a delimiter (a comma by default), pasted lists are split into chips, and `validateTag` rejects a value with a message. With `TagInput.Item` options it becomes a combobox that toggles several options in a row, and `allowsCustomValue` lets the user add values that are not in the list. The field value is a `string[]` and works with `Form` rules.
