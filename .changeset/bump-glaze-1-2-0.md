---
'@cube-dev/ui-kit': minor
---

Update `@tenphi/glaze` 0.13.0 → 1.2.0 and migrate the palette from the `lightness` axis to the contrast-shaped `tone` axis.

**This changes resolved colors.** Glaze 1.x removed `lightness` as a color-def input, so the upgrade and the axis migration are the same change — all 54 palette declarations are re-authored against `tone`. Because `tone` is contrast-shaped rather than lightness-shaped, tokens do not land on their previous values. Measured per-channel RGB delta against the previous release, across every token in all four scheme variants: core surfaces/text mean ~13 (max 51), accent mean ~13 (max 48). Seed hue and saturation are unchanged, so hue relationships and relative ramps are preserved — the shift is in tone placement, not in the palette's structure.

Also newly available from Glaze 1.2.0: `tone: 'max'` / `'min'` on colors that declare a `base` (the extreme is no longer re-mapped through the dark tone window, which used to compress the base-to-extreme span and lower contrast in dark), and `darkHue` / `darkSaturation` for seeding the dark schemes independently of the flat `darkDesaturation` haircut.
