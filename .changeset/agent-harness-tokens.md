---
'@cube-dev/ui-kit': minor
---

Ship a harness for coding agents. In projects that use [harnesspm](https://www.npmjs.com/package/@tenphi/harnesspm), agents get a short UI Kit rule, an index of the UI Kit docs, and the harnesses of Tasty 3.19.0 and Glaze 3.1.0, which UI Kit now pins: Tasty's styles rule and docs, with `tasty:styles` set up to load UI Kit's config, and Glaze's colors rule adapted to UI Kit's palette, its docs and its theme skill. Once a project trusts `@cube-dev/ui-kit`, agents can run `uikit:tokens`, which looks up palette tokens and their aliases by name, with their values in light, dark and high contrast and their contrast against their base. `tasty:styles` and Glaze's tools also need `@tenphi/tasty` and `@tenphi/glaze` trusted. The package no longer ships copies of Tasty's and Glaze's docs in `docs/tasty` and `docs/glaze`: read them in those packages or on GitHub.
