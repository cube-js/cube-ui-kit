---
'@cube-dev/ui-kit': patch
---

Update Tasty to 3.2.0. The release adds opt-in batched style injection: `configure({ batchInjection: true })` plus a `<TastyBatchProvider>` queue every stylesheet write of a commit into one FIFO and apply them together, so the document is style-invalidated once per flush instead of once per component — which matters in a tree that measures layout during render (popovers, autosizing inputs, virtualized lists). The provider flushes in `useInsertionEffect`, before any layout effect, so a queued write can never be observed by a measurement. `flushStyles()`, `hasPendingStyleWrites()` and `resetStyleBatch()` come with it, and all of it is re-exported from `@cube-dev/ui-kit`. Nothing changes for the UI Kit by default — batching stays off unless an app turns it on, though the queue itself lives in Tasty's always-included core, so a bundle grows by ~0.7 kB gzipped either way.
