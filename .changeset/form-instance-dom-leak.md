---
'@cube-dev/ui-kit': patch
---

Fix `PasswordInput`, `TextArea`, `CommandTextArea`, `Checkbox`, `CheckboxGroup`, `RadioGroup`, `ColorSwatchGroup`, `Switch` and `Select` rendering `form="[object Object]"` on their native inputs when bound to a `Form.useForm()` instance, whether through a surrounding `<Form>` or the `form` prop. React Aria writes `form` onto the input as the id of the `<form>` it belongs to, so the attribute named no form and detached the input from its own: pressing Enter in a `PasswordInput` submitted nothing. The form instance no longer reaches the DOM, so these inputs now behave inside a legacy form as they already did with `Form.useController()`: Enter in a `PasswordInput` submits the form, Enter on a `Checkbox`, `Switch` or radio submits it when the form has a submit button, and a native form reset reaches them. On the text fields, a `form` id passed through `inputProps` still applies.
