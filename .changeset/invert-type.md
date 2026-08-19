---
'@cube-dev/ui-kit': minor
---

Add an `invert` type to `Button`, `Item`, `Item.Action` and `Item.Badge`, available on every theme.

`invert` is the filled type that follows the color scheme. Its fill is the theme's `accent-text` — the color normally painted *on* the page — and its label is `#surface`, the page itself, so the control lands on the opposite side of the page in either scheme: a dark chip with a light label in light mode, a light chip with a dark label in dark mode. That is what separates it from `primary`, which pins a fixed `#white` label on a brand *surface* and therefore reads with the same weight in both schemes.

Measured contrast between fill and label is 6.96:1 in light and 7.52:1 in dark. Hover and pressed darken through a second fill layer rather than stepping to a darker sibling, because `accent-text` has none — its `-soft` counterpart is lighter — and a `#black` overlay darkens in both schemes. Disabled reuses the brand-tinted pair `primary` already mutes to, so the two filled types stay calibrated together.

`special.invert` inverts against its own fixed dark surface instead of the page, giving a white pill with the theme's dark accent on it. On the `current` theme `invert` and `primary` coincide — there is only one color in play, so "the emphatic filled type" and "the page and its text swapped" are the same construction — and `current.invert` is an alias of `current.primary` rather than a copy.
