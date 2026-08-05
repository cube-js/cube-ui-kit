---
'@cube-dev/ui-kit': patch
---

Update `@tenphi/tasty` 2.11.0 → 2.11.2, which fixes global-style hook behavior. `useGlobalStyles` now keys its injection slots per root instead of in one module-level map, and the SSR / RSC collectors treat an `id`-keyed entry as replaceable rather than deduplicating it by content.

That matters for the runtime-tunable palette: `<Root>` injects the token block as `useGlobalStyles('body', …, { id: 'cube-ui-kit-tokens' })`, so re-seeding the palette now replaces the previous block correctly on the server and in shadow roots, not just on the client.

The bump adds ~400 B to the tree-shaken `Button` entry, so its `size-limit` budget moved 118 kB → 119 kB.
