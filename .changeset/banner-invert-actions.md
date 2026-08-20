---
'@cube-dev/ui-kit': patch
---

`Banner.Action` is now a filled `invert` chip, and containers can offer the `current` theme a color through a new `--current-accent` custom property.

A banner labels itself `#white` in both schemes, so `currentcolor` inside one is white — and `#surface`, the page token `current.invert` fills with, is also white in light mode. Unaided, the label and its pill collapse to cr **1.00** on all four banner themes.

Both filled `current` flavours now source their label through a custom property — `current.invert` as `var(--current-accent, currentcolor)`, `current.primary` as `var(--current-label, var(--surface-color))`. Unset, the fallback is exactly what `#current` compiled to before, so nothing outside such a container changes. `Banner` sets it on its actions wrapper to the theme's `accent-text`, which puts the label at **6.87–7.90** in both schemes with the pill still 1.5 (light) / 2.4 (dark) off the banner.

Only `color` reads the property; the rim and the hover/pressed overlays follow for free, because `#current` compiles to `currentcolor` and resolves against the element's own `color`. The other `current` flavours deliberately ignore it — they paint their chip *on* the container rather than on a pill, so the inherited color is already the right one. That is what lets the dismiss button share the same wrapper and keep its `#white`, which measures 4.62 against the banner where the accent would measure 1.53.

A container that sets `--current-accent` owns that color in every state, the disabled one included: `current.invert` gates its own label fade on `!inherit-disabled`, on the grounds that something above already faded the color it paints from, and an offered accent is not inherited. `Banner` therefore pairs each accent with a `.4` counterpart — without it a disabled banner keeps a full-strength label (cr 5.69 light / 6.13 dark) on a dead chip, against the 1.81 / 2.20 the muted entry gives.

`current.primary` needs it for the mirror-image reason: its pill IS `currentcolor`, so its `#surface` label only contrasts while the inherited color sits away from the page. A container that inverts the surface breaks that — a dark banner paints `#white`, so the pill is white and the label is white too in light mode, cr **1.00**. Such a container has the answer to hand: its own fill contrasts with its own text by construction, and the pill is that text. The `CurrentTheme` story's two inverted containers now offer theirs.

They take **separate** properties because they sit on different chips, and one value cannot serve both. On a container painting a scheme-fixed `#white`, `primary`'s chip is that white and needs a dark label in either scheme, while `invert`'s chip is `#surface` and needs a label that flips with the page. Offering the container's own fill alone drops `invert` to cr **1.00** in dark; offering `#surface-text` alone drops `primary` to **1.12**.
