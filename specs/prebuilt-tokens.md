# Prebuilt CSS Tokens

## Problem

Design tokens (colors, base values) are currently processed at runtime by `useGlobalStyles('body', TOKENS)` inside `GlobalStyles.tsx`. The token set is about to expand significantly to support dark theme and high-contrast modes, which will produce a large volume of CSS custom properties wrapped in `@media` queries. Parsing all of this through tasty's style pipeline on every page load is wasteful for what is ultimately static CSS.

## Goal

Precompile design tokens into a CSS string at build time and ship the result as a JS module that injects the CSS via `injectRawCSS`. Consumers get zero-cost token injection without needing CSS loader configuration.

## Approach

### Build-time codegen script

A Node script (`scripts/build-tokens-css.mts`) that:

1. Calls `configure()` from `@tenphi/tasty` with the project's states/recipes configuration.
2. Imports the token definitions from `src/tokens/`.
3. Calls `extractStylesForSelector(':root', tokens)` from `@tenphi/tasty/zero` to produce CSS through tasty's full style pipeline — resolving `#color` references, generating `-rgb` variants, expanding `$token` values, and wrapping state-based values in `@media` queries.
4. Writes the result into a generated `.ts` file containing the CSS as a string constant and an `injectRawCSS` wrapper.

Run with `tsx` (or `jiti`, which tasty already bundles) since token source files are TypeScript.

### Token structure with state-based values

Expand token definitions to use tasty's state syntax for dark/high-contrast variants. This keeps a single source of truth per token:

```ts
export const COLOR_TOKENS: Styles = {
  '#primary': {
    '': okhsl(PURPLE_HUE, MAIN_SATURATION, MAIN_LIGHTNESS),
    '@dark': okhsl(PURPLE_HUE, MAIN_SATURATION, 70),
    '@high-contrast': okhsl(PURPLE_HUE, 90, 45),
  },
  '#primary-text': {
    '': okhsl(PURPLE_HUE, MAIN_SATURATION, TEXT_LIGHTNESS),
    '@dark': okhsl(PURPLE_HUE, MAIN_SATURATION, 80),
  },
  // ...
};
```

The `@dark` and `@high-contrast` state aliases are defined via `configure({ states: { ... } })` before extraction, mapping to `@media (prefers-color-scheme: dark)` and `@media (prefers-contrast: more)` respectively.

Tokens that don't vary across modes remain plain strings — no changes needed.

### Generated output

The script produces `src/generated/tokens-css.ts`:

```ts
// AUTO-GENERATED — do not edit manually
// Run `pnpm build:tokens` to regenerate
import { injectRawCSS } from '@tenphi/tasty';

const CSS = `:root { --primary-color: okhsl(280.3 80% 52%); ... }
@media (prefers-color-scheme: dark) { :root { --primary-color: okhsl(280.3 80% 70%); ... } }
@media (prefers-contrast: more) { :root { --primary-color: okhsl(280.3 90% 45%); ... } }`;

let result: { dispose: () => void } | null = null;

export function injectTokens() {
  if (!result) {
    result = injectRawCSS(CSS);
  }
}

export function disposeTokens() {
  result?.dispose();
  result = null;
}
```

The generated file is committed to the repo so the build doesn't require running the codegen script unless tokens change.

### Separate entry point

Expose via a new package entry point:

**tsdown.config.ts** — add entry:
```ts
entry: {
  index: 'src/index.ts',
  tokens: 'src/generated/tokens-css.ts',
},
```

**package.json** — add export:
```json
"exports": {
  ".": {
    "import": "./dist/index.js",
    "types": "./dist/index.d.ts"
  },
  "./tokens": {
    "import": "./dist/tokens.js",
    "types": "./dist/tokens.d.ts"
  }
}
```

### Build scripts

```json
"scripts": {
  "build:tokens": "tsx scripts/build-tokens-css.mts",
  "build": "pnpm build:tokens && tsdown"
}
```

## Consumer usage

```ts
// Side-effect import (inject on module evaluation)
import '@cube-dev/ui-kit/tokens';

// Or explicit control
import { injectTokens, disposeTokens } from '@cube-dev/ui-kit/tokens';
injectTokens();
```

## Integration with GlobalStyles

`GlobalStyles` currently injects tokens + body styles via `useGlobalStyles`. After this change:

- Tokens move to the prebuilt entry point.
- `GlobalStyles` continues to handle body styles (font, overscroll, preset, letter-spacing) and static CSS (font-face, Prism, kbd, etc.).
- `GlobalStyles` no longer applies token custom properties at runtime.
- Consumers who use `<GlobalStyles>` import `@cube-dev/ui-kit/tokens` separately.

## Why JS module over CSS file

- No CSS loader / bundler configuration required by consumers.
- CSS goes through tasty's `injectRawCSS` pipeline — consistent ordering with runtime-injected component styles.
- SSR works out of the box (`getCssText()` captures the injected CSS).
- Shadow DOM compatible (consumers can pass `root` option if needed).
- `dispose()` support for micro-frontends and testing cleanup.

## Why `extractStylesForSelector` over manual CSS generation

`extractStylesForSelector(':root', tokens)` calls through to `renderStyles` — the same pipeline `useGlobalStyles` uses at runtime. This means:

- `#color` → `--name-color` custom property + `-rgb` variant.
- `#primary` reference → `var(--primary-color)`.
- `#dark.06` → `rgb(var(--dark-color-rgb) / 0.06)`.
- `$token` → `--token` custom property.
- State-based values → wrapped in `@media` / attribute selectors.

No need to reimplement any of this logic in the build script.

## File changes summary

| File | Change |
|------|--------|
| `scripts/build-tokens-css.mts` | New — codegen script |
| `src/generated/tokens-css.ts` | New — generated output (committed) |
| `src/tokens/colors.ts` | Modify — add state-based dark/high-contrast values |
| `src/components/GlobalStyles.tsx` | Modify — remove token injection, keep body styles only |
| `tsdown.config.ts` | Modify — add `tokens` entry |
| `package.json` | Modify — add `./tokens` export, add `build:tokens` script |
