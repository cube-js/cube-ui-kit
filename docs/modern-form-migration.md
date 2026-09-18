# Migrating a form to the modern controller

Modern Form is opt-in per form. Existing `Form.useForm()` calls, roots without a controller, and legacy wrappers continue to use the legacy engine. Start with a leaf form whose defaults, conditional fields, and submission payload are understood. Do not swap the backend of a mounted root: choose one component at a migration boundary and remount when changing that choice.

The [compiled consumer examples](https://github.com/cube-js/cube-ui-kit/blob/main/typecheck/consumer/modern-form-examples.tsx) cover creation with a colocated selector, narrow descendant subscriptions, conditional fields, async defaults, a custom control, and cancellable validation. `pnpm build && pnpm test:types:consumer` checks those examples against the declarations consumers receive. React 18 and 19 run the adapter tests both with and without React Compiler; the published library itself remains uncompiled.

## Choose the backend explicitly

```tsx
const [legacy] = Form.useForm();
// <Form form={legacy}> retains the existing behavior.

const modern = Form.useController<Profile>({ defaultValues: initialProfile });
// <Form form={modern}> selects the modern engine.
```

`Form.useController()` returns a stable command object. Defaults and store policy are read once; business callbacks update after each committed render without replacing values. Seed defaults in the creation hook, then use commands for fetched data. Modern roots reject `defaultValues`; callback props on the root bind the latest committed callbacks. An omitted or undefined root callback falls back to its latest hook counterpart.

The following API mapping describes migration choices; names are not mechanically interchangeable.

| Legacy API or pattern | Modern equivalent |
| --- | --- |
| `const [form] = Form.useForm()` | `const form = Form.useController<T>()` |
| `form.isDirty` in JSX | `Form.useSelector(form, state => state.isDirty)` |
| `getFieldValue(name)` / `getFieldsValue()` | Imperative `getValue(path)` / `getValues()` |
| Read a value during render | `Form.useValue(form, path)`; selectors / `Subscribe` for derived or inline UI |
| `setFieldsValue(values)` | `setValues(values)`; review touch/notification/validation options |
| `setInitialFieldsValue(values)` | `setDefaultValues(values)` to change the baseline; `adoptDefaultValues` to load data into eligible fields |
| `resetFields()` | `reset()`; `reset({ values })` replaces baseline and current values |
| `validateFields()` | `validate()` returns `{ isValid, stale, fields }`; inspect the result and each field's errors |
| `submit()` | `submit()` returns a tagged result such as `submitted`, `invalid`, or `failed` |
| `Form.Item` wrapping a custom control | `useFieldProps` plus `wrapWithField` inside that control |

`DialogForm` and Cloud's `NarrowForm` / `SaveableCard` currently expose legacy instance contracts. Keep their callers legacy until the wrapper itself is migrated and verified. Passing a modern controller through a cast does not migrate the wrapper. `Form.Item`, legacy mutable flags, and the legacy `FormContext` instance shape remain compatibility APIs.

## Review the behavior changes

The [Modern Form guide](modern-form-guide.md) is the reference for implementing forms. Start there for [API choices](modern-form-guide.md#pick-one-binding-and-one-owner-for-each-concern), [reactive reads](modern-form-guide.md#read-a-value-show-status-or-reveal-a-section), [incoming data](modern-form-guide.md#load-server-data-refresh-defaults-or-discard-edits), [validation](modern-form-guide.md#validate-simple-rules-sibling-fields-or-an-api-response), and [submission](modern-form-guide.md#submit-display-server-errors-and-reset). The following differences need particular attention during migration:

| Area | Migration decision |
| --- | --- |
| Field bindings and paths | Prefer `field={form.field(path, options)}`. Strings are literal keys; convert legacy dot notation to tuples for nested data. Do not configure the same binding through `field`, `name`, and `form`. |
| Empty API values | Include `null` in the model where the API returns it. Built-in typed bindings display an empty state without rewriting the stored null. |
| Render-time reads | Use `useValue`, `useFieldState`, or selectors. Imperative getters and the controller creator do not subscribe React. |
| Late defaults | Defaults initialize once. Choose adoption to preserve edits, reset for a new editing session, or baseline-only updates deliberately. |
| Programmatic writes | `setValue` / `setValues` do not touch or invoke `onValuesChange` by default. Review `source`, `touch`, `notify`, and `validate` options. |
| Validator result | `undefined`, `null`, and an empty string succeed. Return an error or throw/reject to fail. Adapt validators that resolve a data object. |
| Validator dependencies | `deps` contains external captures; `dependsOn` contains form paths for revalidation. Reads only cancel stale in-flight work. Ordinary validators do not need `rulesKey`. |
| Hidden fields and payload | Unmounted fields retain drafts by default but leave the default active submission payload. `submitValues="all"` includes retained values and still validates only active fields. |
| Actions | Modern Submit remains enabled after errors by default. Opt into `disableOnInvalid` if required. Reset follows `state.canReset`, which includes touched/validation/error state. |
| Errors and cancellation | `onSubmitFailed` distinguishes `invalid` from `failed`. Reset and root unmount cancel submission; ordinary edits retain submit errors. |
| Custom controls | Use `useFieldProps` and `wrapWithField`; `Form.Item` remains legacy-only. |

## Per-form migration checklist

1. Record existing defaults, validation timing, dynamic names, conditionally mounted fields, and submitted payloads. Keep the legacy form available for a rollback.
2. Check surrounding wrappers. Migrate a wrapper explicitly or choose a form that does not rely on its legacy instance API.
3. Create a typed controller and move initial defaults into its creation options. Choose adoption/reset semantics for later data.
4. Replace render-time getters and flags with narrow selectors or `Subscribe`. Update custom controls through `useFieldProps`.
5. Adapt validators' success values and cancellation. Declare external captured inputs in `deps` and sibling form paths in `dependsOn`.
6. Decide whether hidden fields are retained and whether submission uses active or all values. Verify the actual payload with conditional sections both visible and hidden.
7. Test required/async errors, double submit, server failure, reset, unmount during requests, keyboard focus, and navigation guards. Modern Submit stays enabled after validation errors; pass `disableOnInvalid` to retain the legacy disabled-button behavior. Verify this visible change with QA. Confirm unaffected fields and the creator do not rerender on each keystroke.
8. Run source and built-consumer type checks, the frozen legacy contract suite, React 18/19 compiler checks, and relevant browser checks. Review visual changes before merging.

To revert a migrated form, render the preserved legacy component again and restore its legacy defaults/callback/validator contracts. Remount the boundary and deliberately transfer serializable draft values if needed. Do not cast the modern controller to a legacy instance or toggle hook implementations in place.
