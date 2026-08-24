---
'@cube-dev/ui-kit': minor
---

Update Tasty to 3.3.0 (from 3.1.0). Three things come with it.

**Color tokens no longer emit companion channel variables, and `colorSpace` is deprecated.** A `#name` token used to declare `--name-color` plus a decomposed companion — `--name-color-rgb` here, since the kit configured `colorSpace: 'rgb'` — and only the companion is gone: `--name-color` is emitted exactly as authored. Opacity has used CSS relative color syntax since 3.1.0, so nothing inside Tasty needed the channels any more. **If your own CSS reads a companion — `rgb(var(--primary-color-rgb) / .2)` and the like — it silently stops resolving.** Rewrite it against the token itself: `oklch(from var(--primary-color) l c h / .2)`, which works on any color, including the ones no build-time conversion could evaluate. `configure({ colorSpace })` now warns in development and does nothing; the kit no longer sets it.

**`#current` resolves through `var(--current-color)` instead of the `currentcolor` keyword.** Every `color` style publishes `--current-color` alongside itself, and the property is registered with `initial-value: currentcolor`, so where nothing published it the variable is indistinguishable from the keyword. The difference is that a token defined as `#current` can now be faded — `{ '#ink': '#current', fill: '#ink.5' }` — from Safari 16.4 rather than Safari 18, because relative color syntax accepts a concrete origin much earlier than it accepts `currentcolor` as one.

**Opt-in batched style injection** (from 3.2.0): `configure({ batchInjection: true })` plus a `<TastyBatchProvider>` queue a commit's stylesheet writes into one FIFO and apply them together, so the document is style-invalidated once per flush instead of once per component — which matters in a tree that measures layout during render (popovers, autosizing inputs, virtualized lists). The provider flushes in `useInsertionEffect`, before any layout effect, so a queued write can never be observed by a measurement. `flushStyles()`, `hasPendingStyleWrites()` and `resetStyleBatch()` come with it, and all of it is re-exported from `@cube-dev/ui-kit`. Batching stays off unless an app turns it on.
