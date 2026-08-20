---
'@cube-dev/ui-kit': patch
---

`Banner.Action` is now a filled `invert` chip, and containers can offer the `current` theme a color through a new `--current-accent` custom property.

A banner labels itself `#white` in both schemes, so `currentcolor` inside one is white — and `#surface`, the page token `current.invert` fills with, is also white in light mode. Unaided, the label and its pill collapse to cr **1.00** on all four banner themes.

On the `current` theme the two filled flavours are each other's mirror, and now say so in one place: `primary` paints `#current` and writes the swap color on it, `invert` paints the swap color and writes `#current`. The swap color is `var(--current-accent, var(--surface-color))`, so a container offers one value and both flavours move together — they cannot come apart.

Unset, the fallback is the `#surface` both used before, so nothing outside such a container changes. `Banner` offers its theme's `accent-text`, which puts its actions at 6.87-7.90 in both schemes. A container that inverts the surface should offer its own fill, which contrasts with its own text by construction.

`#current`-derived fades stay gated — a disabled host has already muted what they resolve against — while the swap color is faded by the reader, since nothing above touches it. `Banner` therefore pairs each accent with a `.4` counterpart for the gated side.

Two nesting fixes fall out of `current.primary` keeping `color` as the fill: the `Actions` slot is recolored to the label like the icon slots already were, and `ItemButton`'s wrapper reproduces the label rather than the chip, so nested and sibling actions no longer vanish into it.
