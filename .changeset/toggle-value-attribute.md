---
"@cube-dev/ui-kit": patch
---

A form-bound `Checkbox` or `Switch` keeps the `value` you give it. It used to render `value="true"` or `value="false"` as soon as the field had a value, so a native `<Form action>` submission and `FormData` read the boolean instead of `value="yes"`; without a `value`, a checked one now submits the browser default `on`. The same change stops a custom control built on `useFieldProps` from receiving the field value as `value` when its `valuePropsMapper` maps it to another prop.
