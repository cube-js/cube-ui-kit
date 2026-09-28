---
'@cube-dev/ui-kit': patch
---

`useFieldProps`'s return type now matches what the hook returns at runtime. It no longer lists `field`, `dependsOn` or `deps`, which the hook always strips, and a `form` that can hold a `Form.useController()` controller is typed `undefined`, because the controller is stripped too; a `Form.useForm()` instance still comes back as before. A custom control that read the controller off the result compiled and then threw on its first write. It now fails to compile: take the controller from the control's own props, or write through the bound `onChange`.
