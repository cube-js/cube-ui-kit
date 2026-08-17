---
'@cube-dev/ui-kit': minor
---

Lint ui-kit's own source with the `no-redundant-default-prop` rule it ships, and fix four registry entries that autofixing would have broken.

The plugin was never applied to this repo. Two things prevented it, and the second was silent: nothing loaded the plugin, and provenance is gated on the import specifier literally matching `@cube-dev/ui-kit`, which no file in `src/` uses — every component import here is relative, across 210 distinct specifiers that share no usable prefix. So even once loaded, the rule reported nothing.

- New `relativeImports` rule option, which also accepts relative specifiers as ui-kit provenance. It exists for linting this repository and must not be enabled in a consumer project, where a relative import is the consumer's own component. Shadowing still bails either way — resolution requires an `ImportBinding`, so a local `const Badge = tasty({})` is never matched.
- `configs.recommended` now sets stories and `.docs.mdx` to `warn` instead of `off`. Stories are the code people copy, so redundant props there travel outward and are worth surfacing; a deliberate side-by-side contrast still has a real reason to name a default, so it warns rather than failing a build.

Four props were classified as plain defaults when they are actually inherited overrides, so the rule would have offered — and `--fix` would have taken — an autofix that changed behaviour. Each is now `skip: 'context'`:

- `ItemAction` `isDisabled` and `type`. `<Item isDisabled>` renders its `actions` inside `ItemActionProvider`, and `isDisabled = isDisabledProp ?? contextIsDisabled`, so `<ItemAction isDisabled={false}>` is the documented way to keep one action live inside a disabled item. Stripping it silently disabled that action.
- `ItemBadge` `type` and `theme`, which read the same context and had no conditions on their fixture at all.
- `Dialog` `isDismissable`, resolved as `contextProps.isDismissable` with no literal fallback while `DialogContainer` and `DialogTrigger` default that context value to `true`, so a nested `<Dialog isDismissable={false}>` is an override. Three call sites in shipped source relied on it.

The cause is general: a prop resolved as `prop ?? context ?? literal` probes as a plain default in a bare tree, because the literal wins when nothing supplies the context. Only `ItemAction`'s `theme` was classified correctly, and only because it happened to be the one prop with a matching condition. The fixtures now supply a differing value for each such prop, so the prover derives these skips itself and the sync guard re-proves them on every test run rather than trusting a hand-written note. A repo-wide audit for the pattern found no other affected component.
