---
'@cube-dev/ui-kit': minor
---

**Breaking:** removed the `necessityLabel` prop from `FieldBaseProps`, `FormBaseProps`, `Form`, `DialogForm` and the legacy `<Field>`.

It never did anything. The prop was declared on the shared field types, forwarded by `Field` and `DialogForm`, exposed as a Storybook control and documented as working — but nothing ever read it. `Label` used to hold a local variable of the same name for the computed `(required)` / `(optional)` string, which is what made the gap easy to miss on inspection; the prop itself has been a no-op in every release since it was introduced. Deleting it changes no rendering, only the types.

It is not worth implementing rather than removing. It is one string for two mutually exclusive states, declared on `FormBaseProps` — so a form-level value would stamp the same literal onto required and optional fields alike. Those strings are also owned by i18n now (`form.required` / `form.optional`), so the way to reword them everywhere is a translation override, not a prop.

To put custom content next to a label, use `labelSuffix` (after the label text) or `extra` (at the far end of the label row). Both already work. To change the shape of the marker itself, use `necessityIndicator`.
