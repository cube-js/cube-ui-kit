---
'@cube-dev/ui-kit': minor
---

Add `@cube-dev/ui-kit/probe` — DOM-pure helpers for tooling that inspects what a render produced.

Answering "what HTML and CSS did this component tree actually generate?" is a recurring need for agents and dev tooling, and the pieces to do it correctly were either unreachable or easy to get subtly wrong.

- `canonicalizeIds` / `canonicalizeClassNames` / `canonicalize` — normalise React and react-aria element IDs and tasty class-name hashes so two renders can be compared byte-for-byte. These already existed in `src/eslint-plugin/probe.tsx`, which is not part of the `./eslint-plugin` entry, so nothing outside this repo could import them. They now live in `src/probe/` and are re-exported from their old home.
- `captureCss` / `splitRules` / `diffRules` — read the CSS a subtree caused, by capturing the empty harness, mounting, capturing again and subtracting. Scoping `getCSSTextForNode` to an inner wrapper is the obvious approach and is wrong: `<Root>` is the `PortalProvider` target, so Dialog / Menu / Tooltip / Select popups mount as its *siblings* and drop out of the result entirely.
- `captureCss` also collects the rules the CSS engine refused instead of suppressing them. jsdom *discards* `@container style()` and `@property` rules rather than degrading them, so a jsdom-derived dump is incomplete — not merely unresolved — for components that use them, and a caller needs to be told.

The entry is deliberately DOM-pure: it operates on an already-rendered node, so it adds no test-renderer dependency and carries no opinion about the provider stack, which is the part that genuinely differs per consumer.

Also fixes the jsdom test setup's tasty warning filter, which matched `[tasty]` against tasty's `[Tasty]` and so had never suppressed anything.
