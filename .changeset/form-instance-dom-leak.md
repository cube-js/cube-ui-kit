---
'@cube-dev/ui-kit': patch
---

Fix `PasswordInput`, `TextArea`, `CommandTextArea`, `Checkbox`, `CheckboxGroup`, `RadioGroup`, `Switch` and `Select` rendering `form="[object Object]"` on their native input when bound to a `Form.useForm()` instance, whether through a surrounding `<Form>` or the `form` prop. React Aria writes `form` onto the input as the id of the `<form>` it belongs to, so the attribute named no form and detached the input from its own: pressing Enter in a `PasswordInput` submitted nothing. The form instance no longer reaches the DOM. On the text fields, a `form` id passed through `inputProps` still applies.
