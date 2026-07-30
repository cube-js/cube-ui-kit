import { glaze } from '@tenphi/glaze';

import { lazyStyles } from './lazy-styles';

import type { ColorMap } from '@tenphi/glaze';
import type { Styles } from '@tenphi/tasty';

/**
 * Glaze-generated color palette for the Cube UI Kit.
 *
 * Produces light, dark, and high-contrast color variants from a single
 * source of truth. Every color token is emitted as a tasty state map:
 *
 *   '#surface': { '': 'oklch(...)', '@dark': 'oklch(...)', '@hc': 'oklch(...)' }
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

// Relative tone ramp from a white surface.
// Tone is a contrast-uniform 0–100 scale (OKHST). A relative tone delta of -N
// yields a fixed WCAG contrast step against the base regardless of where the
// base sits on the scale. These constants form the primary text ramp; the
// surface-2 / surface-3 variants reuse the same absolute targets via a small
// offset because their bases are shifted down from `surface`.
const TEXT_TONE = -98; // relative tone delta from white surface (~cr 21)
const TEXT_SOFT_TONE = -72; // relative tone delta from white surface (~cr 9)
const TEXT_SOFT2_TONE = -52; // relative tone delta from white surface (~cr 4.5)
const SURFACE_2_TEXT_OFFSET = 2;
const SURFACE_3_TEXT_OFFSET = 4;

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
  darkTone: [14, 95],
  darkDesaturation: 0,
});

// ============================================================================
// Default theme (neutral, primary in palette → exported unprefixed)
// ============================================================================

const defaultTheme = glaze(PURPLE_HUE, SEED_SATURATION);

defaultTheme.colors({
  // ---- Surfaces (neutral, very low saturation) ----
  surface: { tone: 100, saturation: 0.12 },
  'surface-2': {
    base: 'surface',
    tone: '-2',
    saturation: 0.1,
    inherit: false,
  },
  'surface-3': {
    base: 'surface',
    tone: '-4',
    saturation: 0.1,
    inherit: false,
  },
  'surface-4': {
    base: 'surface',
    tone: '-6',
    saturation: 0.1,
    inherit: false,
  },

  // ---- Text on surfaces ----
  // Tone is the contrast-uniform OKHST axis, so a relative tone delta directly
  // encodes a WCAG contrast step. `surface-text` sits at tone 2 (a -98 delta
  // from white), giving the same near-black appearance as the legacy `#dark`.
  // We still keep an `['AA','AAA']` contrast floor on every text-on-surface
  // color so a future low-contrast scale can shift the ramp down without ever
  // breaking readability.
  'surface-text': {
    base: 'surface',
    tone: `${TEXT_TONE - 2}`,
    saturation: 0.2,
    contrast: ['AA', 'AAA'],
  },
  'surface-text-soft': {
    base: 'surface',
    tone: `${TEXT_SOFT_TONE - 2}`,
    saturation: 0.2,
    contrast: ['AA', 'AAA'],
    inherit: false,
  },
  'surface-text-soft-2': {
    base: 'surface',
    tone: `${TEXT_SOFT2_TONE - 2}`,
    saturation: 0.2,
    contrast: ['AA', 'AAA'],
    inherit: false,
  },
  'surface-2-text': {
    base: 'surface-2',
    tone: `${TEXT_TONE + SURFACE_2_TEXT_OFFSET}`,
    saturation: 0.2,
    contrast: ['AA', 'AAA'],
    inherit: false,
  },
  'surface-2-text-soft': {
    base: 'surface-2',
    tone: `${TEXT_SOFT_TONE + SURFACE_2_TEXT_OFFSET}`,
    saturation: 0.2,
    contrast: ['AA', 'AAA'],
    inherit: false,
  },
  'surface-3-text': {
    base: 'surface-3',
    tone: `${TEXT_TONE + SURFACE_3_TEXT_OFFSET}`,
    saturation: 0.2,
    contrast: ['AA', 'AAA'],
    inherit: false,
  },
  'surface-3-text-soft': {
    base: 'surface-3',
    tone: `${TEXT_SOFT_TONE + SURFACE_3_TEXT_OFFSET}`,
    saturation: 0.2,
    contrast: ['AA', 'AAA'],
    inherit: false,
  },

  // ---- Other neutral UI primitives (default-only) ----
  border: {
    base: 'surface',
    tone: ['-10', '-20'],
    saturation: 0.175,
  },
  placeholder: {
    base: 'surface',
    tone: '-33',
    saturation: 0.175,
    inherit: false,
  },
  focus: {
    base: 'surface',
    tone: '-29',
    saturation: 0.8625,
    inherit: false,
  },
  disabled: {
    tone: 80.8,
    saturation: 0.4,
    inherit: false,
  },
  // Disabled fill chip + text — both adaptive (mode 'auto') and positioned
  // with relative tone deltas against `surface` so the disabled state has the
  // same perceived intensity in light, dark, and high-contrast schemes. No
  // numeric contrast prop is needed: tone is already on a WCAG-uniform scale.
  //
  // Tone deltas reproduce the legacy palette's disabled appearance exactly:
  // the chip sits ~cr 1.11 vs `surface` (a faint greyed pill for
  // OUTLINE/SECONDARY/item disabled states) and the label ~cr 2.02 vs
  // `surface` — intentionally sub-AA so it reads as disabled while staying the
  // same softness clear/link disabled labels had before. PRIMARY-style buttons
  // use the brand-tinted `accent-disabled-*` variants below instead. Both
  // tokens stay default-only (`inherit: false`) — colored themes inherit their
  // own disabled chip via the accent variants.
  'disabled-surface': {
    base: 'surface',
    tone: '-3.5',
    saturation: 0.2,
    inherit: false,
  },
  'disabled-surface-text': {
    base: 'surface',
    tone: '-23',
    saturation: 0.3,
    inherit: false,
  },

  // Fixed-mode "always dark" surface for elements that intentionally stay
  // inverted regardless of scheme (tooltips, code blocks, popovers with their
  // own dark theme, etc.). `mode: 'fixed'` bypasses the dark-scheme inversion
  // so the color reads as a dark surface in light, dark, and high-contrast.
  // Pair with `#white` (built-in) for foreground text.
  'surface-inverse': {
    tone: 12,
    saturation: 0.475,
    mode: 'fixed',
    inherit: false,
  },

  // ---- Accent system (theme-aware, inherited by colored themes) ----
  // Everything here is anchored to a fixed white "accent-surface-text" via
  // `mode: 'fixed'` + relative tone deltas, so accent colors stay visually
  // consistent across light/dark/high-contrast schemes (the brand color does
  // not flip). The solid fills are white-text-on-brand backgrounds, so they
  // keep an `['AA','AAA']` contrast floor even though the chosen tone deltas
  // already exceed it. This leaves room for a future low-contrast scale.
  'accent-surface-text': { tone: 100, mode: 'fixed' },
  'accent-surface': {
    base: 'accent-surface-text',
    tone: '-49',
    contrast: ['AA', 'AAA'],
    mode: 'fixed',
  },
  'accent-surface-2': {
    base: 'accent-surface-text',
    tone: '-52',
    contrast: ['AA', 'AAA'],
    mode: 'fixed',
  },
  'accent-surface-3': {
    base: 'accent-surface-text',
    tone: '-55',
    contrast: ['AA', 'AAA'],
    mode: 'fixed',
  },
  // Hover variant of `accent-surface` — a *fixed*-mode darker shade used as
  // the hover fill for solid PRIMARY-type buttons. Anchored to the same
  // accent-surface-text so it stays in the same hue family. The relative tone
  // lands a few steps darker than the pressed state in both schemes.
  'accent-surface-hover': {
    base: 'accent-surface-text',
    tone: '-58',
    contrast: ['AA', 'AAA'],
    mode: 'fixed',
  },
  // Border for accent surfaces — a small relative tone step away from the
  // brand fill so it stays in the brand hue family and does not flip in dark
  // mode. No contrast prop needed; the delta is chosen directly on the tone
  // scale.
  'accent-surface-border': {
    base: 'accent-surface',
    tone: '+13',
    mode: 'fixed',
  },
  // Opaque stand-in for the BASE selected fill used by outline / outline-2 /
  // clear Item types (`#surface|#surface-2|#surface-3` + `#accent-surface.09`).
  // Anchors `accent-text` contrast. `value: 9` matches the `.09` alpha overlay;
  // `space: 'srgb'` approximates CSS two-layer compositing. Inherited so
  // colored themes re-resolve against their own `surface` + `accent-surface`
  // (default `surface-2`/`surface-3` are `inherit: false` and can't be the mix
  // base). Primary's tinted `surface` makes this slightly harder than default
  // clear-selected, covering outline / outline-2 selected fills as well.
  'accent-selected-fill': {
    type: 'mix',
    base: 'surface',
    target: 'accent-surface',
    value: 9,
    space: 'srgb',
  },
  // Stronger brand text for HOVERED selected outline/clear labels and LINK
  // hover. Same anchor + preferred tone as `accent-text-soft`, but a higher
  // `contrast: { wcag: [6, 7] }` floor against `accent-selected-fill` so it
  // reads as a clear step up from the soft rest color while staying saturated
  // (a bare `AAA`/`7` floor over-darkens light and desaturates dark). The HC
  // pair keeps it at/above the soft variant (which auto-promotes AA→AAA in HC).
  // `mode: 'auto'` (default) keeps dark-mode text readable on dark surfaces.
  'accent-text': {
    base: 'accent-selected-fill',
    tone: '-49',
    saturation: 1,
    contrast: [6, 11],
  },
  // Rest brand text for selected outline/clear labels and LINK base color.
  // Anchored to `accent-selected-fill` with `contrast: 'AA'` — the measured
  // floor for every BASE state of those Item types (surface / outline /
  // outline-2 / clear selected fills). Sits visibly less prominent than
  // `accent-text` (lighter in light, darker in dark) so the rest→hover
  // intensify is real.
  'accent-text-soft': {
    base: 'accent-selected-fill',
    tone: '-49',
    saturation: 1,
    contrast: ['AA', 'AAA'],
  },
  'accent-icon': {
    base: 'surface',
    tone: '-38',
    saturation: 0.9375,
  },

  // Brand-tinted disabled chip + label for PRIMARY-style buttons (solid brand
  // fill). The chip is scheme-symmetric (`mode: 'fixed'`) so the muted state
  // reads the same weight in light/dark/HC; saturation is bumped so it stays
  // identifiable as a muted brand color.
  //
  // The label rides the extreme away from the chip (`tone: 'max'`, ~cr 1.7):
  // deliberately faint, so it reads as disabled rather than as live text.
  // `'max'` is the authored intent — it was temporarily hand-approximated as a
  // relative `tone: '+15'` with `autoFlip: false`, because Glaze < 1.2.0
  // re-mapped the extreme through the dark tone window, compressing the
  // base-to-extreme span and dropping the dark label's contrast. Glaze 1.2.0
  // (tenphi/glaze#82) instead replays the light scheme's base→extreme tone
  // shift against the base's resolved dark tone — same-signed under
  // `mode: 'fixed'` — so `'max'` holds its intended separation in every scheme
  // and the approximation is no longer needed. Inherited per theme.
  //
  // The special theme keeps its own relative `+18` pair: its `surface` is a
  // fixed dark tone, so an extreme there would resolve to white and read as
  // live text rather than disabled.
  'accent-disabled-surface': {
    base: 'surface',
    tone: '-13',
    saturation: 0.5,
    mode: 'fixed',
  },
  'accent-disabled-surface-text': {
    base: 'accent-disabled-surface',
    tone: 'max',
    saturation: 0.4,
    mode: 'fixed',
  },

  // ---- Code syntax highlighting (PrismCode) ----
  // A small palette of *adaptive* colored tokens for syntax highlighting.
  // Each token is anchored to `surface` with a relative tone plus an `['AA',
  // 'AAA']` readability floor. Hues mirror the long-standing PrismCode
  // reference (pink keywords / pink functions / orange strings / green numbers /
  // gray comments). `code-attribute` keeps a cyan hue for HTML attribute names /
  // CSS properties / selectors; HTML/XML tag names use `code-keyword`. Diff
  // insertion / deletion re-use the existing `success-*` / `danger-*` ramps.
  'code-comment': {
    base: 'surface',
    hue: 280,
    saturation: 0.1,
    tone: '-50',
    contrast: ['AA', 'AAA'],
    inherit: false,
  },
  'code-punctuation': {
    base: 'surface',
    hue: 348,
    saturation: 0.4,
    tone: '-50',
    contrast: ['AA', 'AAA'],
    inherit: false,
  },
  'code-keyword': {
    base: 'surface',
    hue: 348,
    saturation: 1,
    tone: '-54',
    contrast: ['AA', 'AAA'],
    inherit: false,
  },
  'code-string': {
    base: 'surface',
    hue: PURPLE_HUE,
    saturation: 1,
    tone: '-50',
    contrast: ['AA', 'AAA'],
    inherit: false,
  },
  'code-number': {
    base: 'surface',
    hue: 156,
    saturation: 0.9,
    tone: '-50',
    contrast: ['AA', 'AAA'],
    inherit: false,
  },
  'code-function': {
    base: 'surface',
    hue: 348,
    saturation: 1,
    tone: '-54',
    contrast: ['AA', 'AAA'],
    inherit: false,
  },
  'code-attribute': {
    base: 'surface',
    hue: 200,
    saturation: 1,
    tone: '-50',
    contrast: ['AA', 'AAA'],
    inherit: false,
  },

  // ---- Loading-animation cube faces ----
  // Decorative gradient steps from `surface` to a saturated mid-tone. Tone
  // deltas are chosen directly on the contrast-uniform scale; no contrast prop
  // is needed for a non-text decorative element.
  'loading-face-1': {
    base: 'surface',
    tone: '-2',
    saturation: 0.3,
    inherit: false,
  },
  'loading-face-2': {
    base: 'surface',
    tone: '-9',
    saturation: 0.62,
    inherit: false,
  },
  'loading-face-3': {
    base: 'surface',
    tone: '-21',
    saturation: 0.66,
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
  overlay: { tone: 10, opacity: 0.5, inherit: false },
});

// ============================================================================
// Colored themes
// ============================================================================

const TINTED_SURFACE_SATURATION = 0.2;
const TINTED_SURFACE_TONE_OFFSET = 2;

/**
 * Per-colored-theme overrides on top of `defaultTheme`:
 *   - `surface` — bumped saturation so the banner bg is visibly tinted.
 *   - `border`  — bumped saturation so OUTLINE-variant borders pick up the
 *     theme hue (used by `#<theme>-border` in `item-themes.ts`). Mirrors the
 *     default-theme `border` shape (`base: 'surface'`, tone window) but
 *     with higher saturation. Glaze's `extend({ colors })` redefines each
 *     listed color from scratch, so we restate the full definition here.
 */
