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
| Read a value during render | `Form.useSelector` or `Form.Subscribe` |
| `setFieldsValue(values)` | `setValues(values)`; review touch/notification/validation options |
| `setInitialFieldsValue(values)` | `setDefaultValues(values)` to change the baseline; `adoptDefaultValues` to load data into eligible fields |
| `resetFields()` | `reset()`; `reset({ values })` replaces baseline and current values |
| `validateFields()` | `validate()` returns `{ isValid, stale, fields }`; inspect the result and each field's errors |
| `submit()` | `submit()` returns a tagged result such as `submitted`, `invalid`, or `failed` |
| `Form.Item` wrapping a custom control | `useFieldProps` plus `wrapWithField` inside that control |

`DialogForm` and Cloud's `NarrowForm` / `SaveableCard` currently expose legacy instance contracts. Keep their callers legacy until the wrapper itself is migrated and verified. Passing a modern controller through a cast does not migrate the wrapper. `Form.Item`, legacy mutable flags, and the legacy `Form.Context` instance shape remain compatibility APIs.

## Subscribe where the UI reads state

Creation does not subscribe the component. A selector subscribes its caller; a `Form.Subscribe` render function subscribes only that subtree. A colocated selector is valid when the whole creator should render on that selection. Otherwise place the selector in a child or use `Subscribe`.

```tsx
<Form.Subscribe form={form} selector={state => state.values.name}>
  {name => <output>{name}</output>}
</Form.Subscribe>
```

Selectors and equality functions must be pure. Select a primitive or a stable snapshot branch. A newly allocated object compares unequal with the default `Object.is`; supply `isEqual` when selecting several values into a fresh object. `Form.useControllerContext<T>()` gives a descendant the controller without subscribing it. The generic describes that root's values; it cannot verify an ancestor's type.

`getValue`, `getValues`, `getActiveValues`, `getFieldSnapshot`, and `getSnapshot` are imperative reads for handlers and effects. They do not make JSX reactive. `subscribe(listener)` supports imperative observers and returns an unsubscribe function. `batch(fn)` groups synchronous commands into one publication; it is not a rollback transaction, and the callback must not be async.

Omitted `form` props use context. Explicit `form={undefined}` detaches an input. `Form.Subscribe` and `useControllerContext` require modern context; legacy roots and `FormScopeMask` mask it. An explicit modern controller can be used outside a root. Use only one owning root for each controller.

## Retained data and active fields

| View | Contents | Typical use |
| --- | --- | --- |
| `state.values` / `getValues()` | All retained values, including defaults for unmounted fields | Draft previews, autosave, restoring hidden sections |
| `state.activeValues` / `getActiveValues()` | Values at registered field paths | The default validated submission payload |

Hiding a field unregisters it immediately. Its value stays retained by default, so showing it again restores the draft. `preserve={false}` removes that value after cleanup; the default baseline remains, so reset can restore it. An intervening update or Strict Mode reconnection prevents stale cleanup from removing a live value. Removing an array path keeps other indices stable.

`submit()` validates active fields and submits active values. Use `submit({ include: 'all' })` only when retained fields belong in the payload; validation still covers active fields only. Registering a parent object includes its complete object; register leaf paths instead when only selected children should be active. A form with no active fields is invalid. Dirty/touched metadata includes retained fields; validity considers active fields.

Named UI Kit inputs accept literal string names. Prefer `field={form.field(path)}` for checked field names, inferred validator values, and nested tuple bindings. Controller commands accept the same paths. `'user.email'` is one literal key, while `['user', 'email']` addresses an object. Numeric array indices and numeric string segments address the same path. Known keys and tuples infer values; misspelled literal paths are rejected. Widened string/tuple paths remain dynamic; open `Record` models retain typed values. Declare an explicit model with `Form.useController<Model>()` when defaults omit fields or contain values narrower than the intended model. The declaration surface requires TypeScript 5.4 or newer.

