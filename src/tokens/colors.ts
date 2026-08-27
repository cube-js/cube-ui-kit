import { BASE_TOKENS } from './base';
import { lazyStyles } from './lazy-styles';
import { getPaletteTokens, renderPaletteTokens } from './palette';
import { getPaletteVersion } from './palette-config';
import { SHADOW_TOKENS } from './shadows';

import type { Styles, Tokens } from '@tenphi/tasty';
import type { RenderPaletteOptions } from './palette';

/**
 * Color tokens with `#` prefix for tasty color definitions.
 *
 * The base values come from the Glaze-generated palette (`palette.ts`):
 * `#surface`, `#surface-text*`, `#border`, `#focus`, `#disabled`, `#pink`,
 * `#shadow-*`, `#overlay`, the unprefixed `#accent-*` family, and the per-theme
 * `#primary-*` / `#purple-*` / `#success-*` / `#danger-*` / `#warning-*` /
 * `#note-*` families.
 *
 * Each Glaze token is a state map (`{ '': '...', '@dark': '...', '@hc': '...' }`),
 * giving us light, dark, and high-contrast variants for free. The `@dark` /
 * `@hc` predefined states are wired up globally in `src/components/Root.tsx`.
 *
 * The aliases below preserve backward compatibility with every legacy
 * `#name` used across components, stories, and tests. Each alias resolves
 * to a current Glaze token via tasty's `#token` reference syntax.
 */

