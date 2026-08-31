---
'@cube-dev/ui-kit': minor
---

`precompileStyles()` now re-renders UI Kit's own component catalog under the application's Tasty configuration and folds it into the same artifact, so one asset covers both layers.

A chunk's lookup key hashes the style _source_, not the CSS it produced, so an application that redefines a unit, recipe, state or handler a kit chunk relies on still hits the shipped chunk for that key while the CSS behind it no longer matches. Recompiling removes the divergence at build time instead of leaving the runtime to detect it and fall back.

Pass `recompileKitCatalog: false` to skip the work when the application makes no compilation-affecting configuration change. It skips the recompilation, not the coverage: pair it with `@cube-dev/ui-kit/precompiled-styles`, which registers alongside the app artifact. Catalogs stack rather than replace — Tasty keys manifests by id and merges their lookup tables, and identical chunks compile to identical class names, so overlap costs only duplicated CSS bytes. The README said to use one "instead of" the other, which was wrong.

UI Kit's catalog cases now ship with the package so consumers can render them.