```tsx
form.setValue('name', 'New name');
form.setValue(['rows', 0, 'email'], 'person@example.com');
// Static keys and tuple leaves reject values of the wrong type.
```

Snapshots own copies of plain objects and arrays. Public `FormValues<T>` / `FormReadValue<T>` types reflect readonly, potentially incomplete nested data. Treat dates, files, other non-plain objects, and error payloads as immutable. Defaults and values on the controller take precedence over field defaults, including explicit null and undefined. Reusing a mutated input object does not replace its previously captured snapshot; send a new object.

## Load defaults without erasing edits

Use `adoptDefaultValues(response, { when: 'untouched' })` for a response that may arrive after typing. It replaces the baseline and adopts values at eligible paths, preserving touched edits. `when: 'clean'` protects dirty fields, while `when: 'always'` deliberately replaces them. Abort or ignore obsolete requests; the complete `AsyncDefaults` example demonstrates both request cleanup and a stale-response guard.

Use `setDefaultValues(response)` when only the baseline should change. `{ currentValues: 'replace' }` replaces current values too. `reset({ values: response })` replaces baseline and values and clears interaction, validation, and submission error state. Defaults commands replace the baseline object, so omitted keys are removed from it.

Programmatic writes do not touch fields or invoke `onValuesChange` unless requested. User writes do both by default. Review `{ source, touch, notify, validate }` for each imperative write. `onValuesChange` receives retained values and metadata describing the changed paths/source/kind.

## Validation, custom controls, and submission

Built-in named inputs register after commit and select only their value, errors, and validation status. Custom controls call `useFieldProps`, map their event/value API, then give the resolved props to `wrapWithField`. Forward the generated id, blur, disabled, read-only, and invalid state to the actual control; do not spread a controller onto a DOM element. The `CustomControl` example is typechecked against the public API.

For modern custom validators, return an error (including a ReactNode), or throw/reject it. Return undefined, null, or an empty string on success. A legacy validator that resolves a data object must be adapted: a modern validator treats that result as an error. Use `ModernValidationRule` to check authored modern rules strictly; shared input props remain permissive enough for existing legacy rules. Legacy forms keep their existing validator behavior.

Validators receive `{ signal, name, getValue, getValues }` as the third argument. Pass the signal to network requests. Superseded work settles as stale even if the validator ignores cancellation. Use `rulesKey` for dependencies captured by a validator whose function source stays the same (for example, an organization id). Keep service callbacks stable or include their revision in that key too. Equivalent rule signatures do not restart pending validation.

`validationDelay` coalesces automatic validation; explicit validation and submission run immediately by default. Auto writes revalidate on-change fields and fields already showing errors. On-blur fields otherwise wait for blur. `errorPolicy` chooses first/all rule errors. Errors remain visible while revalidating and clear on nonvalidating edits.

Root `onSubmit` receives the selected payload and an abort signal; `onSubmitFailed` receives `{ status: 'invalid', errors }` or `{ status: 'failed', error }`. Concurrent submits are ignored. Reset and owning-root release cancel pending submission. Submit start and reset clear `submitError`; ordinary edits keep it. `Form.Submit`, `Form.Reset`, and `Form.SubmitError` subscribe to the modern state. Native `action`/`method` forms continue browser navigation and bypass this pipeline.

## Per-form migration checklist

1. Record existing defaults, validation timing, dynamic names, conditionally mounted fields, and submitted payloads. Keep the legacy form available for a rollback.
2. Check surrounding wrappers. Migrate a wrapper explicitly or choose a form that does not rely on its legacy instance API.
3. Create a typed controller and move initial defaults into its creation options. Choose adoption/reset semantics for later data.
4. Replace render-time getters and flags with narrow selectors or `Subscribe`. Update custom controls through `useFieldProps`.
5. Adapt validators' success values and cancellation, and version captured dependencies with `rulesKey`.
6. Decide whether hidden fields are retained and whether submission uses active or all values. Verify the actual payload with conditional sections both visible and hidden.
7. Test required/async errors, double submit, server failure, reset, unmount during requests, keyboard focus, and navigation guards. Confirm unaffected fields and the creator do not rerender on each keystroke.
8. Run source and built-consumer type checks, the frozen legacy contract suite, React 18/19 compiler checks, and relevant browser checks. Review visual changes before merging.