const LEGACY_ALIASES: Styles = {
  // ---- Neutral text scale (legacy `#dark*`) ----
  '#text': '#surface-text-soft',
  '#dark': '#surface-text',
  '#dark-01': '#surface-text',
  '#dark-02': '#surface-text-soft',
  '#dark-03': '#surface-text-soft-2',
  '#dark-04': '#placeholder',
  '#dark-05': '#border',

  // Fixed-mode counterpart to `#dark`. Resolves to the same L≈12 surface
  // but uses Glaze `mode: 'fixed'` so it does NOT invert in dark schemes.
  // Use this whenever the design intentionally pins a dark color regardless
  // of scheme. Points at `#special-surface` (`mode: 'fixed'`, L=12),
  // emitted by the standalone `specialTheme` in `palette.ts` — the canonical
  // source of fixed-mode color tokens for `special`-variant components.
  '#fixed-dark': '#special-surface',

  // Fixed-mode counterpart to `#primary-text`. `#primary-text` is anchored
  // to `surface` with `mode: 'auto'`, so it flips to a *light* purple in
  // dark schemes (correct on body content, which also inverts). When the
  // local fill is a fixed color instead (an always-white pill, etc.), the
  // adaptive text loses contrast (light purple on white) in dark mode.
  // Points at `#special-accent-text` (`mode: 'fixed'`, cr 6–8.5 vs fixed
  // white) — a dark purple readable on a white surface that stays put
  // across schemes.
  '#fixed-primary-text': '#special-accent-text',

  // ---- Misc neutral ----
  '#minor': '#surface-text-soft.65',
  '#shadow': '#shadow-md',
  '#light': '#surface-3',
  '#dark-bg': '#surface-2',
  '#clear': 'transparent',

  // Pink: independent hue, scheme-static (no Glaze adaptation). Kept as a raw
  // literal rather than folded into a theme — nothing in the palette emits this
  // hue as a standalone token, and it is a documented public alias (see
  // `Usage.docs.mdx`, `tasty.config.ts`, and the `pink` key in
  // `tasty-augment.d.ts`), so dropping it would silently break consumer styles
  // while the types still advertised it.
  '#pink': 'okhsl(5 100% 67%)',

  // ---- Disabled state aliases ----
  // `#disabled-surface` and `#disabled-surface-text` are emitted directly by
  // the Glaze palette (`palette.ts`) as scheme-symmetric, contrast-driven
  // tokens — no alias needed here. `#disabled` stays as a brand-tinted
  // backwards-compat anchor for the per-theme `#<theme>-disabled` aliases below.

  // ---- Primary / Purple legacy ----
  '#primary': '#primary-accent-surface',
  '#primary-text': '#primary-accent-text',
  '#primary-text-soft': '#primary-accent-text-soft',
  '#primary-bg': '#primary-surface',
  '#primary-icon': '#primary-accent-icon',
  '#primary-hover': '#primary-accent-surface-hover',
  '#primary-desaturated': '#primary-accent-surface-2',
  '#primary-disabled': '#disabled',

  '#purple': '#purple-accent-surface',
  '#purple-text': '#purple-accent-text',
  '#purple-text-soft': '#purple-accent-text-soft',
  '#purple-bg': '#purple-surface',
  '#purple-icon': '#purple-accent-icon',
  '#purple-hover': '#purple-accent-surface-hover',
  '#purple-disabled': '#disabled',

  // Purple scale (gradient/accent shades) — mapped to the accent-surface ramp.
  '#purple-01': '#purple-accent-surface',
  '#purple-02': '#purple-accent-surface-2',
  '#purple-03': '#purple-accent-surface-3',
  '#purple-04': '#purple-surface',

  // ---- Danger ----
  '#danger': '#danger-accent-surface',
  '#danger-text': '#danger-accent-text',
  '#danger-text-soft': '#danger-accent-text-soft',
  '#danger-bg': '#danger-surface',
  '#danger-icon': '#danger-accent-icon',
  '#danger-hover': '#danger-accent-surface-hover',
  '#danger-desaturated': '#danger-accent-surface-2',
  '#danger-disabled': '#disabled',

  // ---- Success ----
  '#success': '#success-accent-surface',
  '#success-text': '#success-accent-text',
  '#success-text-soft': '#success-accent-text-soft',
  '#success-bg': '#success-surface',
  '#success-icon': '#success-accent-icon',
  '#success-hover': '#success-accent-surface-hover',
  '#success-desaturated': '#success-accent-surface-2',
  '#success-disabled': '#disabled',

  // ---- Warning ----
  '#warning': '#warning-accent-surface',
  '#warning-text': '#warning-accent-text',
  '#warning-text-soft': '#warning-accent-text-soft',
  '#warning-bg': '#warning-surface',
  '#warning-icon': '#warning-accent-icon',
  '#warning-hover': '#warning-accent-surface-hover',
  '#warning-desaturated': '#warning-accent-surface-2',
  '#warning-disabled': '#disabled',

  // ---- Note ----
  '#note': '#note-accent-surface',
  '#note-text': '#note-accent-text',
  '#note-text-soft': '#note-accent-text-soft',
  '#note-bg': '#note-surface',
  '#note-icon': '#note-accent-icon',
  '#note-hover': '#note-accent-surface-hover',
  '#note-desaturated': '#note-accent-surface-2',
  '#note-disabled': '#disabled',
};

/**
 * Context hooks — tokens a CONTAINER sets to steer a component that cannot
 * resolve the color on its own.
 *
 * Declared with a default rather than read as `var(--x, fallback)` at every use
 * site, for two reasons: the default is stated once instead of repeated (and so
 * cannot drift), and a declared token gets its components companion for free —
 * which is the only way `#current-fill.5` can fade whatever the container
 * offered rather than the fallback.
 *
 * Included by reference in {@link renderColorTokens} alongside the legacy
 * aliases, so a region preview re-resolves the default against that region's own
 * `#surface` instead of freezing the outer theme's.
 */
const CONTEXT_TOKENS: Styles = {
  // The label color `current.primary` punches out of its `currentcolor` chip —
  // read by nothing else. That flavour fills with the color it INHERITS, so its
  // label has to contrast with an arbitrary color, and the page only manages
  // that while the inherited color sits away from the page. A container
  // whose own text color IS the page breaks it: a `Banner` labels itself
  // `#white`, and `#surface` is white in light mode, so label and chip collapse
  // to cr 1.00.
  //
  // Such a container sets this to a color that contrasts with its own fill —
  // usually its own surface — and the label, the rim and the icon slots all
  // follow. See `CURRENT_PRIMARY_STYLES` in `src/data/item-themes.ts`.
  '#current-fill': '#surface',
};

