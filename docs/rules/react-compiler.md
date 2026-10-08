# React Compiler and callback rules

UI Kit requires React and React DOM 19.3 or newer. The release build runs React Compiler 1.0.0 with target `19` and imports the native `react/compiler-runtime`. Consumers receive compiled components without enabling Compiler in their applications. Compilation is incremental; known bailouts and legacy Form opt-outs remain explicit.

## Choose callbacks by their contract

| Work | Default | Contract |
| --- | --- | --- |
| Derived value or ordinary DOM/component handler | Plain expression or function | Correct in compiled and uncompiled execution |
| Notification from a local effect, observer, subscription or effect-created timer | Native `useEffectEvent` | Current committed data without reconnecting the resource |
| Previously retained callback must keep identity and invoke current committed captures | Internal `useEvent` | Demonstrated retention contract, reason and behavior coverage |
| Dependency-based identity controls wiring | Complete `useCallback`/`useMemo` only when simpler ownership does not fit | No stale captures or permanent lifetime assumptions |
| Per-mount instance or persistent value | State/ref ownership | External resources also get lifecycle setup/cleanup |

Write ordinary handlers as plain functions. Compiler can memoize eligible code; it does not guarantee one callable identity across changing captures. Passing a callback to a child or React Aria hook alone does not establish a retention requirement. Trace the caller before retaining `useEvent`; closing overlays replaying stored children are a verified exception (`useOverlayEscapeGuard`).

Declare Effect Events next to their owning effects. Import `useEffectEvent` directly from `react` without aliases, namespace access, local alias assignments or re-exports: the pinned official lint plugin relies on the canonical hook form. Invoke them only from local effects or callbacks set up by those effects. Do not invoke them in render or DOM handlers, return them, pass them to another component/hook, or include them in effect dependencies. Their identity changes between renders. [React's Effect Event contract](https://react.dev/reference/react/useEffectEvent)

Keep resource configuration reactive: connection identity, enablement, timing, loading and geometry dependencies still control setup and teardown. Effect Events read current notification data; they do not hide values that should repeat work. Replacing a callback should not recreate a subscription unless identity is explicitly part of that subscription's contract.

## Memoization and lifetime

Do not add performance-only `useMemo` or `useCallback` to eligible compiled code. Use plain expressions and named pure helpers. When identity controls wiring in uncompiled execution, include every captured dependency, including stable callbacks. Prefer effect-local construction for effect-owned values. Preserve existing memos in functions that still bail out until both compilation and behavior are verified.

A memo cache is not a permanent per-mount owner: React can discard it. Persistent instances belong in appropriate state/ref ownership; external setup and teardown belong in effects. Keep render pure and changing rendered data observable through props, state or subscriptions. Hidden mutable reads and discarded state counters do not make data Compiler-safe. Preserve the frozen legacy Form contract and its documented opt-outs; modern consumers subscribe with `Form.useValue`, selectors or `Form.Subscribe`. [Compiler guidance](https://react.dev/learn/react-compiler/introduction), [memo cache semantics](https://react.dev/reference/react/useMemo)

New components accept refs as props with the exact exposed DOM/imperative type. Existing `forwardRef` wrappers remain supported and migrate in focused batches that preserve generic inference, compound statics, merged refs and callback cleanup. Do not use a version branch or new compatibility wrapper.

## Enforce and verify

- `pnpm diagnostics:hooks --check` scans runtime source with official recommended Hooks rules and rejects growth in the canonical `scripts/hooks-baseline.json`. Tests, stories, fixtures and declarations are excluded. Every Effect Event adopter also passes strict `rules-of-hooks` and `exhaustive-deps` with inline configuration disabled; import policy rejects forms the plugin cannot track. Existing debt cannot conceal a new Effect Event violation.
- `pnpm diagnostics:compiler` rejects new diagnostics, lower compilation coverage and additional opt-outs. A justified `use no memo` needs a reviewed reason and behavior coverage. Never regenerate a baseline merely to make a failure pass. Ratchet actual reductions with the respective `--update` command and review the diff. Form diagnostics are a filtered view of the Hooks baseline.
- Verify touched behavior in source and release-compiled execution. Callback tests cover latest committed data, intentional dependencies, enable/disable transitions and cleanup; retained callbacks also cover old references and identity. Ref migrations cover targets filled during commit and replacement refs that are both empty during render. Public API/type changes pass built-consumer fixtures, and compiled consumers must actually compile.
- Validate build/packed artifacts through `pnpm check:react-package` and package tests. The intentionally uncompiled build must remain correct and contain no compiler runtime imports.
- Report compilation coverage, fewer synchronization effects, subscription changes, bundle bytes and measured performance separately. Compilation success alone does not prove a speedup.
