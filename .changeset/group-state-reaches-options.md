---
"@cube-dev/ui-kit": patch
---

A `RadioGroup` (including `Radio.ButtonGroup` and `Radio.Tabs`) or `CheckboxGroup` given `isDisabled={false}` inside a disabled `<Form>` or `<Provider>` now enables its options, as an explicit `false` does on every other field. Before, the group itself was enabled but each option stayed disabled. The same holds for a `CheckboxGroup` given `isReadOnly={false}` inside a read-only form. A group that sets neither prop still follows its form, and an option given `isDisabled` is still disabled inside an enabled group. A group's `isReadOnly` now also makes other fields rendered inside it read-only, such as a `TextInput` next to its options, as its `isDisabled` already disabled them. A loading button radio is now disabled unless the radio itself sets `isDisabled={false}`: a `false` it inherits from its group, form or provider no longer keeps it clickable while it loads.