const TINTED_SURFACE_OVERRIDE: ColorMap = {
  surface: {
    tone: 100 - TINTED_SURFACE_TONE_OFFSET,
    saturation: TINTED_SURFACE_SATURATION,
  },
  border: {
    base: 'surface',
    tone: ['-10', '-20'],
    saturation: 0.5,
  },
  'surface-text': {
    base: 'surface',
    tone: `${TEXT_TONE - TINTED_SURFACE_TONE_OFFSET}`,
    saturation: 0.25,
    contrast: ['AA', 'AAA'],
  },
  'surface-text-soft': {
    base: 'surface',
    tone: `${TEXT_SOFT_TONE - TINTED_SURFACE_TONE_OFFSET}`,
    saturation: 0.25,
    contrast: ['AA', 'AAA'],
  },
  'surface-text-soft-2': {
    base: 'surface',
    tone: `${TEXT_SOFT2_TONE - TINTED_SURFACE_TONE_OFFSET}`,
    saturation: 0.25,
    contrast: ['AA', 'AAA'],
  },
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
// Special theme (fixed-mode, NOT inherited from defaultTheme)
// ============================================================================

/**
 * Standalone theme for `special`-variant components (hero CTAs, banners, etc.)
 * that intentionally sit on a dark surface regardless of the active scheme.
 *
 * Every token here is `mode: 'fixed'` so the resolved value is identical in
 * light, dark, and high-contrast. The shape is purpose-built (not a full
 * mirror of `defaultTheme`) — only what `SPECIAL_*_STYLES` in
 * `src/data/item-themes.ts` consumes is emitted.
 *
 * Token rundown:
 *   - `surface` — dark L≈12 backdrop (same value as `#surface-inverse`).
 *   - `accent-surface` / `accent-surface-2` / `accent-surface-3` —
 *     brand-purple PRIMARY fill ramp (default → hover → pressed). Mirrors
 *     the `#primary-accent-surface` / `-2` / `-3` ramp on the colored
 *     themes so `SPECIAL_PRIMARY_STYLES.fill` can use the same shape.
 *   - `accent-surface-hover` — legacy alias kept around for the
 *     `#special-hover` color shortcut in `src/tokens/colors.ts`. Item
 *     themes themselves no longer reference it.
 *   - `accent-surface-text` — fixed white (= built-in `#white`), exposed
 *     for explicit references.
 *   - `accent-text` — dark-purple foreground readable on white. Used as
 *     CLEAR-variant text on the always-white pill, and as the
 *     pressed/focused border on the brand-purple primary fill. Matches the
 *     legacy `#fixed-primary-text` alias (= `#primary-accent-surface-hover`).
 *   - `accent-disabled-surface` / `accent-disabled-surface-text` —
 *     brand-tinted disabled chip + label, positioned with relative tone
 *     deltas against the fixed dark `surface` so the disabled state is
 *     scheme-symmetric.
 */
const specialTheme = glaze(PURPLE_HUE, SEED_SATURATION);

specialTheme.colors({
  surface: { tone: 12, saturation: 0.475, mode: 'fixed' },

  'accent-surface-text': { tone: 100, mode: 'fixed' },
  'accent-surface': {
    base: 'accent-surface-text',
    tone: '-49',
    contrast: ['AA', 'AAA'],
    mode: 'fixed',
  },
  'accent-surface-2': {
    base: 'accent-surface-text',
    tone: '-52',
    contrast: ['AA', 'AAA'],
    mode: 'fixed',
  },
  'accent-surface-3': {
    base: 'accent-surface-text',
    tone: '-55',
    contrast: ['AA', 'AAA'],
    mode: 'fixed',
  },
  'accent-surface-border': {
    base: 'accent-surface',
    tone: '+13',
    mode: 'fixed',
  },
  'accent-surface-hover': {
    base: 'accent-surface-text',
    tone: '-58',
    contrast: ['AA', 'AAA'],
    mode: 'fixed',
  },
  'accent-text': {
    base: 'accent-surface-text',
    tone: '-58',
    contrast: ['AA', 'AAA'],
    mode: 'fixed',
  },

  'accent-disabled-surface': {
    base: 'surface',
    tone: '+4',
    saturation: 0.5,
    mode: 'fixed',
  },
  'accent-disabled-surface-text': {
    base: 'accent-disabled-surface',
    tone: '+18',
    saturation: 0.4,
    mode: 'fixed',
  },
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
  special: specialTheme,
});

// ============================================================================
// Tasty-formatted token export
// ============================================================================

/**
 * Resolve Glaze palette tokens against the **live** `glaze` global config.
 *
 * Memoized on first call so subsequent reads are free. Resolution is deferred
 * (not done at module import) so host apps can call `glaze.configure(...)`
 * after importing `@cube-dev/ui-kit` and still affect these tokens — as long as
 * configure runs before the first `getPaletteTokens()` / `<Root>` paint.
 *
 * Keys use `#name` syntax; values are state maps:
 *   '#surface': { '': 'oklch(...)', '@dark': 'oklch(...)', '@hc': 'oklch(...)' }
 */
let paletteTokensCache: Styles | null = null;

export function getPaletteTokens(): Styles {
  if (!paletteTokensCache) {
    paletteTokensCache = palette.tasty({
      prefix: {
        default: '',
        primary: 'primary-',
        purple: 'purple-',
        success: 'success-',
        danger: 'danger-',
        warning: 'warning-',
        note: 'note-',
        special: 'special-',
      },
      format: 'oklch',
    }) as Styles;
  }
  return paletteTokensCache;
}

/**
 * Lazy proxy of {@link getPaletteTokens}. Prefer `getPaletteTokens()` in new
 * code. First property / enumeration access resolves against the live glaze
 * config (same memo as the getter).
 */
export const PALETTE_TOKENS: Styles = lazyStyles(getPaletteTokens);

/** Re-exported for advanced consumers / tests. */
export {
  defaultTheme,
  primaryTheme,
  successTheme,
  dangerTheme,
  warningTheme,
  noteTheme,
  specialTheme,
  palette,
};
