---
"@cube-dev/ui-kit": patch
---

Fix okhsl color function to preserve opacity/alpha channel when converting to RGB. Previously, alpha values were silently dropped when using okhsl() colors in styles or tokens. Now okhsl() colors with alpha (e.g., `okhsl(240 50% 50% / .5)`) are correctly converted to `rgb()` format with alpha preserved.
