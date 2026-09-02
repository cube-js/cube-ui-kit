# Legacy Form contract

This folder freezes the behaviour of the current Form engine (`CubeFormInstance`, `useForm`, `<Form>`, `useField`, `useFieldProps`, `Field`/`Form.Item`, `DialogForm` and the helper components) as **recorded, not designed**. It is Phase 1 of the Form and React Compiler modernization plan: the legacy backend keeps this behaviour until it is removed in a separately approved major release, and the modern backend is allowed to differ only where a row below says so.

Nothing in this folder changes product code. It ships no runtime, and it is excluded from the package.

## Contract classes

Every `it()` name starts with one of four labels. They are greppable and they are the review vocabulary for any later change to the legacy engine.

| Label | Meaning |
| --- | --- |
| `[frozen]` | Frozen legacy contract. Preserve until legacy removal. Cloud relies on it or can reasonably rely on it. |
| `[bug-eligible]` | Legacy bug eligible for a surgical fix. Fix only with an explicit compatibility review; the test then flips to `[frozen]` with the corrected value. |
| `[undefined]` | Undefined legacy behaviour. Do not rely on it; warn where practical. The modern backend owes it nothing. |
| `[design-input]` | Modern design input. Legacy behaviour recorded because the modern backend intentionally differs (see the plan, §7.2–§7.5). |

Run the suite with `pnpm test -- legacy-contract`. It is part of `pnpm test`.

## Phase 0 baselines

Recorded on the stand before any of this landed.

| Item | Value |
| --- | --- |
| `ui-kit` commit | `b204a4d7` on `main` (package version 0.175.0) |
| Dependencies | `react`/`react-dom` 19.1.1 (dev), `@tenphi/tasty` 3.5.0, `@tenphi/glaze` 2.0.0, Node 24.18.0, pnpm 10.34.5 |
| Full test suite (`pnpm test`) | 103 files, 2222 passed, 1 skipped, 42.7s. With this folder: 110 files, 2330 passed, 1 skipped, 58.2s |
| Type check (`tsc --noEmit`) | 18 pre-existing errors, none in Form code (`CommandMenu.stories` ×4, `CommandTextArea` ×3, `caretPosition` ×2, `Tooltip.stories` ×2, `eslint-plugin/fixtures` ×2, probe harnesses ×4, `Item.test` ×1); ~30s. This folder adds none |
| Build (`pnpm build`) | 15.3s |
| Size (`pnpm size`, local macOS) | `All` 515.57 kB of 517 kB; `Tree shaking (just a Button)` 123.02 kB of 125 kB — unchanged by this work, which adds no runtime code |
| Cloud (`cubejs-enterprise`) commit | `99823df0` on `master`; `console-ui` consumes `@cube-dev/ui-kit` 0.172.0 |
| Cloud Form usage (grep, not AST-aware) | 107 `console-ui` files read a mutable getter (`getFieldValue`, `getFieldInstance`, `isDirty`, `isFieldDirty`, `isSubmitting`, …) |

Cloud grep counts (lines / files under `packages/console-ui/src`): `getFieldValue` 97/40, `setFields` 71/35, `useForm(` 64/62, `.isDirty` 29/16, `isFieldDirty` 27/15, `.isSubmitting` 21/8, `getFieldsValue` 14/11, `submitError` 12/6, `getFormData` 10/6, `getFieldInstance` 4/3, `.isInvalid` 5/5, `forceReRender` 1/1, `new CubeFormInstance` 0/0, `Form.Item` 62/12, `<Field ` 69/28, `DialogForm` 191/60, `action=` 50/20. The AST-aware inventory that separates render-time reads from imperative reads (plan Phase 0, step 8) is still to do and lives in the Cloud repo.

## Contract table

One row per item of plan §7.1. "Existing" points at the pre-existing spec that already covers the visible behaviour; the new spec fills the gaps and pins the instance-level contract.

