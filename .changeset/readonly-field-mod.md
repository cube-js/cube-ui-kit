---
"@cube-dev/ui-kit": minor
---

Read-only fields no longer look editable. `isReadOnly`, on a field or from a read-only `Form`, `Checkbox.Group` or `Radio.Group`, now sets a `readonly` mod and a default look: a recessed fill and a softer border, with the value and label at full contrast. A checked `Checkbox`, an on `Switch` and a selected classic `Radio` show a dark mark in place of the brand fill. A read-only field takes no hover state. This covers `TextInput`, `TextArea`, `PasswordInput`, `SearchInput`, `NumberInput`, `CommandTextArea`, `ColorInput`, `TagInput`, `ComboBox`, `SearchComboBox`, `DateInput`, `TimeInput`, `DatePicker`, `DateRangePicker`, `DateRangeSeparatedPicker`, `PeriodPicker`, `Checkbox`, `Switch` and `Radio`. Button and tabs radios get the mod and lose their hover state and pointer cursor, and keep their look. Style the `readonly` key in `styles` or `inputStyles` to change the look.
