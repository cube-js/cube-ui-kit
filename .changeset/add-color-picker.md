---
'@cube-dev/ui-kit': minor
---

Add `ColorPicker` — a form-attachable color input. The field shows the current color as a swatch, accepts hex, `rgb()`, `hsl()`, `okhsl()`, `okhst()` and `oklch()` text, and opens a popover where the color can be tuned on three axes: HST (OKHST hue/saturation/tone), LCH (OKLCH lightness/chroma/hue) or RGB. Every conversion runs through Glaze, so the value is always a real, in-gamut color.

`formatMode` controls how the text relates to the value: `forced` (default) rewrites the text in `format`, `derive` keeps the notation the user typed but normalizes the value, and `free` passes the text through verbatim after verifying it parses. Also adds a `PipetteIcon`.
