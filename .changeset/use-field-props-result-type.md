---
'@cube-dev/ui-kit': patch
---

`useFieldProps`'s return type no longer promises what the hook strips. It no longer lists `field`, `dependsOn` or `deps`, and it drops a `Form.useController()` controller from `form`'s type: `form` declared as `FormController<…>` comes back `undefined`, while a `Form.useForm()` instance comes back as before. A custom control that read the controller off the result compiled and then threw on its first write. It now fails to compile: take the controller from the control's own props, or write through the bound `onChange`. The check needs `form` declared in an interface that extends `FieldBaseProps` (or `Omit<FieldBaseProps, 'form'>`); `FieldBaseProps` types `form` as `any`, and an intersection with it stays `any`.
