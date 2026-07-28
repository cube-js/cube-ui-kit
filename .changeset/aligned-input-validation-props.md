---
'@cube-dev/ui-kit': minor
---

Align the API of all form input components around `isInvalid` / `isValid`.

- Every input component now accepts `isInvalid` and `isValid` booleans instead of `validationState`. `Form`, `DialogForm` and the legacy `Field` accept them too.
- `validationState` still works but is deprecated. It is normalized into `isInvalid` / `isValid` at the edge and logs a deprecation warning in development.
- Explicit validation props now take precedence over the state derived from the form. Previously form-derived state could override an explicitly passed prop.
- `useFieldProps` is now the single entry point for input components — it applies `useProviderProps` and `useFormProps` internally. Calling them explicitly is still supported but no longer necessary.
- `TextInputBase` became purely presentational, which removes a duplicate field registration in the text input family. As a result `SearchInput` no longer registers with a surrounding `Form` — like `SearchComboBox`, it is a standalone control rather than a form field. Use `TextInput` or `ComboBox` when you need a form-attached field.
- Fixed `DateInput` never rendering the valid state. It forwarded only the invalid state to its input chrome, so neither an explicit valid prop nor a form-derived valid state (`showValid`) produced the valid styling or the check icon.
- Every input component now renders the valid state, not just the invalid one. `Checkbox`, `Switch` and `Radio` gained valid fill and border styling, `Picker` and `FilterPicker` gained the validation suffix icon that `Select` already had, and `FileInput`, `Slider`, `RangeSlider` and `TextInputMapper` render validation state at all for the first time — they previously accepted `isInvalid` / `isValid` and ignored them.
- New exports for building input components: `resolveValidationProps`, `useValidationProps`, `getValidationMods`, `getValidationTheme`, `getValidationIcon`, `hasValidationIndicator` and `<ValidationIndicator>`.
- Removed the unused `extractFieldWrapperProps` helper.
