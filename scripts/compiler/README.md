# React Compiler build

`pnpm build` compiles UI Kit's own runtime source with React Compiler 1.0.0 before tsdown lowers TypeScript and JSX. The target is React 19; output imports the native `react/compiler-runtime`, and consumers require React and React DOM 19.3 or newer. Consumers do not need to enable Compiler. Dependencies, stories, tests, fixtures, and declarations are not transformed by the release plugin.

This is incremental adoption. Compiler's known diagnostics leave the affected functions unoptimized; they do not establish compatibility for every function in the library. Legacy form roots, field adapters, and action components explicitly use `"use no memo"` because their render contract reads mutable state. Applications that compile their own legacy form consumers still need to exclude those consumers or migrate their render reads to modern subscriptions. Forms without an explicit controller retain the legacy backend.

## Coverage

The release transform and compiled source tests share `transform.mjs`. `baseline.json` records the minimum compiled function count, maximum diagnostics by category, and maximum explicit opt-outs per source file. New diagnostics or reduced coverage fail the build. Existing diagnostics include ref reads, manual memoization that Compiler cannot preserve, unsupported syntax, and incompatible library APIs; these are documented bailouts, not compiler errors hidden by a successful build.

`pnpm diagnostics:compiler` checks all runtime source, including modules not currently reachable from the package entry points. `pnpm diagnostics:compiler --update` intentionally regenerates the baseline after reviewing a change; do not use it simply to make a failing build pass. Removing a diagnostic should reduce its allowance in the baseline. Build output includes `dist/react-compiler-report.json` with function names and actual diagnostics for modules reached by that build; CI uploads it, and it is not included in the npm package.

## Verification

- `pnpm test`: uncompiled source behavior.
- `pnpm test:compiled`: the full component suite through the release transform.
- `pnpm test:form-compiled`: modern form consumers and adapters compiled together, including hydration and lifecycle contracts.
- `pnpm build && pnpm pack:test && pnpm test:package`: consumers importing the extracted npm tarball, with and without compilation. CI runs React 19.3. The fixtures are also typechecked against the emitted declarations.
- `pnpm build:uncompiled && UIKIT_TEST_UNCOMPILED=1 pnpm test:package`: the same consumer behavior against a separate uncompiled build in `dist-uncompiled`, leaving the release `dist` intact.
- `UIKIT_REACT_COMPILER=on pnpm test:browser`: real browser interactions, layout, and observers using the release transform. Storybook uses this transform too; story functions stay uncompiled.

When fixing a failure, first reproduce it with compilation enabled and compare uncompiled behavior. A discarded state counter that forces a rerender is insufficient if rendered children depend on hidden mutable state or the current time: pass the changing value through state/props so memoization can observe it. The notification timestamp regression is covered by the existing behavioral test in both modes.

## Callback rules and Hooks enforcement

Follow the canonical [React Compiler and callback rules](../../docs/rules/react-compiler.md) for plain handlers, local Effect Events, retained callbacks, manual dependencies and lifetime ownership. `pnpm diagnostics:hooks --check` runs official recommended Hooks rules across runtime source against `scripts/hooks-baseline.json`. Existing debt is recorded per file/rule; new findings fail. Effect Event adopters additionally pass strict `rules-of-hooks` and `exhaustive-deps` with inline directives disabled. Use the direct, unaliased named React import, which the pinned plugin can track. `pnpm diagnostics:form --check` is a Form/input view of that same baseline; update only via `diagnostics:hooks --update`, after reviewing actual improvements.

`pnpm check:react-package` validates peer metadata, optimized native imports, absence of the compatibility runtime, internal source imports, and React-free tooling entry points. Canary and release publishing run it after build; packed/uncompiled consumer tests reuse these assertions. The required `Tests & lint` CI aggregate depends on source, Form/package, full compiled and browser checks. Browser compiler off/on coverage remains; there is one supported React runtime.
