---
'@cube-dev/ui-kit': minor
---

**Breaking:** renamed the `scheme` term to `schema` across the API, so one word names the concept the `data-schema` attribute and the `@root(schema=…)` state already use.

- `renderColorTokens()` / `renderPaletteTokens()` / `RenderPaletteOptions`: the `scheme` option is now `schema` — `renderColorTokens({ schema: 'dark' })`.
- `<CubeLogo>` / `<CubeFullLogo>`: the `scheme` prop is now `schema`.
- The probe's `tokenOptions.scheme` is now `tokenOptions.schema`, and the `pnpm probe` CLI flag `--scheme` is now `--schema` (`--schema hc` still means light + high contrast).

No aliases: update the call sites.
