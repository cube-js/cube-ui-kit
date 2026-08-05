---
'@cube-dev/ui-kit': minor
---

Upgrade to Tasty v3 (`@tenphi/tasty` `^3.0.0`) and `@tenphi/eslint-plugin-tasty` `^1.0.0`, applying the required migration.

- `getCssTextForNode` -> `getCSSTextForNode` (test helpers and the ESLint-plugin probe).
- `Props` is no longer exported by Tasty — it was never a Tasty concept, just `Record<string, any>`. Declared locally in `src/props.ts` and still re-exported from the package root, so the UI Kit's own public API is unchanged.
- `Text` now declares its own `block` prop. It was inherited from Tasty's `BaseProps`, which v3 dropped as unconsumed — but the UI Kit does consume it, as a mod and in the `'ellipsis | block'` style branch.
- `Title` now declares its own `inline` prop, marked deprecated. It was inherited from the same place and genuinely did nothing: `TitleElement` has no `inline` mod and hardcodes `display: 'block'`, so forwarding it only risked an invalid DOM attribute. Kept on the type so the public prop surface is unchanged; no longer forwarded.

One style value needed changing: `Styles.stories.tsx` had `inset: '2x bottom 4x left'`, the positional form v3 removed, now `inset: '2x bottom, 4x left'`. Verified against the v3 runtime that the comma form reproduces what v2 rendered (`auto auto 16px 32px`) — the old form now drops the `4x` and renders `auto auto 16px 16px`.

Also adds 12 color tokens to `tasty.config.ts` that were declared in `src/tasty-augment.d.ts` but missing from the config the ESLint plugin reads, so they were reported as unknown.

The ESLint plugin's v1 lints Storybook `args.styles` and `styles={{…}}` JSX props for the first time. That is how the `inset` violation above was found — story files had been silently unchecked.

Both size budgets are raised: `All` from 460 kB to 462 kB (it went over by 161 B) and tree-shaking from 118 kB to 123 kB. Tasty v3 costs +3.77 kB on that entry — its new dev diagnostics ship in every bundle, since `isDevEnv()` is evaluated at runtime so one build serves both modes — and the entry only had ~370 B of headroom.
