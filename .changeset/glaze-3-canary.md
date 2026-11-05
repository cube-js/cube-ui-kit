---
"@cube-dev/ui-kit": minor
---

The palette runs on Glaze 3 (canary `0.0.0-snapshot.f404191`). Shadows are now solved as exact tone steps over their surface with a pure black pigment. In light mode `shadow-sm` / `shadow-md` / `shadow-lg` are deeper: the large one darkens the surface by about 22 tones instead of 12. In dark mode they are lighter, with `shadow-sm` at about half its old opacity. In high-contrast dark mode, where the surface is black, shadows are transparent. Other colors move by up to about 3 tones (code syntax colors in light high contrast), most by under 1.5, and every text color keeps its WCAG level.
