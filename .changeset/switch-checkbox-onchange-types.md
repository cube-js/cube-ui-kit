---
'@cube-dev/ui-kit': patch
---

Fix `onChange` on `Switch` and `Checkbox` not typechecking in controlled mode.

`CubeSwitchProps` / `CubeCheckboxProps` were missing `onChange`, `isSelected` and `defaultSelected` entirely, so every controlled call site needed a `@ts-expect-error`. Root cause: `tsconfig.json` sets `preserveSymlinks: true`, so TypeScript resolves `react-aria`'s type re-exports from the symlink path and never finds the `@react-aria/*` subpackages (they are not direct dependencies); `skipLibCheck` then hides the failure and every `Aria*Props` silently becomes `any`. Extending an `any` base contributes no members, which is why exactly these props vanished.

The selection contract is now declared explicitly as `ToggleSelectionProps` (`src/shared/form.ts`) and mixed into both components, restoring real type checking — a wrong handler signature now fails again. Four `@ts-expect-error` suppressions were removed (`Disclosure` and `Tree` internals plus the theming stories), and `Checkbox` no longer types its non-DOM `onChange` onto the `<label>` element it spreads props onto.

`Radio` deliberately keeps no `onChange`: in React Aria a single radio has none — selection is owned by `Radio.Group`.

Removing `preserveSymlinks` is the real fix, but it surfaces ~320 previously-hidden type errors across ~60 files, so it needs its own migration. The cause is documented in `AGENTS.md` and `tsconfig.json` so the next person does not re-diagnose it.
