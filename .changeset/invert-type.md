---
'@cube-dev/ui-kit': minor
---

Add an `invert` type to `Button`, `Item`, `Item.Action` and `Item.Badge`, available on every theme.

`invert` is the filled type that follows the color scheme. Its fill is the theme's `accent-text` — the color normally painted *on* the page — and its label is `#surface`, the page itself, so the control lands on the opposite side of the page in either scheme: a dark chip with a light label in light mode, a light chip with a dark label in dark mode. That is what separates it from `primary`, which pins a fixed `#white` label on a brand *surface* and therefore reads with the same weight in both schemes.

Measured contrast between fill and label is 6.96:1 in light and 7.52:1 in dark. Hover and pressed darken through a second fill layer rather than stepping to a darker sibling, because `accent-text` has none — its `-soft` counterpart is lighter — and a `#black` overlay darkens in both schemes. Disabled reuses the brand-tinted pair `primary` already mutes to, so the two filled types stay calibrated together.

`special.invert` inverts against its own fixed dark surface instead of the page, giving a white pill with the theme's dark accent on it.

The `current` theme is the one special case, because it has no `accent-text` to fill with — it has exactly one color, the one it inherits. `current.invert` is therefore `current.primary` with its two colors swapped: `primary` fills with `#current` and punches `#surface` out of it, `invert` fills with `#surface` and writes `#current` on top. That is the same swap `special` makes between its own two filled types, so the pairing reads the same way on every theme even though the tokens differ. The swap also drops the machinery `primary` needs there — with an absolute `#surface` fill, `color` is free to be the label, so no `-webkit-text-fill-color` and no hand-recolored icon slots.
