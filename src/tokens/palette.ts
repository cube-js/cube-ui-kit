import { glaze } from '@tenphi/glaze';

import type { ColorMap } from '@tenphi/glaze';
import type { Styles } from '@tenphi/tasty';

/**
 * Glaze-generated color palette for the Cube UI Kit.
 *
 * Produces light, dark, and high-contrast color variants from a single
 * source of truth. Every color token is emitted as a tasty state map:
 *
 *   '#surface': { '': 'okhsl(...)', '@dark': 'okhsl(...)', '@hc': 'okhsl(...)' }
 *
 * The `@dark` and `@hc` state aliases are wired up globally in
 * `src/components/Root.tsx` (see `setGlobalPredefinedStates`).
 */

// ============================================================================
// Hue / saturation seeds
// ============================================================================

const PURPLE_HUE = 280.3;
const SUCCESS_HUE = 156.9;
const DANGER_HUE = 23.1;
const WARNING_HUE = 84.3;
const NOTE_HUE = 302.3;

/** Seed saturation; per-color saturation factors below are 0–1 of this seed. */
const SEED_SATURATION = 80;

// ============================================================================
// Global Glaze configuration
// ============================================================================

glaze.configure({
  states: {
    dark: '@dark',
    highContrast: '@hc',
  },
  modes: {
    dark: true,
    highContrast: true,
  },
});

// ============================================================================
// Default theme (neutral, primary in palette → exported unprefixed)
// ============================================================================

const defaultTheme = glaze(PURPLE_HUE, SEED_SATURATION);

