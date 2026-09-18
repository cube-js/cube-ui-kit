# Modern Form: choose the API for the job

For a new modern form, start with `Form.useController<Model>()`, bind inputs with `field={form.field(path)}`, and submit through `<Form onSubmit={...}>` and `<Form.Submit>`. Add subscriptions only where other UI needs to read form state. The input components already subscribe to their own values and errors.

Existing `Form.useForm()` forms and roots without a modern controller use the legacy backend. Follow the [migration checklist](https://github.com/cube-js/cube-ui-kit/blob/main/docs/modern-form-migration.md) when converting one. `DialogForm` still requires a legacy instance; do not pass a modern controller through a cast.

Recipes: [API choices](#pick-one-binding-and-one-owner-for-each-concern), [reactive UI](#read-a-value-show-status-or-reveal-a-section), [server data](#load-server-data-refresh-defaults-or-discard-edits), [programmatic edits](#edit-values-from-an-event-handler), [validation](#validate-simple-rules-sibling-fields-or-an-api-response), [conditional fields and wizards](#hide-fields-use-nested-data-or-build-a-wizard), [submission](#submit-display-server-errors-and-reset), and [custom controls](#implement-a-reusable-custom-control).

## Start with an ordinary edit form

```tsx
import { Form, Switch, TextInput } from '@cube-dev/ui-kit';
import type { FormValues } from '@cube-dev/ui-kit';

interface Profile {
  email: string | null;
  notifications: boolean | null;
}

function ProfileForm({
  initialProfile,
  save,
}: {
  initialProfile: Profile;
  save: (values: FormValues<Profile>, signal: AbortSignal) => Promise<void>;
}) {
  const form = Form.useController<Profile>({ defaultValues: initialProfile });

  return (
    <Form form={form} onSubmit={(values, { signal }) => save(values, signal)}>
      <TextInput
        field={form.field('email', {
          rules: [{ type: 'email', message: 'Enter a valid email' }],
        })}
        label="Email"
        isRequired
      />
      <Switch field={form.field('notifications')} label="Notifications" />
      <Form.SubmitError />
      <Form.Submit>Save</Form.Submit>
      <Form.Reset>Reset</Form.Reset>
    </Form>
  );
}
```

The model describes possible values, including API `null`s. A text input displays `null` as empty and a switch displays it as unchecked; neither writes that display fallback into the form. Editing uses the control's normal change payload, and reset restores the nullable default. `FormValues<Model>` describes readonly, potentially incomplete data: registration and validation do not prove that every model property is present. Map to your API's request type explicitly where it requires complete data.

`defaultValues` initializes this controller once. A later `initialProfile` prop does not overwrite edits. Use the loading commands below, or remount the form with a record key when switching records should start a new editing session. Modern roots do not accept `defaultValues`.

## Pick one binding and one owner for each concern

| Concern | Start here | Use the alternative when… |
| --- | --- | --- |
| Connect an input | `field={form.field(path, options)}` | `name="email"` keeps a shared legacy/modern wrapper working. Names are not checked against the controller's model. |
| Locate the controller | Use the controller you created, or pass it as a prop | `Form.useControllerContext<Model>()` avoids prop threading in a descendant. It reads context without subscribing. |
| Configure a field | Put `rules`, `validate`, dependencies, and retention on the descriptor | Input-level registration props support reusable controls with their own defaults and legacy callers. Avoid configuring the same option in both places. |
| Present a field | Input props such as `label`, `description`, `isRequired` | `rules: [{ required: true }]` is useful when required validation needs a custom message or no visible required marker. |
| Handle submit/change/failure | Callbacks on the owning `<Form>` | Hook callbacks let a controller own behavior independently of a root, or provide defaults to a wrapper. Choose one location per callback. |
| Initialize values | Controller `defaultValues` | Field `defaultValue` supplies a fallback for a reusable field missing from the controller's data. |

`Form.Submit`, `Form.Reset`, and `Form.SubmitError` are aliases of the exported `SubmitButton`, `ResetButton`, and `SubmitError` components. This guide uses the `Form.*` names consistently; importing a standalone name does not select a different implementation.

A descriptor is pure configuration, so creating it inline is expected. It neither reads state nor registers a field; the mounted input registers after commit. It supplies the controller and path even outside the root, so adding `form` or `name` to the same input is unnecessary. If both are present, the descriptor wins. Descriptor options override only matching options they supply. In particular, descriptor `rules` or `validate` replaces input-level `rules`; put built-in rules and a custom validator together on the descriptor to run both.

Controller values and defaults take precedence over field defaults, including explicit `null` and `undefined`. Root callbacks override the corresponding hook callback while mounted; omitted or undefined root callbacks fall back to the hook callback. Business callbacks update after every committed render. Defaults, `errorPolicy`, and diagnostic handlers are creation options; update values through commands and override error policy per field when needed.

Use one owning root per controller. Omitted `form` props use context; explicitly passing `form={undefined}` detaches an input. Legacy roots and `FormScopeMask` hide the surrounding modern context.

## Read a value, show status, or reveal a section

| UI needs | Use | Why it exists |
| --- | --- | --- |
| One field's value | `Form.useValue(form, path)` | Checked path and inferred value without writing a selector. |
| A field's value, errors, or metadata | `Form.useFieldState(form, path)` | Checked path with typed value/default, errors, status, dirty, touched, and active state. |
| A derived result or form-wide flag | `Form.useSelector(form, selector)` | General selection, such as `state.isDirty` or `state.canReset`. |
| A small inline region that reacts independently | `<Form.Subscribe form={form} selector={...}>` | Keeps the subscription in that subtree without extracting a component. |
| A value in an event handler or effect | `form.getValue(path)` / `form.getValues()` | One-time imperative read; it does not subscribe React. |

The value and field-state hooks are conveniences over selectors. The choice between a hook and `Subscribe` is where rerenders should happen: hooks rerender their component, while `Subscribe` rerenders its children region. Creating a controller does not subscribe its owner. Prefer a leaf component for reusable reactive UI:

```tsx
function EmailPreview() {
  const form = Form.useControllerContext<Profile>();
  const email = Form.useValue(form, 'email');
  return <output>{email ?? 'No email set'}</output>;
}
```

Use `Subscribe` for a conditional section directly inside the form:

```tsx
<Form.Subscribe form={form} selector={(state) => state.values.notifications}>
  {(enabled) =>
    enabled ? <TextInput field={form.field('email')} label="Email" /> : null
  }
</Form.Subscribe>
```

These are alternative placements of the email input, not an instruction to mount it twice. Pass `form` to `Subscribe` for inferred model types. It can also use modern context when `form` is omitted, but React context cannot infer the ancestor's model. The generic on `useControllerContext<Profile>()` is your assertion that the ancestor uses `Profile`.

Selectors and equality functions must be pure. Select a primitive or a stable snapshot branch; allocating a fresh object compares unequal under the default `Object.is`. Supply `isEqual` when such an object should compare by its contents. `useFieldState` can return `undefined` before a path is tracked. Getter reads in JSX will not stay current. Plain objects and arrays in snapshots are deeply readonly and potentially incomplete; use commands for writes. Date-control values retain their methods; treat them and other non-plain values as immutable.

## Load server data, refresh defaults, or discard edits

Most forms need only initialization, adoption for incoming data, and reset for a new editing session. The other modes let integrations change the reset baseline independently of user interaction.

| Situation | Command | Effect |
| --- | --- | --- |
| Data is available before mounting | `Form.useController({ defaultValues })` | Seeds values and the reset baseline once. |
| A response arrives while the user may be typing | `adoptDefaultValues(response, { when: 'untouched' })` | Replaces the baseline and adopts untouched fields, preserving touched values. This is the default adoption policy. |
| Refresh fields that still match their previous defaults | `adoptDefaultValues(response, { when: 'clean' })` | Preserves dirty values, including programmatic edits; touched-but-clean fields can refresh. |
| Discard edits and start from a different record | `reset({ values: response })` | Replaces baseline and values, clears interaction/errors, and cancels pending submission. |
| Discard edits using the existing baseline | `reset()` / `<Form.Reset>` | Restores defaults and clears interaction/errors. |
| Change what Reset will restore without changing the draft | `setDefaultValues(response)` | Replaces only the baseline; dirtiness is recomputed against it. |

All defaults commands replace the baseline object; omitted keys are removed from it. Adoption also starts from the incoming object, then restores protected paths. It is not a partial patch. Use `setValue` or `setValues` for edits to current data.

### Advanced defaults policies

Use these only when the ordinary adoption or reset behavior above does not fit the interaction:

| Situation | Command | Effect |
| --- | --- | --- |
| Protect both touched and dirty fields | `adoptDefaultValues(response, { when: 'untouched', preserveDirty: true })` | Adds dirty-value protection to the touched check. |
| Replace values but keep touched state and submission state | `adoptDefaultValues(response, { when: 'always' })` | Replaces values and baseline; invalidates affected field validation. |
| Replace values and clear field interaction, keeping submission state | `setDefaultValues(response, { currentValues: 'replace' })` | Replaces values and baseline; clears touched/field validation, but does not cancel submission or clear its error. |

### Asynchronous loading

For asynchronous loading, protect both user edits and request ordering:

```tsx
useEffect(() => {
  const request = new AbortController();
  void load(request.signal)
    .then((profile) => {
      if (!request.signal.aborted) {
        setLoadError(undefined);
        form.adoptDefaultValues(profile, { when: 'untouched' });
      }
    })
    .catch((error: unknown) => {
      if (!request.signal.aborted) setLoadError(error);
    });
  return () => request.abort();
}, [form, load]);
```

Here `load` is a stable loader for the current record and `setLoadError` is local UI state; import `useEffect` from React. Gate editing on loading if a partially loaded record must never be submitted. When switching records, remount or reset the editing session: adopting an unrelated record while preserving old edits would mix the two.

## Edit values from an event handler

Use `setValue(path, value)` for one path and `setValues(partial)` for several top-level keys. Nested objects supplied to `setValues` replace those objects; use tuple paths to update an individual nested leaf. Neither command changes the reset baseline.

```tsx
<button
  type="button"
  onClick={() => form.setValue('notifications', true, { source: 'user' })}
>
  Enable notifications
</button>
```

`source: 'user'` defaults to touching the field and notifying `onValuesChange` when values change. Programmatic writes default to neither; override `touch` and `notify` explicitly when needed. `validate` defaults to `auto`; use `always` to force validation or `never` to invalidate without revalidating. `onValuesChange(values, change)` receives retained values and `{ names, source, kind }`. Use it for user-edit integrations such as a debounced draft saver; decide separately whether programmatic writes should trigger that saver. Defaults adoption, value replacement, and reset also notify this callback when they report changed paths; filter `change.kind` or `change.source` if only direct edits should be saved.

`batch(() => { ... })` combines synchronous commands into one publication. It is useful for several tuple writes; it is not a rollback transaction and must not wrap async work. `subscribe(listener)` is for imperative integrations that need every publication; React UI should use the hooks above and observers must call the returned unsubscribe function.

## Validate simple rules, sibling fields, or an API response

| Validation case | Start here |
| --- | --- |
| Required field with a visible marker | Input `isRequired`; it adds required validation too. |
| Email, length, range, pattern, or enum | Descriptor `rules` using the built-in constraints. |
| Custom domain check | Descriptor `validate(value, context)` for an inferred field value and checked reads. |
| Several custom rules or existing shared rule objects | `rules: [{ validator(rule, value, context) { ... } }]`; use `ModernValidationRule` for strict modern rule typing. |
| Validation depends on another form value | `dependsOn: ['password']`, or nested tuples such as `dependsOn: [['account', 'password']]`. |
| Validation captures props or other external values | `deps: [organizationId, checkName]`. Include changing functions too. |
| An integration explicitly versions function behavior | `rulesKey: revision`; ordinary forms can leave it out. |

`deps` and `dependsOn` deliberately have separate jobs. A string in `deps` is an external value; the same string in `dependsOn` names a form field. Use both when a validator reads both sources. `rulesKey` is an advanced function revision, not another place to list ordinary dependencies.

A password confirmation can declare its sibling dependency even when an early return skips the read:

```tsx
<TextInput
  field={form.field('confirmation', {
    dependsOn: ['password'],
    validate: (value, { getValue }) => {
      if (!value) return;
      return value === getValue('password') ? undefined : 'Passwords must match';
    },
  })}
  label="Confirm password"
  type="password"
  isRequired
/>
```

This example uses a controller whose model contains `password` and `confirmation`. A declared dependency change revalidates fields that were already validated or validating, unless the write requests `validate: 'never'`. Reads through validator `getValue`/`getValues` use one captured snapshot and cancel in-flight work if that data changes; reads alone do not schedule another run.

For a remote check, pass the cancellation signal and declare captured inputs:

```tsx
<TextInput
  field={form.field('name', {
    deps: [organizationId, checkName],
    validateTrigger: 'onChange',
    validationDelay: 200,
    validate: async (value, { signal }) => {
      if (!value) return;
      const available = await checkName(organizationId, value, signal);
      return available ? undefined : 'Name is already in use';
    },
  })}
  label="Name"
  isRequired
/>
```

Here the model contains a string `name`, and `checkName` returns `Promise<boolean>`. A validator succeeds by returning `undefined`, `null`, or an empty string. Return a ReactNode error, or throw/reject, to fail. Adapt legacy validators that resolve data objects; those are failures in the modern contract. Superseded results cannot overwrite current errors even if the validator ignores its signal.

Automatic validation honors `validateTrigger` and `validationDelay`. An `auto` write revalidates on-change fields and fields already showing errors; otherwise on-blur fields wait for blur. Explicit `form.validate()` and submission validate immediately; `form.validate(['email'])` selects a literal path, and `form.validate([['rows', 0, 'email']])` selects a nested path. Inspect `{ isValid, stale, fields }` before advancing a wizard step. Validation covers active fields only. `errorPolicy: 'first' | 'all'` controls rule-error collection, with `first` as the default.

Rule constraints and function source are compared automatically so equivalent inline validators do not restart pending work. Captures require `deps`; different functions with identical source, including bound/native functions, also need an explicit dependency or revision. `rulesKey` skips function-source comparison only; constraints such as `min`, `pattern`, and `required` are still compared. Update the key or dependencies when function behavior changes. `deps` alone retains source comparison.

## Hide fields, use nested data, or build a wizard

Unmounting the last input at a path removes it from `activeValues` immediately and retains its draft by default. Remounting restores that draft. Use `field={form.field('details', { preserve: false })}` when leaving a section should discard its current value. Cleanup removes the value, but its default baseline remains available to reset. Visually hiding an input while leaving it mounted does not unregister it.

| Payload | How to choose it | Validation |
| --- | --- | --- |
| Mounted fields | `<Form>` / `form.submit()` defaults | Active registered fields only. |
| All retained data, including hidden sections | `<Form submitValues="all">` or `form.submit({ include: 'all' })` | Still only active registered fields. |

For a wizard, validate a step before unmounting it and choose `submitValues="all"` if previous steps belong in the final payload. That does not revalidate unmounted steps. If final submission must validate every step against the latest data, keep the relevant inputs mounted or perform whole-payload validation explicitly. A form with no active fields is invalid.

Bind nested leaves with tuples: `field={form.field(['rows', index, 'email'])}`. A string such as `'user.email'` is one literal key, not dot notation. Numeric indices and numeric string segments address the same path. Removing an array path does not shift the other indices. Registering a parent object makes its complete value active; register leaf paths when only selected children belong in the active payload. Known literal paths are typechecked; widened dynamic paths are supported. The declaration surface requires TypeScript 5.4 or newer.

`getValues()` / `state.values` contains all retained data; `getActiveValues()` / `state.activeValues` contains registered paths. Dirty/touched metadata includes retained fields, while validity concerns active fields.

## Submit, display server errors, and reset

Use `<Form.Submit>` for normal submission, including Enter in the form. It handles loading and stays enabled after validation errors so users can request feedback again. `disableOnInvalid` opts into disabling it on invalid state. Use `form.submit()` for a workflow controlled from an event handler; inspect its result (`submitted`, `invalid`, `failed`, `ignored`, or `stale`) before continuing. Choose the payload independently for each call: imperative `submit()` defaults to active values even if the root has `submitValues="all"`.

To place actions or errors outside the root, pass the controller:

```tsx
<Form.Submit form={form}>Save</Form.Submit>
<Form.Reset form={form}>Reset</Form.Reset>
<Form.SubmitError form={form} />
```

An explicit-controller Submit targets that controller's owning form even inside another DOM form. Return or await the request in `onSubmit(values, { signal, include })`; concurrent submissions are ignored. Throwing or rejecting sets `submitError`, which `Form.SubmitError` displays with a safe generic fallback. Supply `renderError` to format application errors. Ordinary edits keep that error; another submit or reset clears it.

Use `setFieldErrors('email', ['Email is already registered'])` for a server error attached to an input and `clearFieldErrors('email')` to clear it. `setSubmitError` / `clearSubmitError` manage a form-level failure. `onSubmitFailed` receives `{ status: 'invalid', errors }` for field validation or `{ status: 'failed', error }` for a rejected submit callback; field validation does not set `submitError`.

`Form.Reset` is enabled when `state.canReset` is true: edits, touched/validation state, or a submit error can be cleared, and no submission is running. Use that selector for a custom reset UI. Direct `form.reset()` can also cancel an active submission; unmounting the owning root cancels it too. Action buttons preserve `onPress`; use `onClick` and `event.preventDefault()` to cancel their action. Root `onReset` can cancel before reset runs; `onResetCapture` is reserved for internal reset handling.

Native forms with `action`/`method` use browser submission and bypass the controller's submit pipeline. Use that path only when the browser should own the request.

## Implement a reusable custom control

Use the same field integration as built-in inputs: `FieldBaseProps<Value>`, `useFieldProps`, then `wrapWithField`. Map the control's value/event API and forward the generated id, blur, disabled, read-only, and invalid state to the interactive element. Include `null | undefined` in the accepted model type when empty values are supported and normalize only for display. Do not spread controller props onto a DOM element.

The [compiled CustomControl example](https://github.com/cube-js/cube-ui-kit/blob/main/typecheck/consumer/modern-form-examples.tsx) shows the complete pattern. The [component creation guide](https://cube-ui-kit.vercel.app/?path=/docs/getting-started-create-component--docs) explains the shared field wrapper. `Form.Item` / `Field` belongs to the legacy backend; it is not a second way to connect a modern custom input.

For SSR, seed the controller with the same serializable defaults on server and client. Initial hydration uses the creation snapshot before subscribers catch up with client state. Each mounted creator owns its controller; no manual disposal is needed.
