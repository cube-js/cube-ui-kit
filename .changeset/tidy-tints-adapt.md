---
'@cube-dev/ui-kit': minor
---

**DataTable, ItemTable**: per-column adaptive colors. `column.color` takes a
palette theme name (`'success'`), any CSS color, a `{ hue, saturation }` seed, or
a `{ fill, text }` pair for full manual control. Everything but the last is
*derived*: only the hue and saturation are kept, and the tone ramp plus an
`AA`/`AAA` text floor are re-solved per color scheme — so a tinted column stays
readable in light, dark and high contrast without the caller checking.
`column.colorScope` narrows it to any of `header` / `body` / `totals`.

Row banding survives inside a tinted column: the tint carries its own band one
tone step away, so the stripe still reads down the column instead of being
painted over.

**New**: `useColorTheme(config)` / `getColorTheme(config)` build an adaptive
mini-theme from a hue at runtime and name it by a hash of its config, so every
component asking for the same color shares one global token injection. Also
exports `colorThemeSeed(color)` for the hue/saturation of a color.
