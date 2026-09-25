---
'@cube-dev/ui-kit': patch
---

Fix runtime palette changes that stopped recoloring the app in 0.183.0. In the published build, a `setPaletteConfig()` call, or a `<Root palette>` that changed after mount, updated the palette store, but the page kept the tokens of its first render, so the whole UI stayed on the palette it loaded with. `usePaletteConfig()` likewise kept returning its first render's config, and `useColorTheme()` kept injecting a theme's old tokens after the palette changed. All three follow every change again. The bug was in the React Compiler build only, so tests against the source did not show it.
