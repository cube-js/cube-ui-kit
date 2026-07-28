# Input Component Rules

Rules for **input components** — components that can be attached to a `<Form>`. An input component is
anything that calls `useFieldProps` and accepts a `name` prop, e.g. `TextInput`, `Select`, `ComboBox`,
`Checkbox`, `RadioGroup`, `Switch`, `Slider`, `DatePicker`, `FileInput`, `ListBox`, `Picker`.

All input components live under `src/components/fields/{ComponentName}/`.

## 1. Prop contract

- Extend `FieldBaseProps` from `src/shared/index` (it already includes `FormBaseProps` + `FieldCoreProps`).
  Never redeclare shared field props (`label`, `name`, `isRequired`, `isDisabled`, `description`, `rules`, …).
- Name the props interface `Cube{ComponentName}Props`.
- Mix in tasty style-prop interfaces (`ContainerStyleProps`, `OuterStyleProps`, …) as needed.

### Validation props

- Use **`isInvalid`** and **`isValid`** booleans. Never add or read `validationState`.
- `validationState` is a deprecated compatibility prop. It is normalized into `isInvalid`/`isValid`
  by `useFieldProps` and stripped from the resolved props, so component bodies never see it.
- Precedence (implemented once in `resolveValidationProps`):
  1. explicit `isInvalid` / `isValid`
  2. explicit `validationState` (logs a deprecation warning in dev)
  3. form-derived state (field errors, or `showValid` + a valid field status)
- `isInvalid` wins over `isValid` when both resolve to `true`.
- Pass `isInvalid` straight through to React Aria hooks — they accept it natively and have deprecated
  `validationState` themselves.

## 2. Hooks

`useFieldProps` is the **single entry point**. It already applies `useProviderProps` and `useFormProps`
internally, so a component body needs one call:

```tsx
function MyField(props: CubeMyFieldProps, ref) {
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onBlur',
    valuePropsMapper: ({ value, onChange }) => ({ value: value ?? '', onChange }),
  });

  // props.id is set, props.labelProps.for matches it,
  // props.isInvalid / props.isValid are resolved booleans.
}
```

Rules:

- **Do not** call `useProviderProps` or `useFormProps` manually in an input component.
- **Do not** generate your own `useId()` and **do not** set `labelProps.for` — `useFieldProps` owns both.
- **Do not** call `useField` directly. It is internal to `useFieldProps` and to the legacy `<Field>`.
- If a component must read the raw props before context merging (e.g. `Checkbox` distinguishing its own
  props from group context), capture `originalProps = props` before the `useFieldProps` call.

### `useFieldProps` params

- **`defaultValidationTrigger`** — `'onChange'` for toggles and selection controls (`Checkbox`, `Switch`,
  `Radio`, `Select`, `ListBox`, `FileInput`), `'onBlur'` for free-text controls (`TextInput`, `TextArea`,
  `NumberInput`, `DateInput`).
- **`valuePropsMapper`** — maps the form value onto the component's own value API. Required whenever the
  component does not use `value`/`onChange` verbatim (`selectedKey`/`onSelectionChange`,
  `isSelected`/`onChange`, `selectedKeys`, …).
- **`unsafe__isDisabled`** — opts out of field wiring for the lifetime of the mount. Only for components
  that can be nested inside a group that owns the form connection (`Checkbox` inside `CheckboxGroup`).
  The value must be stable across renders.

### Two modes

`useFieldProps` behaves differently depending on `name`:

| Mode | Condition | Behaviour |
| --- | --- | --- |
| Form-connected | `name` is set | Calls `useField`: registers the field, owns value/onChange/onBlur, derives validation state, generates an incremental id from the field name (`email`, `email_1`, …) |
| Standalone | no `name` | Does **not** call `useField`. Preserves the caller's `value`/`onChange` and only generates an id via React's `useId()` |

Never call `useField` for standalone fields — the extra state management breaks controlled components.

The form itself comes from the `form` prop when it is set, and from `FormContext` otherwise. That makes
`<TextInput name="email" form={form} />` a supported way to link an input to a form it is not nested in, and
to override the surrounding form. Keep `form` in the props of every form-attachable component and always
pass the whole props object to `useFieldProps` so this keeps working.

`useFormProps` stays a public export because wrappers outside the UI Kit call it to read the form context and
then hand adjusted props to a nested input. Since it merges as `{ ...context, ...props }`, and `useFieldProps`
applies it again, any prop the wrapper sets explicitly wins — but a **deleted** key falls back to the context
value. To detach a nested input from the form, pass `form={undefined}` (or `null`) explicitly, or omit `name`;
destructuring `form` away is not enough.

## 3. Field chrome

- Wrap the control with `wrapWithField(control, domRef, props)` as the return value. It renders a
  `FieldWrapper` (label, description, message, necessity indicator) when `label` or `forceField` is set,
  and returns the bare control otherwise.
- `wrapWithField` destructures the wrapper props itself. Pass the full `props` object; do not hand-pick
  keys and do not blank out `form`.
- Shorthands are merged by the wrapper: `fieldStyles` → `fieldProps.styles`, `labelStyles` →
  `labelProps.styles`. Do not merge them in the component.
