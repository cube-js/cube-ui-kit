---
"@cube-dev/ui-kit": patch
---

A field given `isDisabled`, `isReadOnly`, `isRequired`, `isInvalid` or `isValid` as `undefined` now keeps the state of its enclosing `<Form>` or `<Provider>`, as it does when the prop is left out. Before, the `undefined` replaced it, so a wrapper passing an optional `isDisabled` through rendered an enabled field inside a disabled form. `false` still overrides the form or provider. This applies everywhere `useProviderProps` is used: every input, `SearchInput`, `SearchComboBox`, `Label`, the calendars, a nested `Form` and `Form.Submit`/`Form.Reset`. Form presentation props such as `labelPosition`, and `form` itself, are unchanged: `form={undefined}` still detaches a field from its form.
