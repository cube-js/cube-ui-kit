---
'@cube-dev/ui-kit': patch
---

`Banner.Action` is now a filled `invert` chip on the banner's own theme, instead of a `current` outline.

A banner labels itself `#white` in both schemes, so `currentcolor` inside one is white — and `#surface`, the page token both filled `current` flavours reach for, is also white in light mode. Every arrangement of those two collapses: `theme="current" type="primary"` (fill `#current`, label `#surface`) and `theme="current" type="invert"` (fill `#surface`, label `#current`) each measure cr **1.00** in light on all four banner themes.

The theme's own tokens have no such coincidence. `<theme>.invert` fills with `accent-text`, the dark end of the brand ramp, and labels with `#surface`: cr **6.87–7.90** across the four themes in both schemes, with the chip still separating from the banner (~1.5 light, ~2.4 dark, either side of the 1.48 a `primary` rim measures). `Banner.Action` therefore names the banner's theme explicitly rather than inheriting `current`.

The dismiss button is unchanged — it stays a borderless `current` icon action, which is what a secondary affordance should be.