- The `id` belongs on the interactive control, never on the field wrapper.

## 4. Base components are presentational

`TextInputBase`, `DateInputBase` and similar `*Base` components render markup only. They must not call
`useFieldProps`, `useFormProps`, `useProviderProps` or `useField`. Form wiring belongs to the public
component that renders the base (`TextInput`, `TextArea`, `PasswordInput`, `NumberInput`,
`CommandTextArea`). Wiring a field in both the wrapper and the base registers the field twice.

## 5. Search controls are not form fields

`SearchInput` and `SearchComboBox` look like inputs but are **not** form-attachable. They drive local UI
filtering, so they never register with a form. They call `useProviderProps` + `useValidationProps` instead
of `useFieldProps`, which gives them the shared validation props and provider defaults without registering
a field. Do not add `useFieldProps` to them.

## 6. Shared validation helpers

Import from `src/components/form/validation`:

- **`getValidationMods({ isInvalid, isValid })`** → `{ invalid, valid }` for tasty `mods`.
- **`getValidationTheme(theme, { isInvalid, isValid })`** → `'danger'` / `'success'` / the passed theme,
  for trigger buttons and items.
- **`<ValidationIndicator isInvalid isValid isLoading />`** — renders the `data-element="State"` suffix
  block (validation icon or loading spinner). Use `hasValidationIndicator()` to decide whether a
  `data-element="Suffix"` container is needed at all.
- **`resolveValidationProps(props)`** / **`useValidationProps(props)`** — normalization. Only
  `useFieldProps` and components outside the field pipeline should need these.

Do not hand-write `{ invalid: …, valid: … }` mods or validation-icon markup.

### Validation support matrix

Every input component renders **both** states. When you add a new one, copy the reference that matches its
shape instead of inventing a new treatment. Mirror the danger token the component already uses with its
success counterpart (`#danger` → `#success`, `#danger-text.50` → `#success-text.50`) rather than picking a
new color.

- **Input chrome** — `valid` / `invalid` border on `INPUT_WRAPPER_STYLES` plus a `<ValidationIndicator>`
  suffix. Reference: `TextInputBase`. Used by `TextInput`, `TextArea`, `PasswordInput`, `NumberInput`,
  `CommandTextArea`, `SearchInput`, `SearchComboBox`, `ComboBox`, and — through `DateInputBase` —
  `DateInput`, `TimeInput`, `DatePicker`, `DateRangePicker`, `DateRangeSeparatedPicker`. `FileInput`
  reuses the same border tokens and indicator on its `Action`-based control.
- **Trigger button** — `getValidationTheme` for the danger theme plus `getValidationIcon` appended to the
  trigger's `suffix`. Reference: `Select`. Used by `Picker` and `FilterPicker`.
- **Listbox border** — `valid` / `invalid` border on the list container. Reference: `ListBox`. Used by
  `FilterListBox`. `ListBox` items additionally map the state onto an item theme via
  `getValidationTheme(…, { includeValid: true })`.
- **Control fill and border** — `getValidationMods` on the control element with matching `fill` / `border`
  / `color` entries. Reference: `Checkbox`. Used by `Switch` and `Radio`. `CheckboxGroup` and `RadioGroup`
  own no chrome of their own; they publish the state through `FormContext` and the items render it.
  Button-shaped radios go through `getValidationTheme('default', …, { includeValid: true })`.
- **Track and thumb fill** — `Slider` and `RangeSlider`. The state is resolved inside `SliderBase`, so it
  reaches `SliderThumb` / `SliderTrack` through `SliderBaseChildArguments`, not through the outer props.
- **Delegated to inner inputs** — `TextInputMapper` forwards `isInvalid` / `isValid` to its
  `KeyComponent` and `ValueComponent`.

`HueSlider` is not form-attachable (it never calls `useFieldProps`) and has no validation state.

## 7. DOM conventions

- Set `data-input-type` on the interactive element (`textinput`, `checkbox`, `datetimeinput`, …).
- Default the `qa` prop of the control to the component name: `qa={qa || 'Checkbox'}`.
- Spread through `filterBaseProps(otherProps)` so style props never reach the DOM.
- Use `extractStyles(props, STYLE_PROP_LIST)` for the root styles.

## 8. Deliverables per input component

Every input component ships:

- `ComponentName.tsx` — implementation following the rules above
- `index.tsx` — re-export, wired into the category barrel and `src/index.ts`
- `ComponentName.stories.tsx` — shared argTypes from `src/stories/FormFieldArgs.ts` (use `VALIDATION_ARGS`
  rather than re-declaring `isInvalid` / `isValid`); set a default `width` in meta args; export a single
  `Validation` story rendering the valid and invalid case together (see [storybook.md](storybook.md))
- `ComponentName.docs.mdx` — links `Supports all [Field properties](/docs/getting-started-field-properties--docs)`
  instead of duplicating field props (see [documentation.md](documentation.md))
- `ComponentName.test.tsx` — uses `renderWithForm` for form integration and `renderWithRoot` otherwise
  (see [tests.md](tests.md))

After changing an input component's API, run `pnpm audit-docs --component=ComponentName`.
