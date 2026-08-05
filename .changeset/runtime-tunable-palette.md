---
'@cube-dev/ui-kit': minor
---

Make the color palette tunable at runtime.

```ts
setPaletteConfig({
  hue: 210, // accent hue — the brand
  baseHue: 60, // neutral chrome hue; inherits `hue` when unset
  saturation: 72,
  themes: { danger: { hue: 12 }, code: { saturation: 60 } },
  pastel: false,
  contrastLevel: 'auto',
});
```

Hue is split into two zones: `hue` drives the **accent** zone (the `accent-*` family, `primary` / `purple` / `special`, plus `focus`, the loading faces and the disabled chip) and `baseHue` drives the **base** zone (the neutral chrome — `surface` and its ladder, the `surface-text*` ramp, `border`, `placeholder`). `baseHue` inherits `hue`, so the chrome keeps its faint brand tint unless you decouple it. Only the `default` theme is affected; a colored theme's tinted `surface` deliberately follows its own hue, because a danger banner should read as red.

Saturation is deliberately *not* split: it is one seed per theme, and each color's `saturation` is a 0–1 factor of it, so moving it rescales the palette while keeping the designed proportions between a subtle surface tint and a saturated accent.

Each status theme (`success` / `danger` / `warning` / `note`) re-seeds hue and saturation independently. `pastel` and `contrastLevel` are global. Fields merge like `glaze.configure()`, and fields left unset keep inheriting.

New exports: `setPaletteConfig`, `getPaletteConfig`, `getPaletteConfigInput`, `resolvePaletteConfig`, `resetPaletteConfig`, `subscribePaletteConfig`, `invalidatePaletteTokens`, `usePaletteConfig`, `usePaletteVersion`, `getPalette`, `DEFAULT_PALETTE_CONFIG`, and the types `PaletteConfig` / `ResolvedPaletteConfig` / `PaletteThemeSeed` / `PaletteCodeSeed` / `PaletteThemeName`, plus `getCodeTheme`. `<Root>` gains an equivalent `palette` prop, applied during render so the first paint is already correct.

**Inherited vs pinned.** Unset fields inherit, so `baseHue` tracks `hue` and `themes.<status>.saturation` tracks `saturation` until something writes them — they are not linked, they just have no value of their own yet. Writing the field pins it; passing `undefined` clears the pin so it inherits again. `getPaletteConfig()` resolves everything and so cannot tell you which is which; `getPaletteConfigInput()` returns the sparse config as set, for settings UIs that need to show an inherited value as inherited.

**Region previews.** `renderColorTokens({ …config, scheme, highContrast })` resolves the palette for one config and one scheme into flat literal values, ready to apply to a subtree through a tasty `tokens` prop:

```tsx
<Block tokens={renderColorTokens({ hue: 210, scheme: 'dark' })} fill="#surface">
  …renders in that theme, inside a light page…
</Block>
```

The document palette emits state maps (`@dark` / `@hc`), so a page can only ever show one scheme at a time; collapsing it to a chosen scheme is what lets several themes coexist — a theme picker, or a dark panel in a light page. Config fields merge over the current config, so `{ scheme: 'dark' }` previews the active theme in dark. Nothing is applied globally. Aliases, shadow tokens and scrollbar colors ride along by reference so they re-resolve against the region rather than freezing to the outer theme. `renderPaletteTokens` is the same without those, and `resolvePaletteConfig` resolves a partial without applying it.

A mounted `<Root>` re-injects the token block automatically when the config changes — no component re-render is involved, since every color compiles to a CSS custom property.

**This refactor changes no colors.** Turning the palette into a function of its seeds is output-neutral: with no config set, every token resolves exactly as it did, and a new snapshot test (156 tokens × 4 scheme variants) enforces it. The surface-ladder and themed-border retune in this release is the only intentional color movement.

Notes:

- The palette is process-global (Glaze's own config is, and the tokens live in a single `body` rule), so `<Root palette>` is a convenience wrapper over `setPaletteConfig()`, not a per-tree scope. Under SSR, apply it in code that runs on both server and client — per-request palettes are not supported.
- The `code-*` syntax family is now its own Glaze theme with its own seed, so neither the brand hue nor the palette saturation reaches it. Every `code-*` hue is absolute (a re-seeded brand can no longer collide string literals with `#code-number` at 156°), and the saturation is fixed at `80` rather than inheriting `saturation`, so muting the palette cannot wash out a code block. Tune it with `themes.code.saturation`; the tokens stay adaptive, keeping their `['AA','AAA']` floor against the real surface in every scheme. Resolved values at the default config are unchanged.
- A numeric `contrastLevel` removes the high-contrast tier entirely, so `<html data-contrast="high">` and `prefers-contrast: more` stop having an effect while one is set. `pastel: true` changes every resolved color by design. Both are documented in the new `Getting Started/Theming` page.
