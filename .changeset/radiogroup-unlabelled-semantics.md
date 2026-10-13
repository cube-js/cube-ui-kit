---
"@cube-dev/ui-kit": patch
---

Keep the `radiogroup` role and name on a `RadioGroup`, `Radio.ButtonGroup` or `Radio.Tabs` that has an `aria-label` and no visible `label`. Such a group lost its role and name, `aria-orientation`, its `onFocus` and `onBlur`, and `Shift+Tab` entry at its last radio when nothing is selected. With a visible label too, the `radiogroup` role and the group's ARIA and `data-*` props now sit on the element that holds the radios instead of the field wrapper. A role query or a `data-qa` given to a labelled group therefore finds the group rather than the whole field, and a `fieldProps` given to the group now reaches the field wrapper.
