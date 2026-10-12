---
"@cube-dev/ui-kit": patch
---

Keep the `radiogroup` role and name on a `RadioGroup`, `Radio.ButtonGroup` or `Radio.Tabs` that has an `aria-label` and no visible `label`. Without a label the group renders no field wrapper, and that wrapper was where React Aria's group props went, so such a group lost its role, name and `aria-orientation`, its `onFocus` and `onBlur`, React Aria's arrow keys, and the reset that lets `Tab` enter an unselected group at either end. They now sit on the group element itself, with a label too, so the `radiogroup` role moves from the field wrapper to the group that holds the radios.
