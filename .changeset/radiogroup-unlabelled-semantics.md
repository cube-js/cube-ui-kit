---
"@cube-dev/ui-kit": patch
---

Keep the `radiogroup` role and name on a `RadioGroup`, `Radio.ButtonGroup` or `Radio.Tabs` that has an `aria-label` and no visible `label`. Such a group lost its role and name, `aria-orientation`, its `onFocus` and `onBlur`, React Aria's arrow keys, and `Shift+Tab` entry at its last radio when nothing is selected. The `radiogroup` role and the group's ARIA and `data-*` props now sit on the element that holds the radios, with a visible label too, where they used to sit on the field wrapper, so a role query or a `data-qa` given to a labelled group now finds the group rather than the whole field, and a `fieldProps` given to the group now reaches the field wrapper.
