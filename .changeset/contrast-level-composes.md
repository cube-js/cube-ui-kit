---
'@cube-dev/ui-kit': patch
---

A manual `contrastLevel` no longer suppresses the high-contrast tier (via `@tenphi/glaze` 1.5.0).

The level now does one thing: it positions the **normal** colors on the 0–100 slider. The high-contrast tier stays the true high-contrast resolution — identical to what `contrastLevel: 'auto'` emits — at every level, so the two **compose** rather than replace each other: a product's own contrast slider raises the baseline while `<html data-contrast="high">` / `prefers-contrast: more` still escalates on top of it.

Two consequences for anyone who had set a level:

- `contrastLevel: 0` now reproduces `'auto'` output exactly, high-contrast tier included. Shipping the slider and defaulting it off therefore costs nothing — previously it silently dropped the tier, so `data-contrast="high"` stopped working the moment a level was set.
- At `contrastLevel: 100` the normal colors already _are_ the high-contrast ones, so a separate tier would only duplicate them: a single light/dark set is emitted. That is now the only level at which the tier is absent.

`renderColorTokens()` / `renderPaletteTokens()` follow the same rule — `highContrast: true` returns the genuine escalated variant at any level below 100.

The shipped palette is unaffected: it runs at `contrastLevel: 'auto'`, and the default-palette snapshot is unchanged.
