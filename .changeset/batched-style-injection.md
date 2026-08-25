---
'@cube-dev/ui-kit': minor
---

Collapse the kit's stylesheet writes into one style invalidation per commit.

Every `insertRule()` on a live stylesheet invalidates style for that sheet's scope. Kit components inject during React's render phase, so when anything else reads layout in the same pass — a tooltip positioning itself, `TextArea` autosizing, a virtualized table measuring rows — the two interleave and the browser is forced to recalculate style between every injection.

`<Root>` now enables tasty's `batchInjection` and opens a batch window for its own commits. A commit that mounts a portal does not re-render `<Root>`, so windows are opened per portal boundary too: `<Portal>` (tooltips) and `<Overlay>` (popovers, modals and trays — the `Dialog` and `Menu` surfaces). Those are the commits where injection and measurement interleave worst, because react-aria positions the overlay from a layout effect in the same commit that mounts it.

Writes are queued and applied together, and the flush happens in `useInsertionEffect` — before any `useLayoutEffect` — so nothing can measure an element whose rules have not landed yet. Any commit without a window in it writes straight through exactly as before.

No API change: no new props, no new setup. SSR is unaffected — styles are collected as text there and the provider is inert without a `document`.
