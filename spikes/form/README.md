# Form modernization — Phase 2 architecture spike

**Disposable.** Nothing in `spikes/` ships or is imported by `src/`. The code exists to produce the evidence behind `FORM_MODERN_ARCHITECTURE_ADR.md` (stand root, next to the plan). Delete the folder once the architecture gate closes; Phase 3 reimplements the approved design inside `src/` under the normal rules.

Plan reference: `FORM_REACT_COMPILER_MODERNIZATION_PLAN.md` §9 Phase 2.

## What is here

| Path | Purpose |
| --- | --- |
| `internal/store.ts` | Framework-neutral modern store: immutable structurally shared snapshot, registration tokens, store-owned validation timers/abort, callbacks, submission. Draft names from plan §6. |
| `internal/react.tsx` | React adapter: `useFormController`, `useFormSelector` (official `use-sync-external-store` with-selector shim), `ModernForm` root, `FormSubscribe`, `useFormField`. |
| `internal/binding.tsx` | The shared field-binding boundary: `useBoundField`, one unconditional hook over a uniform backend adapter (modern / legacy / none). |
| `internal/bound-inputs.tsx` | Real, untouched UI Kit inputs (TextInput, Select, Checkbox, RadioGroup) and a custom control behind the boundary. |
| `shared/conformance.ts` | The plan's exercise list as one store-level suite, parameterised by engine and by declared capabilities (`it.fails` for declared gaps). |
| `tanstack/adapter.ts` | Compatibility layer implementing the same draft interface over TanStack Form (`@tanstack/form-core` 1.33.5). |
| `tanstack/tanstack-react.test.tsx` | TanStack's own React layer measured with the same render counters. |
| `typecheck/` | Cloud-shaped 40-field values type plus one fixture per engine for `tsc --extendedDiagnostics`. |
| `eslint.hooks.config.mjs` | The repo's report-only React Hooks / Compiler rules pointed at the spike sources. |

## How to run

```bash
pnpm exec vitest run spikes
pnpm exec tsc -p spikes/tsconfig.json
pnpm exec eslint -c spikes/eslint.hooks.config.mjs 'spikes/form/internal/*.tsx' spikes/form/internal/store.ts spikes/form/tanstack/adapter.ts
pnpm exec tsc -p spikes/form/typecheck/tsconfig.tanstack.json --extendedDiagnostics
pnpm exec tsc -p spikes/form/typecheck/tsconfig.internal.json --extendedDiagnostics
```

## Results

Measured 2026-09-02 on ui-kit `main` at `179e7ee9` (after the two legacy fixes, before the pending release), React 19.1.1, Node 24.

### Conformance (store level, identical assertions for both engines)

| Engine                       | Passed | Declared gaps (`it.fails`) | Tests |
| ---------------------------- | -----: | -------------------------: | ----: |
| Internal store               |     45 |                          0 |    45 |
| TanStack compatibility layer |     38 |                          7 |    45 |

TanStack gaps, each verified by a probe against `form-core` directly:

1. **No tri-state status.** `isValidating` is never true synchronously and nothing distinguishes _unvalidated_ from _valid_; the layer emulates it by watching `isValidating` edges per field.
2. **Debounce timers are internal.** Not observable, not cancellable on unregister; `pendingTimerCount` cannot be implemented.
3. **Pending validation promises never settle** when the field resets or unmounts while a validator is still running (test hits the 5 s timeout).
4. **Abort is per validation cause.** A value change aborts a pending `change` run but not a pending `submit`/`blur` run, and a rule change aborts nothing. The stale _value_ result is still dropped, but validators run to completion.
5. **Errors flicker on revalidation.** Starting a run clears the error map synchronously; the error disappears until the async result arrives.

