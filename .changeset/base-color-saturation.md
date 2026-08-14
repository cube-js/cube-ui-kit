---
'@cube-dev/ui-kit': minor
---

A `baseColor` now contributes its **saturation** as well as its hue, and `baseSaturation` follows the accent's chroma however that chroma was expressed.

`baseColor` previously contributed hue only, which left a hole: picking a base color set which way the greys leaned but not how far, so the chrome's chroma still came from the accent seed and had nothing to do with the color chosen. Its **tone** is still discarded — the chrome's own lightness ladder is the design.

```ts
setPaletteConfig({ baseColor: '#6e7076' }); // near-grey in, near-grey chrome out
setPaletteConfig({ baseColor: '#FFD400' }); // saturation 100 in, clipped to 50
```

The derived saturation is **clipped to `MAX_BASE_SATURATION`** (`50`, newly exported). Naming a base color says "the chrome *is* this color", so it lands near it rather than at the 12% share `baseSaturation` otherwise inherits — but a fully saturated chrome stops being chrome, and the base colors converge above `25` anyway, so the clip costs nothing that was still moving.

`baseSaturation`'s default also changes shape. Unset, it takes `0.12` of whatever the **accent zone** carries — the `saturation` seed, or an `accentColor`'s own chroma when one is set:

```
input.baseSaturation
  ?? (baseColor  ? min(baseColor.saturation, 50)
                 : (accentColor?.saturation ?? saturation) * 0.12)
```

Reading the accent color there is the one place a brand color reaches the base zone, and it has to: without it, a near-grey brand left the chrome carrying 12% of a saturation nobody asked for. Nothing here touches the palette-level `saturation`, so the status themes still inherit exactly what they did and the guarantee that a brand color cannot re-chromatise them is intact.

The shipped palette is unchanged: with no color seed the expression is `saturation × 0.12` as before, and the snapshot is byte-identical.