| # | Behaviour | Spec | Classes | Recorded outcome |
| --- | --- | --- | --- | --- |
| 1 | Creation | `instance-and-binding` | frozen, undefined | `Form.useForm()` returns one stable instance and installs `forceReRender` on its creator. `useForm(instance)` adopts without installing anything, so a bare `new CubeFormInstance()` passed to `<Form>` **never rerenders anything** (undefined). Classify direct construction as unsupported for reactive use. |
| 2 | Context binding | `instance-and-binding`; existing `field.test` | frozen | Named inputs register with the context form; unnamed ones do not. `CheckboxGroup`/`RadioGroup` register once and mask the context so options never register, even with a `name`. |
| 3 | Explicit precedence / detachment | `instance-and-binding`; existing `explicit-form-prop.test`, `unbind-form-prop.test` | frozen | Explicit `form` wins over context; `form={undefined}` and `form={null}` both detach and leave the input controlled by its own props. |
| 4 | Form identity change after mount | `instance-and-binding` | undefined | `<Form form={b}>` after mounting with `a` keeps using `a`. An input whose `form` prop changes registers with the new form **and stays registered in the old one**. |
| 5 | Registration order, duplicates | `instance-and-binding` | frozen, undefined | `getFieldNames()` is mount order. Two inputs with one name share a field object; unmounting either deletes it and the survivor re-registers with the default value (undefined). |
| 6 | Dynamic names | `instance-and-binding` | frozen, undefined | Renaming re-registers under the new name and drops the old value. Switching between named and standalone changes the hook order in `useFieldProps` and throws (`Should have a queue…` / a React internal `TypeError`). |
| 7 | First-mount defaults | `defaults-and-values`; existing `field.test` | frozen, undefined | Form defaults seed fields without dirtying them. A field-level `defaultValue` fills an empty field and becomes its baseline. When both exist the field default wins for an untouched field **but the Form default stays the dirty baseline**, so the field starts dirty (undefined). |
| 8 | Form default changes after mount | `defaults-and-values`; existing `field.test` | frozen | Current values are untouched, the dirty baseline moves, `resetFields()` adopts the new defaults. |
| 9 | Field-level `defaultValue` changes | `defaults-and-values`; existing `field.test` | frozen | Applied on every untouched render, ignored after touch, and only the first one reaches the baseline. |
| 10 | Reset after default changes | `defaults-and-values` | frozen | `resetFields()` restores the current Form defaults and clears touched, errors, status; `resetFields(names)` is scoped. |
| 11 | Value kinds | `defaults-and-values` | frozen, bug-eligible, design-input | `''` survives reset. `null` survives mount but **becomes `undefined` (and dirty) after reset** (bug-eligible). Arrays/objects compare by `JSON.stringify`: an equal copy is not a change (design-input). Dot paths flatten in `getFieldsValue()` and nest in `getFormData()`; setting an object on a parent path fans out with `null` for missing keys. |
| 12 | Setters before registration / unmount | `defaults-and-values` | frozen | `setFieldValue`/`setFieldsValue` are ignored for unregistered fields. `setInitialFieldsValue()` and `setFields()` are the two ways to seed before mount; a later mount adopts them. |
| 13 | Registered-only getters and submission | `defaults-and-values` | frozen | `getFieldsValue()`, `getFormData()` and `onSubmit` see mounted fields only. |
| 14 | Conditional unmount / remount | `defaults-and-values` | frozen | Unmount deletes the value; remount starts from the default, untouched. |
| 15 | User vs programmatic changes | `change-and-callbacks`; existing `submit.test` | frozen | User changes (and `setFieldValue(…, true)`) touch and notify; plain `setFieldValue` does neither but does dirty. `setFieldsValue(values, true)` notifies once per batch; `…, false` clears touched. |
| 16 | Equal-value setters | `change-and-callbacks` | frozen | `setFieldValue` with an equal value is a full no-op (errors kept). `setFieldsValue` with an equal value **clears that field's errors and status** without notifying or rendering. |
| 17 | `onValuesChange` payload and timing | `change-and-callbacks` | frozen | Synchronous, once per keystroke, with the nested `getFormData()` payload. |
| 18 | Changing and removing callbacks | `change-and-callbacks` | frozen, bug-eligible | A new callback replaces the old one. Passing `undefined` **leaves the previous `onValuesChange`/`onSubmit` installed** (bug-eligible; `useForm` only writes truthy callbacks). |
| 19 | Instance created above the root | `instance-and-binding`, `render-baseline` | frozen | `<Form>` installs its callbacks on the external instance; mutations rerender the creating component, not just `<Form>`. |
| 20 | Validation triggers and status | `validation`, `change-handler` | frozen, bug-eligible | Text inputs validate on blur; `onChange` validates per change. Status is `undefined → valid \| invalid`; `isValid` needs every field valid, `isInvalid` needs one invalid; a cached status short-circuits until the value changes. One user change is one form update and one validation run, and the caller's own `onChange`/`onBlur` run once, before the field's (until the double-handler fix `useFieldProps` merged the field's handlers twice, so every change and blur ran them twice; see `change-handler.test.tsx`). **Changing an invalid field clears its errors without revalidating**; a cached `invalid` status rejects the bare error where a fresh run rejects `[error]`. |
| 21 | Delayed and overlapping validation | `validation` | frozen | Overlapping runs: only the latest publishes. `validationDelay` coalesces rapid changes into one validator run. |
| 22 | Changes during validation | `validation` | frozen, bug-eligible, undefined | `resetFieldsValidation()`/`resetFields()` discard the pending result. **A value change does not** (bug-eligible): the stale result publishes against the new value. A result that lands after unmount still writes into the detached field object and rerenders the owner (undefined). Inline rule arrays do not trigger validation by themselves; rules are re-read at the next run. |
| 23 | Error shape | `validation` | frozen | Only the first failing rule reports. `Error` → its message; empty rejection → `rule.message`; anything else passes through, including ReactNodes. |
| 24 | Submission | `submission`; existing `submit.test` | frozen | Validates all registered fields, skips `onSubmit` on failure (`onSubmitFailed` not called), passes `getFormData()`, ignores a second `submit()` while one is in flight. |
| 25 | `Error` vs non-`Error` rejection | `submission`; existing `submit.test`, `submit-error.test` | frozen | Both become `submitError` and call `onSubmitFailed`; an `Error` additionally rejects `form.submit()` (through a DOM submit this surfaces as an unhandled rejection). |
| 26 | `onSubmitFailed` timing | `submission` | frozen | Called after an internal 30ms `timeout()`, while `isSubmitting` is still `true`, and not awaited. |
| 27 | Submit error clearing | `submission`; existing `submit-error.test` | frozen | Cleared when the next submit starts and on a user change; a programmatic `setFieldValue` keeps it. |
| 28 | Direct writes and `forceReRender` | `change-and-callbacks` | frozen | `form.submitError = …` and `form.isSubmitting = …` are invisible until `forceReRender()`; `setSubmitting()` rerenders by itself. |
| 29 | Native `action`/`method` | `submission` | frozen | With `action`, no JS submit handler is attached: the event is not prevented and `onSubmit` never runs. Without it the event is prevented and routed through validation. A submitter without `type="submit"` is ignored. Hidden inputs reach `FormData` but never become fields. Only `action`, `autoComplete`, `encType`, `method`, `target` reach the DOM. |
| 30 | Refs | `instance-and-binding` | frozen, undefined | The Form ref receives the `<form>`. `form.ref` is copied from `ref.current` during the first render and is therefore `null` (undefined). |
| 31 | Ids | `instance-and-binding`, `render-baseline` | frozen, bug-eligible | Ids derive from the name, deduplicate (`name`, `name_1`), take the Form `name` as prefix, use an explicit `id` verbatim, and are released on unmount (Strict Mode included). **Two `TextInput`s sharing a base id both render `name_1`** and the first label points at `name` (bug-eligible; the module-global updater map in `utils/react/useId` is keyed by id string). |
| 32 | Helper components | `submission`, `change-and-callbacks`; existing `submit.test`, `submit-error.test` | frozen | `SubmitButton` disables on `isInvalid` and while submitting; `ResetButton` is disabled until touched and resets on the next tick; both accept an explicit `form` outside `<Form>`. `SubmitError` shows strings and elements and falls back to "Internal error". |
| 33 | Deprecated `Field` / `Form.Item` | `deprecated-and-custom`; existing `field.test`, `necessity-indicator.test` | frozen | Render-prop children receive the instance. `Form.Item` owns the registration and the id; the child's own `onChange` is **replaced**, not chained (a dev warning says so). Without a `name` it renders field chrome and registers nothing. |
| 34 | `DialogForm` | `deprecated-and-custom` | frozen | Creates a form when none is passed, installs `onSubmit`, and calls `resetFields()` 250ms after a successful submit or a cancel unless `preserve`. The timer is not tied to the mount, so a reopened dialog sharing the instance can be reset by the previous close (design hazard, plan §10). |
| 35 | Custom controls | `deprecated-and-custom`; existing `unbind-form-prop.test` | frozen | `useFieldProps` + `wrapWithField` registers, syncs both ways and renders label/errors; without a `name` the control stays standalone with a `useId` id. `useFormProps` exposes `{ form, submitError, labelPosition, idPrefix, requiredMark, … }`. `FieldWrapper` renders a supplied `Component`. Form-only props never reach the DOM. |

## Render baseline

Recorded by `render-baseline.test.tsx` with a fixture of an owner (`useForm()` + `<Form>`), two `TextInput`s and one Form-context consumer under `<Form>`. These are legacy **readings**, not budgets; the modern requirement for each row is in the plan, §11.

| Event | Owner | Context consumer | Field A | Field B |
| --- | --: | --: | --: | --: |
| Mount with two fields | 3 | 3 | 3 | 3 |
| One programmatic user-style change on A | 1 | 1 | 1 | 1 |
| One keystroke into A | 1 | 1 | 1 | 1 |
| One validation result published | 1 | 1 | 1 | 1 |
| `setSubmitting()` / `setFieldError()` (each) | 1 | 1 | 1 | 1 |
| Change with the instance created by a grandparent | 1 | — | — | — |

Why mount costs three renders: fields are created during render 1 after the `[field]` effect has already captured `undefined` as its dependency; render 2 comes from the mount effects calling `forceReRender()`; render 3 comes from that dependency flipping to the created field object.

Every mutation rerenders the whole owner subtree because the only publication mechanism is the creator's `forceReRender()`. This is the owner-wide behaviour Cloud's render-time getters depend on (plan §1), and the reason the modern backend gets a separate contract rather than a retrofit.

## Lifecycle

- Strict Mode mounting settles with one registration per field and no id leak.
- Unmounting the owner removes every registration.
- An instance reused by a new owner after its creator unmounted is no longer reactive (`[undefined]`).
- A delayed validation started before unmount still runs its validator afterwards: the timer belongs to the rule closure, not to the field (`[undefined]`).

## React Hooks / Compiler diagnostics (report-only)

`pnpm diagnostics:form` runs the official `eslint-plugin-react-hooks` 7.1.1 rules (the compiler-backed set: `rules-of-hooks`, `exhaustive-deps`, `refs`, `immutability`, `set-state-in-effect`, `preserve-manual-memoization`, `use-memo`, `incompatible-library`, …) over the Form surface and the input components through `eslint.hooks.config.mjs`. It is not part of `pnpm lint`; every rule is `warn`, and the committed [`diagnostics-baseline.json`](./diagnostics-baseline.json) is a ratchet:

- `pnpm diagnostics:form` prints the report and never fails.
- `pnpm diagnostics:form --check` fails if any file+rule count grew against the baseline.
- `pnpm diagnostics:form --update` rewrites the baseline after a reviewed change (a decrease should always be committed).
- `--verbose` lists every message; `--json` dumps the raw report.

Baseline on `b204a4d7`: 123 files linted, 114 diagnostics.

| Rule | Total | Legacy engine | Input components |
| --- | --: | --: | --: |
| `react-hooks/refs` | 50 | 13 | 37 |
| `react-hooks/exhaustive-deps` | 23 | 3 | 20 |
| `react-hooks/immutability` | 15 | 8 | 7 |
| `react-hooks/rules-of-hooks` | 14 | 5 | 9 |
| `react-hooks/preserve-manual-memoization` | 5 | 0 | 5 |
| `react-hooks/set-state-in-effect` | 5 | 1 | 4 |
| `react-hooks/incompatible-library` | 1 | 0 | 1 |
| `react-hooks/use-memo` | 1 | 0 | 1 |

The 30 legacy-engine findings are the ones the plan already names in §4.1: the five conditional hooks in `use-field-props.tsx` (`useId`, `useField`, `useChainedCallback`, `useEvent`, `useDebugValue`), render-phase ref reads and default/reset writes in `Form.tsx`, render-phase ref reads and callback writes in `useForm`, and the render-phase field mutation, the `[field]` effect reassigning a render variable, and the `setFieldId` cascade in `use-field.ts`. They are the compiler-containment list for the legacy modules (plan §8.1); zero is not required until a module is either made compiler-clean or given a reviewed opt-out.

The `refs` findings in the input components are dominated by `wrapWithField(component, domRef, props)` passing a ref during render, which the rule reads as a possible render-time ref access. That is a shared-surface question for the Phase 2 spike, not a legacy one.

## Not in this folder

- The Cloud AST-aware inventory (Phase 0, step 8) — a Cloud-repo artifact.
- CI enforcement of `--check` — the ratchet is available but not yet wired into `pull-request.yml`; enable it once the team agrees the baseline is the floor.
- Any fix. Every `[bug-eligible]` row needs its own compatibility review before the test flips.
