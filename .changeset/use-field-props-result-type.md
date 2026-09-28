---
'@cube-dev/ui-kit': patch
---

`useFieldProps`'s return type now matches what the hook returns at runtime. It no longer lists `field`, `dependsOn` or `deps`, which the hook always strips, and it drops a `Form.useController()` controller from `form`'s type, because the controller is stripped too: `form` declared as `FormController<…>` comes back `undefined`, while a `Form.useForm()` instance still comes back as before. A custom control that read the controller off the result compiled and then threw on its first write. It now fails to compile: take the controller from the control's own props, or write through the bound `onChange`. A `form` typed `any`, as `FieldBaseProps` declares it, is not checked.
