---
'@cube-dev/ui-kit': minor
---

**Breaking:** reworked the field label's necessity indicators. The required marker is now opt-in, `isOptional` is new, and the dead `necessityLabel` prop is gone.

A `{ required: true }` validation rule used to put the asterisk on the label, because `useField` derived `isRequired` from the rules and merged it back into the input's props. That conflated two different statements: a rule says how the field _behaves_, while `isRequired` says what its label should _read_. So the two are now separate — the rule keeps driving validation and `aria-required` (it is what the field is, and screen readers should still hear it), and only an `isRequired` authored on the input, the `Form` or the legacy `<Field>` marks the label.

```jsx
{/* Was marked, now isn't — still validated, still `aria-required` */}
<TextInput name="email" label="Email" rules={[{ required: true }]} />

{/* Marked. `isRequired` adds the `required` rule for you, as before */}
<TextInput name="email" label="Email" isRequired />
```

To keep the marker on a field that only has a rule, either add `isRequired` (the rule is not duplicated) or ask for the indicator directly with `necessityIndicator="icon"` — an explicit indicator is a request in its own right and still wins.

New `isOptional` prop, on every input, the `Form` and `<Field>`: it marks the label with a quiet `(optional)` note, in the same slot the required marker uses. It is presentational only — it adds no rule and changes no validation — and it is ignored when the field is required, including required by a rule, so the label can never claim a field is optional when the form will reject it empty. The note is dimmed and unbolded against the label text, and it joins the field's accessible name, since nothing else tells a screen reader the field is optional.

`necessityIndicator` now also accepts `null`, which suppresses the marker entirely. `'label'` renders `(required)` / `(optional)` as before; `(optional)` has no icon form, so it renders as text under either setting.

**Also removed:** the `necessityLabel` prop, from `FieldBaseProps`, `FormBaseProps`, `Form`, `DialogForm` and `<Field>`. It never did anything — it was declared, forwarded, controllable in Storybook and documented as working, but nothing ever read it. (`Label` held a local variable of the same name for the computed `(required)` / `(optional)` string, which is what made the gap easy to miss.) Removing it changes no rendering, only the types. It is also not worth implementing: it is one string for two mutually exclusive states, and on `FormBaseProps` it would stamp the same literal onto required and optional fields alike. Those strings are owned by i18n now (`form.required` / `form.optional`), so rewording them belongs in a translation override. For custom content beside a label use `labelSuffix` or `extra`; for the marker's shape use `necessityIndicator`.
