---
'@cube-dev/ui-kit': minor
---

**Breaking:** the required marker on a field label is now opt-in, and there is a new `isOptional` prop for the other half of the pair.

A `{ required: true }` validation rule used to put the asterisk on the label, because `useField` derived `isRequired` from the rules and merged it back into the input's props. That conflated two different statements: a rule says how the field _behaves_, while `isRequired` says what its label should _read_. So the two are now separate — the rule keeps driving validation and `aria-required` (it is what the field is, and screen readers should still hear it), and only an `isRequired` authored on the input, the `Form` or the legacy `<Field>` marks the label.

```jsx
{/* Was marked, now isn't — still validated, still `aria-required` */}
<TextInput name="email" label="Email" rules={[{ required: true }]} />

{/* Marked. `isRequired` adds the `required` rule for you, as before */}
<TextInput name="email" label="Email" isRequired />
```

To keep the marker on a field that only has a rule, either add `isRequired` (the rule is not duplicated) or ask for the indicator directly with `necessityIndicator="icon"` — an explicit indicator is a request in its own right and still wins.

New `isOptional` prop, on every input, the `Form` and `<Field>`: it marks the label with a quiet `(optional)` note, in the same slot the required marker uses. It is presentational only — it adds no rule, changes no validation, and is ignored when the field is required. The note is dimmed and unbolded against the label text, and it joins the field's accessible name, since nothing else tells a screen reader the field is optional.

`necessityIndicator` now also accepts `null`, which suppresses the marker entirely. `'label'` renders `(required)` / `(optional)` as before; `(optional)` has no icon form, so it renders as text under either setting.
