---
'@cube-dev/ui-kit': minor
---

Give every palette zone one seed, and let a status theme take a color.

**BREAKING (`setPaletteConfig` / `<Root palette>` / `renderColorTokens` / `renderPaletteTokens`).** The six flat seed fields collapse into one `PaletteSeed` per zone — a color string, or `{ hue?, saturation? }`:

| was | is |
| --- | --- |
| `hue`, `saturation` | `accent: { hue?, saturation? }` |
| `accentColor` | `accent: '#…'` |
| `baseHue`, `baseSaturation` | `base: { hue?, saturation? }` |
| `baseColor` | `base: '#…'` |
| `themes.<status>: { hue?, saturation? }` | unchanged, and now also `themes.<status>: '#…'` |
| `themes.code: { saturation? }` | unchanged — it takes no hue and no color, by design |

```ts
setPaletteConfig({
  accent: '#2F5BFF',
  base: '#7A7269',
  themes: { danger: '#b91c1c', success: { hue: 150 } },
});
```

The union **is** the exclusivity. A zone was always seeded either by a color or by numbers, but the old shape let you write both and needed a precedence rule to settle it (`hue` outranked `accentColor`). Now it cannot be written, so there is no rule to learn — and a patch that switches form replaces rather than merges. The one capability this removes is the hybrid that precedence allowed: `resolvePaletteConfig({ hue: 30 })` over a stored brand color previewed "this brand, rotated, tone intact". A numeric seed now takes the zone over outright.

`ResolvedPaletteConfig` keeps its flat shape — `hue`, `baseHue`, `saturation`, `baseSaturation`, `accentColor`, `accentTone`, `accentSaturation` — so anything reading the resolved config is unaffected. Its four status entries gain `color` and `colorTone`. `PaletteThemeSeed` is replaced by `PaletteSeed`; `PaletteNumericSeed` and `ResolvedThemeSeed` are new.

**Status themes can now be seeded by a color**, which is what the union was blocking. `themes.danger: '#b91c1c'` renders that red on `#danger-accent-surface` — reproduced in light at normal contrast, adapting in dark and high contrast — and reaches `#danger-accent-text`, `-text-soft` and `-icon`. It inherits the brand path's softened APCA floors (Lc 45 against the page, Lc 45 against the white label, escalating to Lc 60 in high contrast) in place of the white-anchored ladder's `['AA','AAA']`, and the same tone cap, so a pale status color is pulled down rather than shipped as a white `type="primary"` label on white.

One rule differs from the accent's, deliberately: **a status color's chroma becomes that theme's seed.** An accent color's does not, because all four status themes inherit the accent's saturation and raising it would re-chromatise every one of them; nothing inherits from a status theme, so there is nothing to protect. Moving the seed is also what holds the theme together — its tinted banner surface, border and text ramp are authored as factors of the seed (`0.2`, `0.3`, `0.25`), so leaving it at `100` beside a muted fill would give a fully tinted banner under a washed-out button. Moving it keeps the shipped `1.0 : 0.2 : 0.3 : 0.25` ratio exactly.

Two consequences worth stating. A muted `saturation` *beside* an accent color is no longer expressible — a color leaves the inherited seed at its default, so mute the status themes individually if you want that. And the legacy `#danger` / `#success` / `#warning` / `#note` aliases resolve to `#<theme>-accent-surface`, so a status color moves every one of them across a consuming app; that is the point, but it is the blast radius.

The Theme Builder's **Color** tab now covers all six zones: each status chip opens on a color field with its hue and saturation sliders gone, entering the tab converts the four status themes to the fill each is already emitting rather than to a sample hex, and leaving it pins their hues back. The shipped palette is unchanged — a config with no color seed resolves bit for bit as before.
