---
'@cube-dev/ui-kit': patch
---

`Banner.Action` is now a filled `invert` chip, and containers can offer the `current` theme a color through a new `--current-accent` custom property.

A banner labels itself `#white` in both schemes, so `currentcolor` inside one is white — and `#surface`, the page token `current.invert` fills with, is also white in light mode. Unaided, the label and its pill collapse to cr **1.00** on all four banner themes.

`current.invert` now sources its label from `var(--current-accent, currentcolor)`. Unset, the fallback is exactly what `#current` compiled to before, so nothing outside such a container changes. `Banner` sets it on its actions wrapper to the theme's `accent-text`, which puts the label at **6.87–7.90** in both schemes with the pill still 1.5 (light) / 2.4 (dark) off the banner.

Only `color` reads the property; the rim and the hover/pressed overlays follow for free, because `#current` compiles to `currentcolor` and resolves against the element's own `color`. The other `current` flavours deliberately ignore it — they paint their chip *on* the container rather than on a pill, so the inherited color is already the right one. That is what lets the dismiss button share the same wrapper and keep its `#white`, which measures 4.62 against the banner where the accent would measure 1.53.
