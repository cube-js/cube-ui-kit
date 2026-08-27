---
'@cube-dev/ui-kit': minor
---

**Breaking:** reverted the `schema` term back to `scheme`, and renamed the `<html>` attribute to match. `schema` was the wrong word — the platform calls this a color _scheme_ (`prefers-color-scheme`, the `color-scheme` property, `<meta name="color-scheme">`), and in Cube's own vocabulary "schema" means the data model, so a `useSchema()` that returns `'light' | 'dark'` sits next to Cloud's `useSchema()` for SQL Runner as a pure homonym. This undoes the rename shipped in 0.170.0 ([#1362](https://github.com/cube-js/cube-ui-kit/pull/1362)) and fixes the older misspelling it was propagating.

The API, back to `scheme`:

- `renderColorTokens()` / `renderPaletteTokens()` / `RenderPaletteOptions`: the `schema` option is `scheme` again — `renderColorTokens({ scheme: 'dark' })`.
- `<CubeLogo>` / `<CubeFullLogo>`: the `schema` prop is `scheme` again.
- `useSchema()`, `resolveSchema()`, `subscribeSchema()` and `ColorSchema` — added in 0.170.0 — are now `useScheme()`, `resolveScheme()`, `subscribeScheme()` and `ColorScheme`. `useHighContrast()` and `resolveHighContrast()` are unchanged.
- The probe's `tokenOptions.schema` is `tokenOptions.scheme` again, and the `pnpm probe` CLI flag `--schema` is `--scheme` (`--scheme hc` still means light + high contrast).

The DOM opt-in, renamed for the first time:

- `<html data-schema="dark">` is now `<html data-scheme="dark">`, and the tasty state is `@root(scheme=…)` — so `@dark` compiles to `:root[data-scheme="dark"]`. `data-contrast` is unchanged.

No aliases, on either half. An alias for the attribute was measured and rejected: teaching the `@dark` state to accept both spellings takes a four-variant palette style map from 21 rules / 3.6 KB to 52 rules / 10.3 KB, because every arm has to be expanded against both attributes — a permanent 2.9× on the kit's most-used state to save a one-line edit. An app that wants a transition window can write both attributes itself; the kit reads only `data-scheme`.

To migrate, rename the option, the prop, the four hooks and the attribute at your call sites. Apps that set the attribute from JS need the one write updated (`document.documentElement.setAttribute('data-scheme', …)`), and any hand-written CSS selecting `[data-schema]` needs the same rename.