defaultTheme.colors({
  // ---- Surfaces (neutral, very low saturation) ----
  surface: { lightness: 100, saturation: 0.26 },
  'surface-2': {
    base: 'surface',
    lightness: '-2',
    saturation: 0.26,
    inherit: false,
  },
  'surface-3': {
    base: 'surface',
    lightness: '-4',
    saturation: 0.26,
    inherit: false,
  },

  // ---- Text on surfaces ----
  // Each token uses a tiny relative `lightness` ('-1') purely as a *directional
  // hint* to the contrast solver (search the darker branch in light mode → the
  // lighter branch in dark mode, since the base inverts). The actual lightness
  // is driven by the numeric `contrast` ratio below, so the perceived contrast
  // is identical in light and dark schemes (no more "barely meets AAA in dark
  // while light sits at ~13"). The HC pair `[normal, highContrast]` matches
  // today's achieved-light-mode ratios, so visual parity is preserved while
  // the dark scheme is brought up to the same level.
  'surface-text': {
    base: 'surface',
    lightness: '-1',
    saturation: 0.475,
    contrast: [13, 17],
  },
  'surface-text-soft': {
    base: 'surface',
    lightness: '-1',
    saturation: 0.375,
    contrast: [7, 9],
    inherit: false,
  },
  'surface-text-soft-2': {
    base: 'surface',
    lightness: '-1',
    saturation: 0.24,
    contrast: [3.9, 4.7],
    inherit: false,
  },
  'surface-2-text': {
    base: 'surface-2',
    lightness: '-1',
    saturation: 0.475,
    contrast: [13, 17],
    inherit: false,
  },
  'surface-2-text-soft': {
    base: 'surface-2',
    lightness: '-1',
    saturation: 0.375,
    contrast: [7, 9],
    inherit: false,
  },
  'surface-3-text': {
    base: 'surface-3',
    lightness: '-1',
    saturation: 0.475,
    contrast: [13, 17],
    inherit: false,
  },
  'surface-3-text-soft': {
    base: 'surface-3',
    lightness: '-1',
    saturation: 0.375,
    contrast: [7, 9],
    inherit: false,
  },

  // ---- Other neutral UI primitives (default-only) ----
  border: {
    base: 'surface',
    lightness: ['-10', '-20'],
    saturation: 0.175,
    inherit: false,
  },
  placeholder: {
    base: 'surface',
    lightness: 67,
    saturation: 0.175,
    inherit: false,
  },
  focus: {
    base: 'surface',
    lightness: 71,
    saturation: 0.8625,
    inherit: false,
  },
  disabled: {
    lightness: 80.8,
    saturation: 0.4,
    inherit: false,
  },

  // Fixed-mode "always dark" surface for elements that intentionally stay
  // inverted regardless of scheme (tooltips, code blocks, popovers with their
  // own dark theme, etc.). `mode: 'fixed'` bypasses the dark-scheme inversion
  // so the color reads as a dark surface in light, dark, and high-contrast.
  // Pair with `#white` (built-in) for foreground text.
  'surface-inverse': {
    lightness: 12,
    saturation: 0.475,
    mode: 'fixed',
    inherit: false,
  },

  // ---- Accent system (theme-aware, inherited by colored themes) ----
  // Everything here is anchored to a fixed white "accent-surface-text" via
  // `mode: 'fixed'` + small *relative* lightness offsets, so accent colors
  // stay visually consistent across light/dark/high-contrast schemes (the
  // brand color does not flip). Contrast targets are explicit numeric ratios
  // — using 'AA'/'AAA' here would let the solver push the color far away
  // from its anchor in dark schemes, breaking the visual relationship
  // between `accent-surface` and `accent-text` (e.g. solid button bg vs.
  // its hover bg). All accent variants therefore share the same shape.
  'accent-surface-text': { lightness: 100, mode: 'fixed' },
  'accent-surface': {
    base: 'accent-surface-text',
    lightness: '-1',
    contrast: [4.5, 7],
    mode: 'fixed',
  },
  'accent-surface-2': {
    base: 'accent-surface-text',
    lightness: '-1',
    contrast: [4.8, 7.5],
    mode: 'fixed',
  },
  'accent-surface-3': {
    base: 'accent-surface-text',
    lightness: '-1',
    contrast: [5.2, 8],
    mode: 'fixed',
  },
  // Hover variant of `accent-surface` — a *fixed*-mode darker shade used as
  // the hover fill for solid PRIMARY-type buttons. Anchored to the same
  // accent-surface-text so it stays in the same hue family. Numeric contrast
  // is tuned so the hover shade lands near today's light-mode "darker
  // purple" (≈L=44 light / ≈L=40 dark), giving a visible darkening in BOTH
  // schemes (~7–9 OKHSL lightness points below `accent-surface`). Using a
  // dedicated fixed token avoids the trap of reusing `accent-text` (which
  // is `mode: 'auto'` and inverts direction in dark mode).
  'accent-surface-hover': {
    base: 'accent-surface-text',
    lightness: '-1',
    contrast: [6, 8.5],
    mode: 'fixed',
  },
  // Saturated foreground variants. Anchored to `surface` (NOT `accent-surface`)
  // with `mode: 'auto'` so they adapt with the scheme: in dark mode the solver
  // pushes them lighter to stay readable on the dark surface. Anchoring to the
  // brand fill instead would only enforce contrast against that fill — leaving
  // the dark-mode color washed out against the actual surface they sit on
  // (e.g. SECONDARY button labels). The numeric `contrast` value is the
  // achieved-light-mode ratio under the previous chain, so the visual
  // appearance in light mode is preserved while dark mode is brought up to
  // the same perceived contrast.
  'accent-text': {
    base: 'surface',
    lightness: '-1',
    saturation: 1,
    contrast: [6.4, 10],
  },
  'accent-icon': {
    base: 'surface',
    lightness: '-1',
    saturation: 0.9375,
    contrast: [3.2, 5],
  },

  // ---- Code syntax highlighting (PrismCode) ----
  // A small palette of *adaptive* colored tokens for syntax highlighting.
  // Each token: `mode: 'auto'` (default) + `base: 'surface'` + a numeric
  // `contrast` floor of 4.5 (= WCAG AA) so every token reads against `#surface`
  // in light, dark, and high-contrast schemes alike. Hues mirror the
  // long-standing PrismCode reference (pink keywords / pink functions /
  // orange strings / green numbers / gray comments). `code-attribute` keeps
  // a cyan hue for HTML attribute names / CSS properties / selectors — not
  // exercised in the SQL reference but useful in other languages. Diff
  // insertion / deletion re-use the existing `success-*` / `danger-*` ramps.
  'code-comment': {
    base: 'surface',
    hue: 280,
    saturation: 0.1,
    lightness: '-1',
    contrast: [4.5, 7],
    inherit: false,
  },
  'code-punctuation': {
    base: 'surface',
    hue: 348,
    saturation: 0.4,
    lightness: '-1',
    contrast: [4.5, 7],
    inherit: false,
  },
  'code-keyword': {
    base: 'surface',
    hue: 348,
    saturation: 1,
    lightness: '-1',
    contrast: [5, 7.5],
    inherit: false,
  },
  'code-string': {
    base: 'surface',
    hue: PURPLE_HUE,
    saturation: 1,
    lightness: '-1',
    contrast: [4.5, 7],
    inherit: false,
  },
  'code-number': {
    base: 'surface',
    hue: 156,
    saturation: 0.9,
    lightness: '-1',
    contrast: [4.5, 7],
    inherit: false,
  },
  'code-function': {
    base: 'surface',
    hue: 348,
    saturation: 1,
    lightness: '-1',
    contrast: [5, 7.5],
    inherit: false,
  },
  'code-attribute': {
    base: 'surface',
    hue: 200,
    saturation: 1,
    lightness: '-1',
    contrast: [4.5, 7],
    inherit: false,
  },

  // ---- Shadows (default-only) ----
  'shadow-sm': {
    type: 'shadow',
    bg: 'surface',
    fg: 'surface-text',
    intensity: 5,
    inherit: false,
  },
  'shadow-md': {
    type: 'shadow',
    bg: 'surface',
    fg: 'surface-text',
    intensity: 10,
    inherit: false,
  },
  'shadow-lg': {
    type: 'shadow',
    bg: 'surface',
    fg: 'surface-text',
    intensity: 15,
    inherit: false,
  },

  // Backdrop overlay (translucent)
  overlay: { lightness: 10, opacity: 0.5, inherit: false },
});

