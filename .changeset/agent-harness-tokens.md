---
'@cube-dev/ui-kit': minor
---

Ship a harness for coding agents. In projects that use [harnesspm](https://www.npmjs.com/package/@tenphi/harnesspm), agents get a short UI Kit rule, an index of the UI Kit and Tasty docs, and Glaze's harness (its colors rule adapted to UI Kit's palette, its docs and its theme skill). Once a project trusts `@cube-dev/ui-kit`, agents can run `uikit:tokens`, which looks up palette tokens and legacy aliases by name, with their values in light, dark and high contrast and their contrast against their base. Glaze's own tools also need `@tenphi/glaze` trusted.
