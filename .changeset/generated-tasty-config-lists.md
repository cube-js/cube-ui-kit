---
'@cube-dev/ui-kit': patch
---

The published `tasty.config.ts` now lists exactly the tokens, state aliases, presets and recipes UI Kit defines, generated from the runtime, so a project that extends it gets `@tenphi/eslint-plugin-tasty` reports only for names that really don't exist. It adds the typography tokens (`$t4-font-size`, `$h2-icon-size`, …), `$dialog-max-size`, `$shadow`, `$pointer` and the `text` preset. It drops names UI Kit never defined: `#draft`, `#light-grey`, `#pink-01`, `#pink-02`, `#disabled-opacity`, `#tabs-fade-left`, `#tabs-fade-right`, `$leaf-sharp-radius`, `$fade-width` and the `inline` preset, which all rendered nothing. It also drops the `@mobile` and `@compact` states, which belong to Cube Cloud: a project that defines them in its own `configure()` lists them in its own `tasty.config.ts` `states`.
