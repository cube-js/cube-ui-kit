---
'@cube-dev/ui-kit': minor
---

Add color-valued palette seeds. `accentColor` and `baseColor` accept a real color string — hex, `rgb()`, `hsl()`, `okhsl()`, `okhst()`, `oklch()` — so a brand can be given as the color you have rather than as a hue you had to derive:

```ts
setPaletteConfig({ accentColor: '#2F5BFF', baseColor: '#7A7269' });
```

The two are deliberately asymmetric. `accentColor` contributes hue, saturation and **tone**, and the tone is the point: the brand fill was previously authored as a fixed tone step off white, so every accent hue landed at roughly the same lightness and a yellow brand came out olive. `baseColor` contributes **hue only** — its tone and saturation are discarded, because the chrome's lightness ladder and its 0.10–0.20 saturation factors are the design.

The color is handed to Glaze's `from`, so the **light, normal-contrast** variant reproduces it exactly — the fill, the link and the icon all render the value you passed. Dark and high contrast adapt as every other color does. A 3:1 floor against the page applies everywhere and is a floor rather than a target: `#7A4DBF` measures 5.8:1 and is emitted untouched, while `#FFD400` cannot clear 3:1 on white and darkens to `#b09200` and no further. High contrast tightens back to AAA regardless, since that tier is selected by `prefers-contrast: more` or `data-contrast="high"` and anyone reading it has asked for separation over brand.

Because the accent family now carries its own chroma, a brand color no longer raises the palette-level `saturation` to reach it — so it cannot leak into the neutral chrome or the status themes. `#danger-accent-surface` is now identical whatever the brand is. Status themes also do not inherit the literal itself (`extend()` copies defs, so an inherited `from` would make a danger button the brand color outright); `special` does follow it, being the brand-on-dark CTA.

`ResolvedPaletteConfig` gains `accentTone`, and `colorSeed()` is exported for reading hue / saturation / tone off a color directly. The shipped palette is unchanged — a config with no color seed resolves bit for bit as before.

Make `pastel` and `saturation` two explicit paths rather than two knobs that fight. Pastel is one flat chroma ceiling, so a second saturation scale on top of it only undid the evenness it exists for — under `pastel` the seed is now pinned to `100`. Setting a `saturation` therefore **turns pastel off**, since tuning a saturation is the non-pastel path by definition, so `setPaletteConfig({ saturation: 55 })` keeps resolving to 55 exactly as before. An explicit `pastel: true` written next to a saturation wins and the saturation is ignored with a dev warning, but it is kept rather than dropped, so turning pastel back off restores the number.

Fix the brand fill ramp collapsing in high contrast under a color seed: `accent-surface` and `accent-surface-2` previously solved to the same value there, so the hover step disappeared.

The `Theme Builder` story gains a **Seeded by** switch per zone, requested-vs-resolved swatches that make the pastel chroma cap visible, and a color-seeded `Cobalt` preset.
