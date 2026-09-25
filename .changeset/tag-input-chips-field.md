---
"@cube-dev/ui-kit": minor
---

Add `TagInput`, a multi-value field whose values show as removable chips below a single-line input. Values are committed with Enter or a delimiter (a comma by default), pasted lists are split into chips, `validateTag` rejects a value with a message, `normalizeTag` rewrites typed values before they are checked, and `maxTags` caps the list. With `TagInput.Item` options it becomes a combobox that toggles several options in a row, and `allowsCustomValue` lets the user add values that are not in the list. Backspace in the empty input moves to the last chip and the next one removes it; Escape or typing on a chip goes back to the input. `isClearable` adds a Clear all button, and `tagProps` sets per-chip props, including a label and `isDisabled` to lock a value. The field value is a `string[]` and works with `Form` rules.
