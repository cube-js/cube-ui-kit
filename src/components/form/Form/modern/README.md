# Standalone modern Form store — Phase 4

This directory implements the standalone store from the accepted Form modernization ADR (architecture spike: PR #1389, shell: PR #1404). It has no React imports, new dependencies, package exports, or connections to the legacy engine. There is no changeset because no consumer behavior or public API changes in this phase. The existing modern root deliberately still throws. The modern creator/hooks, field binding, and validation/submission orchestration belong to phases 5–7.

## Files and checks

- `store.ts`: branded store, immutable snapshots, subscriptions, transactions, registration ownership, values/defaults, and validation/submission state transitions.
- `values.ts`: immutable path operations, the ADR's shallow comparator, owned plain-data snapshots, and immutable membership sets.
- `types.ts`: internal contracts, including an arbitrary error value type (a React adapter can supply `ReactNode` without bringing React into the store).
- `store.test.ts`: the phase 2 store conformance cases that apply to phase 4. `lifecycle.test.ts`, `values.test.ts`, and `transactions.test.ts` cover cancellation, ownership, paths, and rejected-input regressions; `sequences.test.ts` compares mixed command workloads across transaction boundaries. The spike's rule/timer, root-callback, and submit-pipeline cases remain phase 7 work.
- `store.test-d.tsx`: branded/readonly/type-inference checks, included in `pnpm test:types`.

`pnpm test:form-store` runs in Node with zero setup files: no React, DOM, i18n, or UI test helpers. It is also a CI step. `pnpm test` runs the store tests alongside the legacy suite, and `pnpm test:types` checks all modern store sources and tests. `pnpm diagnostics:form --check` covers the modern sources through its existing form glob.

## Snapshots and ownership

The store and command identities are stable. `getSnapshot()` returns one cached, frozen snapshot until observable state changes. Unchanged fields, value branches, metadata maps, and dirty/touched sets retain their identities. A metadata-only update preserves value identities; an inactive value update preserves `activeValues`. The readonly sets have no writable backing collection exposed (`Object.freeze(new Set())` alone would not be sufficient).

The store copies and freezes plain objects/arrays at ingress, including their enumerable symbol properties, so it neither freezes caller-owned data nor lets later caller mutations corrupt earlier snapshots. Copies enter the ownership cache only after the whole graph succeeds; a throwing getter cannot poison subsequent retries with a partial copy. Input references denote immutable values: reuse of the same input object reuses its first snapshot; use a new object for a new value. Non-plain objects, including dates and files, are opaque references and must be treated as immutable. Error payloads are also opaque; the error array is copied/frozen, and each error object retains its identity.

Dirty comparison follows the ADR: `Object.is`, then one level of array/plain-object entries. It deliberately does not deep-compare dates, maps, or nested object graphs and never uses `JSON.stringify`. The most recently registered/updated field registration may override the comparator. Dirty/touched membership includes retained fields; validity/validation aggregates consider active fields only. Zero active fields means `isValid: false`.

## Names and nested paths

Strings remain literal names, including dynamic names containing dots, spaces, or numeric strings, as in the phase 2 conformance suite. Tuple paths explicitly select nested objects/arrays: `setValue(['users', 0, 'email'], value)`. This avoids changing the meaning of an existing dynamic string field name. Numeric array segments and their string equivalents identify the same path. Arrays retain indices when deleting a value; no splice shifts another field's identity.

`getFieldSnapshot(path)` accepts either shape. `fields`, membership sets, and change metadata use `getFieldKey(path)`: path segments joined by dots with literal dots/backslashes escaped. Thus `'user.name'` and `['user', 'name']` remain distinct. Unsafe prototype-chain segments and empty tuple paths are rejected. `setValues()` assigns top-level literal keys atomically; combine tuple `setValue()` calls in `batch()` for nested multi-field writes.

`values` contains retained data. `activeValues` contains only paths with live registrations. An active parent field submits its complete object; register leaves instead when only selected children should be active. Both views preserve nested shape and can be inspected before fields mount. Top-level defaults/setters create field metadata immediately; nested paths receive their own metadata when addressed or registered.

## Commands and transactions

Commands publish synchronously. `batch(fn)` is a synchronous notification transaction: nested batches publish once, imperative getters see in-progress values, and subscribers/`getSnapshot()` see only the last complete snapshot until the outer batch exits. Input snapshotting and path writes are preflighted before command mutations, so rejected input cannot leave a partial multi-field write, an unreachable registration, or a consumed completion token. An explicit batch is not a rollback transaction: earlier successful commands commit even if a later command throws, and the exception propagates. Do not pass an async function.

Reentrant commands queue another notification cycle after every listener has observed the original snapshot. Unsubscribing during delivery is supported; listeners added during delivery begin with the next publication. Registering the same callback twice creates independent subscriptions. Throwing listeners/selectors do not stop other listeners, and callback rejections go to `onListenerError`.

`subscribeSelector(selector, listener, isEqual = Object.is)` tracks the selected result and skips unchanged selections. Supply equality for allocating selectors. The selector and equality function must be pure. This is an internal subscription primitive; the later React selector hook owns render-safe selector/controller replacement.

User sets touch and invoke `onValuesChange` by default. Programmatic sets do neither unless requested. Actual value changes are required for a set notification. Reset, adoption, and replacing current values with defaults notify with their respective `kind`; baseline-only updates do not. A transaction invokes the callback once with the coherent retained values, the union of changed names, user source if any notified command came from a user, and the last notified command's kind. Reentrant writes cannot change the payload of an earlier event. Root callback ownership/precedence is deferred to phase 7.

## Registration and defaults

Each registration owns a token; duplicate names share state and remain active until the last token releases. Released tokens cannot update/release later registrations. The most recently registered/updated live token owns field options; releasing it restores the latest remaining token. Equivalent option updates neither take ownership nor publish, so duplicate inputs can resend options without causing each other to rerender or revalidate. Final release retains values by default; `preserve: false` removes that path's retained value without removing its baseline. Reset can restore that baseline. Registration cleanup is idempotent.

Controller-provided values/defaults win, including explicit `undefined` and `null`. A field-level default is considered once per registration, when first supplied (including through `token.update()`), and seeds only when neither value nor baseline exists. Later prop changes never overwrite values/baselines or undo a reset that deliberately removed them. Conflicting duplicate field defaults report a development error once when first supplied and retain the first. Controller defaults taking precedence are not a conflict.

Defaults commands replace the baseline object, including removal of omitted keys. `setDefaultValues(next)` preserves current values and recalculates dirtiness. `{ currentValues: 'replace' }` also replaces current values and clears field touched/errors/status. `adoptDefaultValues(next, { when: 'untouched' | 'clean' | 'always', preserveDirty })` updates the baseline and adopts values except at guarded paths; a guarded nested leaf survives adoption of its parent object. The default guard is `untouched`. `reset()` restores the baseline, while `reset({ values })` replaces baseline and values together. Both clear touched/errors/status/submitError and drop unseeded retained data. These operations are atomic.

## Validation and submission state

Phase 4 supplies transitions, not rule execution. `startValidation(path)` requires an active field and returns a completion token plus an abort signal. Status changes synchronously; existing errors stay visible while validating. Value changes (including field-default seeding), ownership changes, reset, final release, or disposal invalidate pending tokens. Parent/child path changes invalidate related validations, and array truncation also invalidates removed elements. Superseded completions cannot publish. Abort events are delivered after the complete snapshot publishes, before the outer command/transaction returns, so an abort handler may start fresh work without the cancelling command overwriting it. Manual errors support arbitrary payloads; clearing errors marks the field valid. A value edit clears errors and returns to unvalidated; the future pipeline can start validation inside the same batch. Rule-signature handling, delays, and execution are phase 7 work.

`startSubmission()` owns the submitting flag and clears submitError; a concurrent start returns `undefined`. Its completion token can finish successfully or set an arbitrary error. Reset/disposal abort it and prevent stale completion from ending a newer submission. Ordinary field edits preserve submitError. The future submission pipeline owns validation, callbacks, failure policy, and native browser submission.

`dispose()` releases listeners/registrations and aborts pending state tokens. Cleanup handles remain safe and idempotent; subsequent commands/subscriptions throw. Final snapshots remain readable. `debug.listenerCount()` and `debug.registrationCount()` make lifecycle leak assertions explicit.
