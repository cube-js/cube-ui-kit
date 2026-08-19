---
'@cube-dev/ui-kit': patch
---

`@tenphi/glaze` 2.0.0, whose one breaking change is the `format*` scale fix ([tenphi/glaze#93](https://github.com/tenphi/glaze/issues/93), [#94](https://github.com/tenphi/glaze/pull/94)).

`formatOkhsl` / `formatOkhst` / `formatRgb` / `formatHsl` / `formatOklch` took `s` / `l` / `t` as 0–100 percentages while every producer — `resolve()`, `variantToOkhsl`, `srgbToOkhsl`, `oklabToOkhsl`, `okhslToSrgb` — returns them on 0–1. Composing the two was off by 100× and failed silently, since `0.7` is a legal percentage and the result was a valid CSS string naming a near-black color. Glaze now speaks one scale end to end, and a leftover `* 100` warns instead of shifting the color quietly.

Every affected call site drops its scaling: `formatColor` in the color field (five notations, whose tests assert exact strings like `okhst(29.23 100% 58.59%)`) and the accent label cap in the palette. Output is unchanged — the palette's four-variant token values are byte-identical before and after, and Glaze's own export methods were compensating internally.

The tone axis is the exception the release notes call out: `toTone` / `fromTone` still speak the authoring API's 0–100, so a tone is divided by 100 on its way into `formatOkhst` while a saturation read off `resolve()` is passed straight through.
