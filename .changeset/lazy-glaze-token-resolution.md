---
'@cube-dev/ui-kit': minor
---

Defer Glaze color token resolution until first access (`getPaletteTokens` / `getColorTokens` / `getTokens`) so host apps can call `glaze.configure(...)` after importing the kit and still affect UI Kit tokens. Existing `PALETTE_TOKENS` / `COLOR_TOKENS` / `TOKENS` exports remain as lazy proxies.
