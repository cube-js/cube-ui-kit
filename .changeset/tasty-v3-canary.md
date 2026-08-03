---
'@cube-dev/ui-kit': patch
---

Test against the Tasty v3 canary and apply the required migration. Not for release — the `@tenphi/tasty` dependency points at a snapshot build.

- `getCssTextForNode` -> `getCSSTextForNode` (test helpers and the ESLint-plugin probe).
- `Props` is no longer exported by Tasty — it was never a Tasty concept, just `Record<string, any>`. Declared locally in `src/props.ts` and still re-exported from the package root, so the UI Kit's own public API is unchanged.
- `Text` now declares its own `block` prop. It was inherited from Tasty's `BaseProps`, which v3 dropped as unconsumed — but the UI Kit does consume it, as a mod and in the `'ellipsis | block'` style branch.
- `Title` now declares its own `inline` prop, marked deprecated. It was inherited from the same place and genuinely did nothing: `TitleElement` has no `inline` mod and hardcodes `display: 'block'`, so forwarding it only risked an invalid DOM attribute. Kept on the type so the public prop surface is unchanged; no longer forwarded.

No style values needed changing: v3's stricter directional syntax (one value per group that names directions) is not violated anywhere in the codebase.

The tree-shaking size budget is raised from 118 kB to 123 kB. Tasty v3 costs +3.77 kB on that entry — its new dev diagnostics ship in every bundle, since `isDevEnv()` is evaluated at runtime so one build serves both modes — and the entry only had ~370 B of headroom.
