---
"@cube-dev/ui-kit": minor
---

The palette runs on Glaze 3 (`@tenphi/glaze` 3.0.1). `shadow-sm` / `shadow-md` / `shadow-lg` are tuned for Glaze 3's shadow model so they keep the depth they had in light and dark mode on the default surface (with tinted surfaces the dark shadows come out up to about 1.4 tones lighter). In high-contrast dark mode, where the surface is black, they are now transparent instead of opaque black. In the light scheme at normal contrast no color moves by more than 1 tone. Elsewhere colors move by up to about 3 tones (code syntax colors in light high contrast), most by under 1.5, and every text color keeps its WCAG level.

UI Kit re-exports Glaze, so code that imports Glaze functions or types from `@cube-dev/ui-kit` now gets Glaze 3: it throws on invalid input that 2.x resolved to wrong colors, and some output options are gone. See "Upgrading Glaze" in Glaze's migration guide (`docs/glaze/migration.md` in this package).