To revert a migrated form, render the preserved legacy component again and restore its legacy defaults/callback/validator contracts. Remount the boundary and deliberately transfer serializable draft values if needed. Do not cast the modern controller to a legacy instance or toggle hook implementations in place.

### Typed fields and focused reads

Prefer typed descriptors for new modern forms. `form.field(path, options)` is pure configuration: it does not read current values, register a field, or subscribe the owner. Inputs register after commit and infer their allowed value type from `FieldBaseProps<Value>`. A descriptor takes precedence over `form`/`name`; its options take precedence over matching input validation/default options. Keep presentation such as labels and `isRequired` on the input. Existing `name` bindings remain available for legacy-compatible controls.

Typed built-in field bindings accept `null` and `undefined` alongside their normal model value, so nullable API responses can be used directly. Display normalization does not change the stored value: a switch displays `null` as unchecked and a text input displays it as empty, while the form retains `null` until an edit or explicit command changes it. Controls keep their existing change payloads (for example, switches emit booleans), and reset restores nullable defaults. Declare nullable fields in the model so validators and value selectors also include `null`.

```tsx
const form = Form.useController<Profile>({
  defaultValues: initialProfile,
  onSubmit: (values, { signal }) => save(accountId, values, signal),
});

<TextInput field={form.field(['profile', 'name'])} label="Name" />;
<TextInput
  field={form.field('email', {
    deps: [organizationId],
    validate: (value, { signal }) => checkEmail(organizationId, value, signal),
  })}
  label="Email"
/>;
```

`validate(value, context)` infers the field value and checked paths in `context.getValue(path)`. Declare external inputs with `deps`, compared by `Object.is`. Field reads through `getValue` automatically become dependencies; `getValues()` depends on the whole values object. `dependsOn` can declare paths before the validator reads them. Each run reads one captured snapshot. Changes abort obsolete work, invalidate the dependent result, and revalidate previously validated or validating fields (unless a value command requests `validate: 'never'`). Rule/dependency changes preserve visible errors while the replacement run is pending. Inline function identity does not restart validation, so change `deps` when captured inputs change.

Use `Form.useValue(form, path)` for a reactive value and `Form.useFieldState(form, path)` for typed value/defaults, errors, status, dirty/touched, and active state. Both support nested tuples and subscribe only to their selection; place them in leaf components when the form owner should not rerender. State may be `undefined` before a field has registered. Snapshot read types are deeply readonly and potentially incomplete; use controller commands for writes.

### Modern actions and errors

`<Form submitValues="all">` includes retained values for native Enter and button submission; the default is `active`. Validation still targets active registrations. Explicit-controller Submit buttons target that controller even in an external footer or another DOM form, preserve native action forms, and submit once. `disableOnInvalid={false}` allows a modern Submit button to run validation while errors are visible; the default remains `true`. Reset is enabled when values, interaction state, validation state, or submit errors can be reset; root reset cancellation is honored.

Root business callbacks override hook callbacks while mounted. Omitted or undefined root callbacks restore the latest committed hook callback. Changing defaults remains an explicit command. Unmounting the owning root cancels pending submission.

`onSubmitFailed` receives `{ status: 'invalid', errors }` for validation failures and `{ status: 'failed', error }` for submission exceptions. `<Form.SubmitError form={form} renderError={error => ...} />` supports external placement and application-specific formatting. Omit `renderError` for the existing safe generic fallback.