// ============================================================================
// Colored themes
// ============================================================================

/** Override `surface` per colored theme so the banner bg is visibly tinted. */
const TINTED_SURFACE_OVERRIDE: ColorMap = {
  surface: { lightness: 97, saturation: 0.75 },
};

const primaryTheme = defaultTheme.extend({
  colors: TINTED_SURFACE_OVERRIDE,
});
const successTheme = defaultTheme.extend({
  hue: SUCCESS_HUE,
  colors: TINTED_SURFACE_OVERRIDE,
});
const dangerTheme = defaultTheme.extend({
  hue: DANGER_HUE,
  colors: TINTED_SURFACE_OVERRIDE,
});
const warningTheme = defaultTheme.extend({
  hue: WARNING_HUE,
  colors: TINTED_SURFACE_OVERRIDE,
});
const noteTheme = defaultTheme.extend({
  hue: NOTE_HUE,
  colors: TINTED_SURFACE_OVERRIDE,
});

// ============================================================================
// Palette composition
// ============================================================================

/**
 * Theme map for the palette.
 *
 * `purple` is the legacy alias for `primary` and resolves to identical tokens
 * (same theme instance, different prefix → no token-value collision).
 *
 * `default` is emitted with an empty prefix (custom map below), so its tokens
 * appear unprefixed (`#surface`, `#border`, …). All other themes are prefixed
 * with `<themeName>-`.
 */
const palette = glaze.palette({
  default: defaultTheme,
  primary: primaryTheme,
  purple: primaryTheme,
  success: successTheme,
  danger: dangerTheme,
  warning: warningTheme,
  note: noteTheme,
});

// ============================================================================
// Tasty-formatted token export
// ============================================================================

/**
 * All Glaze-generated color tokens as a tasty `Styles` map.
 *
 * Keys use `#name` syntax; values are state maps:
 *   '#surface': { '': 'okhsl(...)', '@dark': 'okhsl(...)', '@hc': 'okhsl(...)' }
 *
 * Spread into `useGlobalStyles('body', tokens)` (already wired through
 * `src/components/GlobalStyles.tsx`).
 */
export const PALETTE_TOKENS: Styles = palette.tasty({
  prefix: {
    default: '',
    primary: 'primary-',
    purple: 'purple-',
    success: 'success-',
    danger: 'danger-',
    warning: 'warning-',
    note: 'note-',
  },
}) as Styles;

/** Re-exported for advanced consumers / tests. */
export {
  defaultTheme,
  primaryTheme,
  successTheme,
  dangerTheme,
  warningTheme,
  noteTheme,
  palette,
};