/**
 * Combined color token map: Glaze-generated palette + legacy aliases + context hooks.
 *
 * Memoized against the palette config version, so a runtime `setPaletteConfig()`
 * invalidates it while repeated reads stay free. Prefer {@link getColorTokens}
 * in new code.
 *
 * `#white` and `#black` are intentionally omitted — they are built-in
 * tasty named colors and resolve automatically.
 */
let colorTokensCache: Styles | null = null;
let cachedVersion = -1;

export function getColorTokens(): Styles {
  const version = getPaletteVersion();

  if (!colorTokensCache || cachedVersion !== version) {
    colorTokensCache = {
      ...getPaletteTokens(),
      ...LEGACY_ALIASES,
      ...CONTEXT_TOKENS,
    };
    cachedVersion = version;
  }
  return colorTokensCache;
}

export const COLOR_TOKENS: Styles = lazyStyles(getColorTokens);

/**
 * Tokens that live outside the palette but whose *values* reference a palette
 * color, so a region preview has to re-declare them. Kept by reference, exactly
 * as `<Root>` declares them — see {@link renderColorTokens}.
 *
 * Sourced from `./shadows` and the scrollbar block of `./base`; if either grows a
 * new colour-referencing token, add it here too.
 */
const COLOR_DEPENDENT_TOKENS: Styles = {
  ...SHADOW_TOKENS,
  '#scrollbar-thumb': BASE_TOKENS['#scrollbar-thumb'],
  '#scrollbar-outline': BASE_TOKENS['#scrollbar-outline'],
  '#scrollbar-bg': BASE_TOKENS['#scrollbar-bg'],
  '#scrollbar-corner': BASE_TOKENS['#scrollbar-corner'],
};

/**
 * Render every UI Kit color for one config and one scheme, as flat literal
 * values ready to apply to a **region** via a tasty `tokens` prop.
 *
 * ```tsx
 * const preview = useMemo(
 *   () => renderColorTokens({ hue: 210, scheme: 'dark' }),
 *   [],
 * );
 *
 * <Block tokens={preview} fill="#surface" color="#surface-text">
 *   …renders in the previewed theme, inside a light page…
 * </Block>
 * ```
 *
 * Config fields merge over the *current* palette config, so
 * `renderColorTokens({ scheme: 'dark' })` previews the active theme in dark
 * without restating it. Nothing is applied globally — the live palette is
 * untouched.
 *
 * The legacy aliases are included **by reference** (`'#dark': '#surface-text'`),
 * not resolved: tasty re-declares them on the region, so each `var()` resolves
 * against that region's own overridden value. Resolving them here would instead
 * freeze them to the outer theme's colors.
 *
 * The shadow tokens and the scrollbar colors come along for the same reason: their
 * values embed a palette color (`$card-shadow` → `#shadow-md`, `#scrollbar-thumb`
 * → `#text.5`). They are declared on `<Root>`, so CSS has already substituted the
 * outer theme's colors into them by the time a region inherits — re-declaring them
 * here is what lets them re-resolve.
 *
 * Not included: typography, spacing, sizes and layout. Nothing in their values
 * references a color, so a region inherits them from `<Root>` unchanged.
 *
 * The result is memoized for the last config rendered, but callers driving this
 * from state should still `useMemo` — a rebuild resolves the whole palette.
 */
export function renderColorTokens(options?: RenderPaletteOptions): Tokens {
  return {
    ...renderPaletteTokens(options),
    ...(LEGACY_ALIASES as Tokens),
    ...(CONTEXT_TOKENS as Tokens),
    ...(COLOR_DEPENDENT_TOKENS as Tokens),
  };
}