Things the layer had to re-implement or bypass to reach 38/45: active/retained values, registration tokens, dirty-by-baseline (TanStack's `isDirty` means "ever changed"; `isDefaultValue` is the usable one), notify opt-out, atomic multi-field commands (`form.baseStore.setState` — `FormApi` has no batch command and the `batch` helper is not re-exported), baseline-only replacement (`form.options` mutation plus a forced state write so derived meta recomputes), root callback tokens, tri-state status, error-map flattening (per-cause error maps produce duplicates when one runner is registered under two causes). `form.update({ defaultValues })` silently resets every untouched value, so field-level defaults had to be seeded by hand.

### Render counts (plan §11 rows)

Same fixture for both React layers: owner creates the form, a shell component, fields `a` and `b`, a status subscriber selecting `isDirty`.

| Event | Internal adapter | TanStack React layer | Modern requirement |
| --- | --- | --- | --- |
| Mount | owner 1, shell 1, a 1, b 1, status 1 | owner 1, a 1, b 1, status 1 | — |
| First keystroke in `a` (dirty flips) | a 1, status 1, owner 0, shell 0, b 0 | a 1, status 1, owner 0, b 0 | owner 0, shell 0 |
| Next keystroke in `a` | a 1, everything else 0 | a 1, everything else 0 | changed field ≤ 1 |
| Store publishes per keystroke | 1 | 1 (`store` notification) | 1 coherent cycle |
| `Form.Subscribe` on `values.amount` | subtree only | not measured | subtree only |
| Allocating selector with `isEqual` | 0 rerenders on equal result | (TanStack `useStore` is shallow) | 0 |
| Allocating selector without `isEqual` | rerenders every publish | — | documented |
| Strict Mode registrations per field | 1 (token-based) | — | 1 |
| Timers/listeners/registrations after owner unmount | 0 | timers not observable | 0 |

Blur is a legitimate rerender: with the default `onBlur` trigger, leaving a field validates it (status `unvalidated → valid`), and that field renders once.

### Bundle (esbuild, minified ESM, `react`/`react-dom` external)

| Artifact | Raw | gzip | brotli |
| --- | --: | --: | --: |
| `@tanstack/react-form` (everything) | 73.6 kB | 19.5 kB | 17.4 kB |
| `@tanstack/react-form` (`useForm` + `useStore` only) | 66.8 kB | 17.6 kB | 15.7 kB |
| Spike internal store + React adapter + selector shim | 17.1 kB | 6.4 kB | 5.8 kB |
| Spike internal store alone | 11.1 kB | 4.2 kB | 3.8 kB |
| `use-sync-external-store/shim/with-selector` | 3.2 kB | 1.4 kB | 1.2 kB |

UI Kit's `All` size-limit entry is 517 kB with roughly 1.5 kB of headroom, so TanStack alone would need a ~20 kB budget change before its compatibility layer is counted. The internal spike is un-optimised and un-tree-shaken.

### Type-check (4 fields on a 40-field Cloud-shaped interface)

| Engine   | Types | Instantiations | Check time |
| -------- | ----: | -------------: | ---------: |
| TanStack | 1,407 |          7,582 |     0.06 s |
| Internal | 2,170 |          2,321 |     0.10 s |

Times are noise at this size; instantiations scale with fields. TanStack's `FormApi` requires 12 type arguments to name (`FormApi<any × 12>`), and its `DeepKeys` path typing works for `'tags.env'` and `'alertThresholds[0].email'` but needs a cast for dynamic environment-variable names.

### React Hooks / Compiler diagnostics (report-only rules)

| Files | Findings |
| --- | --: |
| Spike modern sources (`react.tsx`, `binding.tsx`, `bound-inputs.tsx`, `store.ts`, `tanstack/adapter.ts`) | 0 |
| Legacy binding (`use-field-props.tsx` + `use-field.ts`) for comparison | 15 |

No ref is written during render anywhere in the spike; registration and callback binding live in layout effects, the with-selector shim owns the selector memo.

### Field-binding boundary

`useBoundField` calls the same hooks in the same order for every backend. Proven in `internal/binding.test.tsx`:

- Legacy `<Form>`: TextInput, Checkbox and a custom switch bind through the shared hook; blur validation and `#name` ids work; the deprecated `<Field>` keeps driving its child while the hook stays inert; an explicit `form` prop binds outside a legacy Form.
- Modern root: TextInput, Select, Checkbox and the custom control bind to the controller; ReactNode errors render; no Form-only prop reaches the DOM; an explicit `controller` prop binds outside the root.
- RadioGroup registers one field; its Radio options do not become fields.
- The same mounted input moves between none → modern → legacy → none without a hook-order error, retaining its modern value while it is on the legacy side.

The legacy render-phase field creation now lives inside the legacy adapter (`createLegacyBackend`), not in the shared hook: that is the compiler containment boundary for Phase 3.

## Known simplifications of the spike

- Flat value map keyed by field name; dotted names are plain keys (nesting for submission is a Phase 7 concern).
- Rules: `required`, `min`, `max`, `pattern`, `validator`; the legacy type checkers (`email`, `url`, …) were not ported.
- `ModernForm` provides no presentation context (label position, sizes); the facade split of §5.4 is unchanged by the spike.
- `useFormController` disposes the store when its owner unmounts; sharing a controller with a sibling that outlives the owner needs a decision.
- The TanStack layer was written to pass the suite, not to be idiomatic; it shows the _amount_ of bookkeeping, not the best possible layer.
