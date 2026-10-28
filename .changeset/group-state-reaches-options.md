---
"@cube-dev/ui-kit": patch
---

A `RadioGroup` (including `Radio.ButtonGroup` and `Radio.Tabs`) or `CheckboxGroup` given `isDisabled={false}` inside a disabled `<Form>` or `<Provider>` now enables its options, as an explicit `false` does on every other field. Before, the group itself was enabled but each option stayed disabled. The same holds for a `CheckboxGroup` given `isReadOnly={false}` inside a read-only form. A group that sets neither prop still follows its form, and an option's own `isDisabled` still wins over its group. A loading button radio is now disabled unless the radio itself sets `isDisabled={false}`: a `false` it inherits from its group, form or provider no longer keeps it clickable while it loads.
