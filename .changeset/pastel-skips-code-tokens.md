---
'@cube-dev/ui-kit': patch
---

Fix `setPaletteConfig({ pastel: true })` washing out the `code-*` syntax tokens. `pastel` was threaded into every theme including the standalone code one, and it lowers the chroma ceiling hard enough to take `code-keyword` from ~0.19 to ~0.07 — every syntax hue collapsing toward the same grey, which is the difference between readable syntax highlighting and mud.

The code theme is now built with `pastel` pinned off whatever the palette does, so the emitted `code-*` values are a function of `themes.code.saturation` alone — the same isolation its fixed hues and non-inheriting saturation already gave it. To soften a code block, lower that seed instead:

```ts
setPaletteConfig({ pastel: true, themes: { code: { saturation: 50 } } });
```

The mirrored `surface` the code theme anchors its `['AA','AAA']` floors to goes non-pastel with it. That costs nothing measurable: `surface` sits at saturation factor 0.12, where the pastel ceiling moves chroma only and leaves the tone the floors are actually solved against bit-identical — pinned by a new spec.

Default output is unchanged; `pastel` ships off.

The Theme Builder presets now re-seed the **status hues** alongside the brand, which they should have from the start: moving `hue` alone left the shipped statuses behind, and `Forest` at 150° landed 7° off the shipped `success` (156.9°) — a success banner and the brand accent resolving to the same green. Every preset now keeps ≥38° between any two of its five hues, and `Slate` demonstrates `pastel` (plus its own `themes.code.saturation`, since pastel no longer reaches the syntax palette).
