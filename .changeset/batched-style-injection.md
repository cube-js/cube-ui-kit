---
'@cube-dev/ui-kit': minor
---

Collapse the kit's stylesheet writes into one style invalidation per commit.

Every `insertRule()` on a live stylesheet invalidates style for that sheet's
scope. Kit components inject during React's render phase, so when anything else
reads layout in the same pass — a tooltip positioning itself, `TextArea`
autosizing, a virtualized table measuring rows — the two interleave and the
browser is forced to recalculate style between every injection.

`<Root>` now enables tasty's `batchInjection` and opens a batch window for its
own commits, and `<Portal>` opens one for every overlay that mounts, which is
where injection and measurement interleave worst. Writes are queued and applied
together, and the flush happens in `useInsertionEffect` — before any
`useLayoutEffect` — so nothing can measure an element whose rules have not landed
yet. Any commit without a window in it writes straight through exactly as before.

No API change: no new props, no new setup. SSR is unaffected — styles are
collected as text there and the provider is inert without a `document`.
