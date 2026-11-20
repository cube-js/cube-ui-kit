---
'@cube-dev/ui-kit': patch
---

**Form:** a form built with `Form.useController` now stores a `NumberInput` the user clears as `null` instead of `NaN`. The field reads as empty: `type`, `min`, `max` and other format rules skip it and `required` (or `isRequired`) reports it, so an optional number field can be cleared and submitted, and a number typed and cleared back to a `null` default no longer counts as an edit (`isDirty`, the dialog's "Discard changes?"). Form values, `onSubmit`, `onValuesChange` and custom validators now get `null` for a cleared number, so a `Number.isNaN` check there no longer matches it; `Number.isFinite` keeps working, and `?? fallback` now catches it. Type a number field `number | null`, and use `null`, not `NaN`, as an empty number default. The input's own `onChange` and `validate` still receive `NaN`, a `NaN` set from code is still validated, and the legacy form is unchanged.
