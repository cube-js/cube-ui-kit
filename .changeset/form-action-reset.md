---
'@cube-dev/ui-kit': patch
---

Fix a native reset of a `<Form action>`, for both `Form.useForm()` and `Form.useController()` forms. The form now resets once and reports the defaults to `onValuesChange`, as a form without `action` already did. Before, React Aria wrote each input's starting value on its own, so `formElement.reset()` could leave a `CheckboxGroup` empty. In a `Form.useController()` action form, `Form.Reset` never reset the controller, and the root `onReset` ran only after those writes, too late to cancel them. `action` still hands submission to the browser.
