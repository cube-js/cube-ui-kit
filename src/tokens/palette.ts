import { glaze } from '@tenphi/glaze';

import { lazyStyles } from './lazy-styles';
import {
  getPaletteConfig,
  getPaletteVersion,
  resolvePaletteConfig,
} from './palette-config';

import type {
  ColorMap,
  GlazeConfigOverride,
  GlazePalette,
  GlazeTheme,
} from '@tenphi/glaze';
import type { Styles, Tokens } from '@tenphi/tasty';
import type { PaletteConfig, ResolvedPaletteConfig } from './palette-config';

/** Which resolved scheme variant {@link renderPaletteTokens} should return. */
export interface RenderPaletteOptions extends PaletteConfig {
  /** Color scheme to resolve. Default: `'light'`. */
  scheme?: 'light' | 'dark';
  /** Resolve the high-contrast variant of that scheme. Default: `false`. */
  highContrast?: boolean;
}

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
 *
 * This module owns the *recipe* — which colors exist and how each one is
 * positioned relative to its base. The *seeds* it is built from (hue,
 * saturation, pastel, contrast level) live in `./palette-config.ts` and are
 * tunable at runtime; `buildPalette()` below is a pure function of them.
 */

// ============================================================================
// Recipe constants
// ============================================================================

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

// Syntax highlighting keeps its own fixed hue reference (see the `code-*` block
// below). This is the kit's default brand hue, frozen as a literal: string
// literals were historically purple because the brand is, but they must not
// follow a re-seeded brand hue — a green brand would collide `code-string` with
// `code-number` (156°) and make strings and numbers indistinguishable.
const CODE_STRING_HUE = 280.3;

/**
 * Saturation factor of the neutral `surface`.
 *
 * Shared with the code theme, which mirrors `surface` to solve its contrast floors
 * against the real page background — the two must not drift apart.
 */
const SURFACE_SATURATION = 0.12;

const TINTED_SURFACE_SATURATION = 0.2;
const TINTED_SURFACE_TONE_OFFSET = 2;

/**
 * Contrast floors for a pinned brand color: `[normal, highContrast]`.
 *
 * `3` is WCAG's non-text floor — enough that the button reads as a shape against the
 * page, and low enough that most brands clear it untouched. It is a FLOOR and not a
 * target: a brand already at 5:1 or 17:1 is emitted exactly as given. Lower would let a
 * fill vanish into the page; the shipped `['AA','AAA']` is too high to survive a light
 * brand at all (it crushes `#FFD400` from tone 88 to 50).
 *
 * The high-contrast entry stays at AAA regardless. Fidelity to a requested color is a
 * preference; the high-contrast tier is not — it exists for users who cannot read the
 * normal one, and it is selected by `prefers-contrast: more` or an explicit
 * `data-contrast="high"`, so anyone seeing it has asked for separation over brand.
 * Note the pair also means an unreachable HC target is a real possibility for a very
 * light brand, and Glaze pins it to the nearest tone and warns rather than failing.
 */
const ACCENT_FILL_CONTRAST: [number, number] = [3, 7];

/**
 * Floors for the two brand TEXT tokens: rest, then hover.
 *
 * The normal entries relax so a vivid brand can be the actual link color. The
 * high-contrast entries do not — same reasoning as {@link ACCENT_FILL_CONTRAST} — and
 * they stay one step apart so the rest→hover intensify survives the tier that needs it
 * most. A single shared HC number would collapse the pair onto one color: both would
 * simply solve to it.
 *
 * The hover's `9` is measured, not chosen for roundness. It is the highest target
 * reachable across `#7A4DBF` `#EF4444` `#0EA5E9` `#22C55E` `#FFD400` `#111827` in both
 * high-contrast schemes, and it holds a ~2.0 gap over the rest color in every one. The
 * shipped `11` is not usable here: 11:1 from a fully saturated hue against a chromatic
 * `accent-selected-fill` is unreachable, and `#FFD400` in dark high contrast pins to
 * pure black — a hover link *less* readable than its rest state, at 2.23 against 7.07.
 * The shipped palette can afford 11 because its fill is a desaturated mix; a pinned
 * brand color is not.
 */
const ACCENT_TEXT_CONTRAST: [number, number] = [3, 7];
const ACCENT_TEXT_HOVER_CONTRAST: [number, number] = [4.5, 9];

/**
 * Tone steps of the brand fill ramp, measured from `accent-surface`.
 *
 * They reproduce the white-anchored `-49 / -52 / -55 / -58` ladder exactly once the
 * fill is pinned, because those four deltas share an anchor and differ by 3 / 6 / 9.
 */
const ACCENT_RAMP = {
  surface2: '-3',
  surface3: '-6',
  hover: '-9',
} as const;

/**
 * How far the hover brand text sits past the rest one, in tone.
 *
 * Both are pinned to the caller's tone otherwise, and a pair at the same tone behind
 * the same floor resolves to one color — which would silently delete the rest→hover
 * intensify that `accent-text` exists for. Tone is contrast-uniform, so one step is
 * one step in either scheme.
 */
const ACCENT_TEXT_HOVER_STEP = 6;

/**
 * The caller's brand color, or `null` for the shipped derivation.
 *
 * Carries the literal — which is what Glaze's `from` consumes — alongside its tone,
 * because {@link ACCENT_TEXT_HOVER_STEP} needs the number to compute a step past it.
 */
type AccentSeed = { color: string; tone: number } | null;

/**
 * Opaque stand-in for the BASE selected fill used by outline / outline-2 / clear Item
 * types (`#surface|#surface-2|#surface-3` + `#accent-surface.09`).
 *
 * Anchors the `accent-text*` contrast. `value: 9` matches the `.09` alpha overlay;
 * `space: 'srgb'` approximates CSS two-layer compositing. Inherited so colored themes
 * re-resolve against their own `surface` + `accent-surface` (default `surface-2` /
 * `surface-3` are `inherit: false` and can't be the mix base). Primary's tinted
 * `surface` makes this slightly harder than default clear-selected, covering
 * outline / outline-2 selected fills as well.
 *
 * The same in both accent arrangements — it is defined by its two ends, and both of
 * those move with the seed on their own.
 */
const ACCENT_SELECTED_FILL: ColorMap = {
  'accent-selected-fill': {
    type: 'mix',
    base: 'surface',
    target: 'accent-surface',
    value: 9,
    space: 'srgb',
  },
};

/**
 * Syntax highlighting for `PrismCode`, as its own theme.
 *
 * A small palette of *adaptive* colored tokens. Each one is anchored to `surface`
 * with a relative tone plus an `['AA','AAA']` readability floor, so it stays legible
 * in light, dark and high contrast. Hues mirror the long-standing PrismCode
 * reference (pink keywords / pink functions / purple strings / green numbers / gray
 * comments); `code-attribute` keeps cyan for HTML attribute names, CSS properties
 * and selectors, while HTML/XML tag names reuse `code-keyword`. Diff insertion and
 * deletion reuse the `success-*` / `danger-*` ramps instead.
 *
 * Three things are deliberately static here. Every hue is an absolute literal, so a
 * re-seeded brand cannot rotate the syntax palette — a green brand would otherwise
 * collide `code-string` with `code-number` (156°). These factors are relative to
 * the *code* theme's own seed (`themes.code.saturation`), not the palette-level one,
 * so tuning the app's saturation cannot wash out a code block. And `pastel` is held
 * off here whatever the palette does, for the same reason: it lowers the chroma
 * ceiling hard enough to take `code-keyword` from ~0.19 to ~0.07, which is the
 * difference between distinguishable syntax and mud. Between them, these mean the
 * emitted `code-*` values are a function of the code saturation alone.
 *
 * That separate seed is the only reason these live outside the default theme: a
 * theme colour can never exceed its own seed, and four of these sit at factor `1.0`,
 * so they could not hold their chroma inside a default theme seeded below 80.
 */
const CODE_COLORS: ColorMap = {
  'code-comment': {
    base: 'surface',
    hue: 280,
    saturation: 0.1,
    tone: '-50',
    contrast: ['AA', 'AAA'],
  },
  'code-punctuation': {
    base: 'surface',
    hue: 348,
    saturation: 0.4,
    tone: '-50',
    contrast: ['AA', 'AAA'],
  },
  'code-keyword': {
    base: 'surface',
    hue: 348,
    saturation: 1,
    tone: '-54',
    contrast: ['AA', 'AAA'],
  },
  'code-string': {
    base: 'surface',
    hue: CODE_STRING_HUE,
    saturation: 1,
    tone: '-50',
    contrast: ['AA', 'AAA'],
  },
  'code-number': {
    base: 'surface',
    hue: 156,
    saturation: 0.9,
    tone: '-50',
    contrast: ['AA', 'AAA'],
  },
  'code-function': {
    base: 'surface',
    hue: 348,
    saturation: 1,
    tone: '-54',
    contrast: ['AA', 'AAA'],
  },
  'code-attribute': {
    base: 'surface',
    hue: 200,
    saturation: 1,
    tone: '-50',
    contrast: ['AA', 'AAA'],
  },
};

/**
 * Build the standalone theme the `code-*` tokens live in.
 *
 * Its seed is the code saturation, so {@link CODE_COLORS} keeps its authored factors
 * verbatim and resolves identically at any palette saturation. The mirrored `surface`
 * is an implementation detail — it exists only as the contrast base, and is filtered
 * out of the emitted tokens by {@link pickCodeTokens}.
 *
 * `instanceConfig` arrives with `pastel` pinned off, so the mirror is non-pastel too
 * even when the app is. Harmless: at saturation factor 0.12 the pastel ceiling moves
 * the mirror's chroma and leaves its tone — the axis every `code-*` contrast floor is
 * solved against — bit-identical.
 */
function buildCodeTheme(
  config: ResolvedPaletteConfig,
  instanceConfig: GlazeConfigOverride | undefined,
): GlazeTheme {
  const codeSaturation = config.themes.code.saturation;
  const theme = glaze(config.hue, codeSaturation, instanceConfig);

  // Re-express the default theme's `surface` as a factor of the *code* seed, so it
  // resolves to the same colour the code actually sits on. Written as a ratio of
  // seeds so the default config lands on exactly `SURFACE_SATURATION`.
  let mirrorFactor = SURFACE_SATURATION * (config.saturation / codeSaturation);

  if (mirrorFactor > 1) {
    // Only reachable with a code saturation far below the palette's. Glaze would
    // clamp this silently and then solve every contrast floor against the wrong
    // background, so say so.
    // eslint-disable-next-line no-console
    console.warn(
      `[cube-ui-kit] themes.code.saturation (${codeSaturation}) is too low for ` +
        `saturation ${config.saturation}: the mirrored code surface would need a ` +
        `factor of ${mirrorFactor.toFixed(3)}. Clamped to 1; raise the code ` +
        `saturation to keep syntax contrast accurate.`,
    );
    mirrorFactor = 1;
  }

  theme.colors({
    surface: { tone: 100, saturation: mirrorFactor },
    ...CODE_COLORS,
  });

  return theme;
}

/** What {@link buildPalette} produces: the themed palette plus the code theme. */
interface BuiltPalette {
  palette: GlazePalette;
  codeTheme: GlazeTheme;
}

/** Drop the mirrored `surface`, keeping only the `code-*` tokens. */
function pickCodeTokens<T>(tokens: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};

  for (const name of Object.keys(tokens)) {
    if (name.startsWith('code-') || name.startsWith('#code-')) {
      out[name] = tokens[name];
    }
  }

  return out;
}

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

/**
 * Per-colored-theme overrides on top of the default theme:
 *   - `surface` — bumped saturation so the banner bg is visibly tinted.
 *   - `border`  — bumped saturation so OUTLINE-variant borders pick up the
 *     theme hue (used by `#<theme>-border` in `item-themes.ts`). Mirrors the
 *     default-theme `border` shape (`base: 'surface'`, tone window) but
 *     with higher saturation. Glaze's `extend({ colors })` redefines each
 *     listed color from scratch, so we restate the full definition here.
 */
const TINTED_SURFACE_OVERRIDE: ColorMap = {
  surface: {
    tone: [
      100 - TINTED_SURFACE_TONE_OFFSET,
      100 - TINTED_SURFACE_TONE_OFFSET * 2,
    ],
    saturation: TINTED_SURFACE_SATURATION,
  },
  border: {
    base: 'surface',
    tone: ['-10', '-30'],
    saturation: 0.3,
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

/**
 * A tinted surface, a banding step, and text guaranteed to read on both.
 *
 * The recipe behind {@link getColorTheme} in `./color-theme.ts`, which builds
 * one-off themes at runtime from an arbitrary hue. It lives here so it shares
 * `TINTED_SURFACE_SATURATION`, the tone offsets and the text ramp with
 * {@link TINTED_SURFACE_OVERRIDE} above rather than forking them — a runtime tint
 * and a built-in theme's `surface` should be the same colour for the same hue.
 *
 * Three colours, because that is what banded, readable table column needs:
 * `surface` for even rows, `surface-2` one tone step down for odd rows and
 * pinned totals, and `surface-2-text`.
 *
 * The text is anchored to `surface-2`, not `surface`. `surface-2` has the lower
 * contrast headroom in BOTH schemes — a darker background under dark text in
 * light, a lighter one under light text in dark — so solving the floor there
 * clears it on both bands. The neutral ramp's own `surface-2-text` is shaped the
 * same way for the same reason.
 */
export const TINT_RECIPE: ColorMap = {
  surface: {
    tone: [
      100 - TINTED_SURFACE_TONE_OFFSET,
      100 - TINTED_SURFACE_TONE_OFFSET * 2,
    ],
    saturation: TINTED_SURFACE_SATURATION,
  },
  'surface-2': {
    base: 'surface',
    // Mirrors the neutral ramp's step from `surface` to `surface-2`: enough to
    // read as banding down a column, not enough to read as two colours.
    tone: ['-2', '-4'],
    saturation: TINTED_SURFACE_SATURATION,
  },
  'surface-2-text': {
    base: 'surface-2',
    tone: `${TEXT_TONE - TINTED_SURFACE_TONE_OFFSET - SURFACE_2_TEXT_OFFSET}`,
    saturation: 0.25,
    // The whole point: Glaze binary-searches the tone per scheme until the floor
    // is met, so a caller cannot persist an unreadable pair.
    contrast: ['AA', 'AAA'],
  },
  /**
   * The softer step, for a tinted column HEADER.
   *
   * A neutral header is deliberately muted (`HeadRow` publishes `#dark-03`), so
   * a tinted one taking the full-strength body text read markedly darker than
   * the headers either side of it — measured at 16:1 against their 4.9:1. This
   * keeps the two consistent, and the `AA` floor still applies.
   */
  'surface-2-text-soft': {
    base: 'surface-2',
    tone: `${TEXT_SOFT_TONE - TINTED_SURFACE_TONE_OFFSET - SURFACE_2_TEXT_OFFSET}`,
    saturation: 0.25,
    contrast: ['AA', 'AAA'],
  },
};

// ============================================================================
// The accent system
// ============================================================================

/**
 * The brand family, in one of two arrangements.
 *
 * **`null`** — the shipped one, verbatim. Every fill hangs off a fixed white
 * `accent-surface-text` at a relative tone delta behind an `['AA','AAA']` floor, and
 * the text pair hangs off `accent-selected-fill` at `-49`. Those floors are
 * load-bearing rather than decorative: relaxing them moves the shipped `accent-text`
 * light tone from 38.76 to 48.63 and the `accent-surface` high-contrast tone from
 * 36.08 to 51.00. Nothing on this path may change — `palette.test.ts` snapshots it.
 *
 * **A color** — the caller handed us one, and the job is to render *that*. Glaze's
 * `from` takes the value directly: it supplies the hue, the tone, and an absolute
 * saturation that does not answer to the theme seed, and it reproduces the value
 * exactly in the light/normal-contrast variant. The floors drop to
 * {@link ACCENT_FILL_CONTRAST} on top, because anchored the shipped way every accent
 * lands at roughly tone 50 whatever went in, and a 4.5 floor then crushes anything
 * light besides.
 *
 * Two details worth keeping straight:
 *
 * - **The ramp carries no floor.** Re-anchored onto the fill, an `['AA','AAA']` floor
 *   is measured against the *fill* rather than white and collapses all three steps to
 *   near-black. A plain tone step is what the relationship actually is.
 * - **The text pair stays `mode: 'auto'`.** Link text has to invert on a dark page, so
 *   exactness belongs to the fill; the text is a brand-toned companion of it.
 */
function accentFillColors(accent: AccentSeed): ColorMap {
  if (accent == null) {
    return {
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
    };
  }

  return {
    // Still a hard white root, and still the PRIMARY label: every `type="primary"`
    // item in `src/data/item-themes.ts` writes `#white` directly. That is exactly what
    // ACCENT_FILL_CONTRAST protects — the fill is held far enough off the page that a
    // white label keeps working on it.
    'accent-surface-text': { tone: 100, mode: 'fixed' },
    'accent-surface': {
      from: accent.color,
      base: 'surface',
      contrast: ACCENT_FILL_CONTRAST,
      mode: 'fixed',
    },
    'accent-surface-2': {
      base: 'accent-surface',
      tone: ACCENT_RAMP.surface2,
      mode: 'fixed',
    },
    'accent-surface-3': {
      base: 'accent-surface',
      tone: ACCENT_RAMP.surface3,
      mode: 'fixed',
    },
    'accent-surface-hover': {
      base: 'accent-surface',
      tone: ACCENT_RAMP.hover,
      mode: 'fixed',
    },
    // `'+13'` overshoots 100 on a light brand and `autoFlip` mirrors it to `-13`,
    // which is the right answer either way: a border on a light fill has to be the
    // darker of the two (`#FFD400` → `#d3af00`).
    'accent-surface-border': {
      base: 'accent-surface',
      tone: '+13',
      mode: 'fixed',
    },
  };
}

/**
 * The brand FOREGROUNDS — text on a neutral surface, and the icon.
 *
 * Split from {@link accentFillColors} because the two have different audiences: the
 * fill ramp is shared with the standalone `special` theme, which builds its own
 * purpose-made subset and must not gain tokens it does not consume. Only the default
 * theme (and the colored themes that inherit from it) takes these.
 *
 * These stay `mode: 'auto'` in both arrangements — a link has to invert on a dark page,
 * so exactness belongs to the fill and these are its brand-toned companions.
 */
function accentTextColors(accent: AccentSeed): ColorMap {
  if (accent == null) {
    return {
      ...ACCENT_SELECTED_FILL,
      // Stronger brand text for HOVERED selected outline/clear labels and LINK
      // hover. Same anchor + preferred tone as `accent-text-soft`, but a higher
      // `contrast: [6, 11]` floor against `accent-selected-fill` so it reads as a
      // clear step up from the soft rest color while staying saturated (a bare
      // `AAA`/`7` floor over-darkens light and desaturates dark). The HC pair keeps
      // it at/above the soft variant (which auto-promotes AA→AAA in HC).
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
    };
  }

  return {
    ...ACCENT_SELECTED_FILL,
    // The rest link color IS the brand, which is the visible payoff of a color seed;
    // the hover one steps past it so the intensify survives. See
    // ACCENT_TEXT_HOVER_STEP.
    // The hover text is the one place the derived NUMBER is still needed: `from`
    // carries the tone, but a step past it has to be computed.
    'accent-text': {
      from: accent.color,
      base: 'accent-selected-fill',
      tone: Math.max(0, accent.tone - ACCENT_TEXT_HOVER_STEP),
      contrast: ACCENT_TEXT_HOVER_CONTRAST,
    },
    'accent-text-soft': {
      from: accent.color,
      base: 'accent-selected-fill',
      contrast: ACCENT_TEXT_CONTRAST,
    },
    'accent-icon': {
      from: accent.color,
      base: 'surface',
      contrast: ACCENT_TEXT_CONTRAST,
    },
  };
}

/** Every accent token the default theme carries — fills, foregrounds, and the mix. */
function accentColors(accent: AccentSeed): ColorMap {
  return {
    ...accentFillColors(accent),
    ...accentTextColors(accent),
  };
}

// ============================================================================
// Palette construction
// ============================================================================

/**
 * Build the full palette from a resolved config.
 *
 * Pure: it reads nothing but its argument (and the global Glaze config, which
 * the caller sets first), so re-running it with the same config yields the same
 * tokens. Theme instances are immutable with respect to their hue / saturation
 * seed and a `GlazePalette` has no mutation API, so re-seeding means rebuilding.
 */
function buildPalette(
  config: ResolvedPaletteConfig,
  options: {
    /**
     * Carry `contrastLevel` on the theme instances instead of relying on the
     * global Glaze config. Used when rendering a palette the app is not running,
     * so a preview cannot disturb the live one. The resolved values are the same
     * either way; only which scheme variants get *emitted* differs, and callers
     * that isolate pick their variant explicitly.
     */
    isolateContrastLevel?: boolean;
  } = {},
): BuiltPalette {
  const {
    hue,
    baseHue,
    saturation,
    accentColor,
    accentTone,
    pastel,
    themes,
    contrastLevel,
  } = config;

  const accent: AccentSeed =
    accentColor !== null && accentTone !== null
      ? { color: accentColor, tone: accentTone }
      : null;

  // The one override the code theme shares with the rest of the palette.
  const sharedOverrides: GlazeConfigOverride = options.isolateContrastLevel
    ? { contrastLevel }
    : {};

  // `pastel` is instance-level in Glaze (not settable via `glaze.configure`).
  // Setting it on the two root themes is enough: `extend({ config })` merges
  // with the parent's override, so the derived themes inherit it. When it is
  // off we omit the field entirely rather than pass `false` — the two are
  // equivalent, and omitting keeps the default output provably untouched.
  const overrides: GlazeConfigOverride = {
    ...sharedOverrides,
    ...(pastel ? { pastel: true } : null),
  };
  const instanceConfig: GlazeConfigOverride | undefined = Object.keys(overrides)
    .length
    ? overrides
    : undefined;

  // `pastel` deliberately does *not* reach the code theme: syntax colors answer
  // to `themes.code.saturation` and nothing else. Pinned to `false` rather than
  // omitted — the same value Glaze defaults to, but here it is the point of the
  // override, not an absence. See {@link buildCodeTheme}.
  const codeInstanceConfig: GlazeConfigOverride = {
    ...sharedOverrides,
    pastel: false,
  };

  // --------------------------------------------------------------------------
  // Default theme (neutral, primary in palette → exported unprefixed)
  // --------------------------------------------------------------------------

  const defaultTheme = glaze(hue, saturation, instanceConfig);

  defaultTheme.colors({
    // ---- Surfaces (neutral, very low saturation) ----
    surface: { tone: 100, saturation: SURFACE_SATURATION, hue: baseHue },
    'surface-2': {
      hue: baseHue,
      base: 'surface',
      tone: ['-2', '-4'],
      saturation: 0.1,
      inherit: false,
    },
    'surface-3': {
      hue: baseHue,
      base: 'surface',
      tone: ['-4', '-8'],
      saturation: 0.1,
      inherit: false,
    },
    'surface-4': {
      hue: baseHue,
      base: 'surface',
      tone: ['-6', '-12'],
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
      hue: baseHue,
      base: 'surface',
      tone: `${TEXT_TONE - 2}`,
      saturation: 0.2,
      contrast: ['AA', 'AAA'],
    },
    'surface-text-soft': {
      hue: baseHue,
      base: 'surface',
      tone: `${TEXT_SOFT_TONE - 2}`,
      saturation: 0.2,
      contrast: ['AA', 'AAA'],
      inherit: false,
    },
    'surface-text-soft-2': {
      hue: baseHue,
      base: 'surface',
      tone: `${TEXT_SOFT2_TONE - 2}`,
      saturation: 0.2,
      contrast: ['AA', 'AAA'],
      inherit: false,
    },
    'surface-2-text': {
      hue: baseHue,
      base: 'surface-2',
      tone: `${TEXT_TONE + SURFACE_2_TEXT_OFFSET}`,
      saturation: 0.2,
      contrast: ['AA', 'AAA'],
      inherit: false,
    },
    'surface-2-text-soft': {
      hue: baseHue,
      base: 'surface-2',
      tone: `${TEXT_SOFT_TONE + SURFACE_2_TEXT_OFFSET}`,
      saturation: 0.2,
      contrast: ['AA', 'AAA'],
      inherit: false,
    },
    'surface-3-text': {
      hue: baseHue,
      base: 'surface-3',
      tone: `${TEXT_TONE + SURFACE_3_TEXT_OFFSET}`,
      saturation: 0.2,
      contrast: ['AA', 'AAA'],
      inherit: false,
    },
    'surface-3-text-soft': {
      hue: baseHue,
      base: 'surface-3',
      tone: `${TEXT_SOFT_TONE + SURFACE_3_TEXT_OFFSET}`,
      saturation: 0.2,
      contrast: ['AA', 'AAA'],
      inherit: false,
    },

    // ---- Other neutral UI primitives (default-only) ----
    border: {
      hue: baseHue,
      base: 'surface',
      tone: ['-10', '-30'],
      saturation: 0.175,
    },
    placeholder: {
      hue: baseHue,
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
      hue: baseHue,
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
      hue: baseHue,
      tone: 12,
      saturation: 0.475,
      mode: 'fixed',
      inherit: false,
    },

    // ---- Accent system (theme-aware, inherited by colored themes) ----
    // Two arrangements, one per seeding mode — see `accentColors`.
    ...accentColors(accent),

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
    overlay: { tone: 10, opacity: 0.5, inherit: false, hue: baseHue },
  });

  // --------------------------------------------------------------------------
  // Colored themes
  // --------------------------------------------------------------------------
  //
  // `primary` is the brand theme: it shares both the accent hue and the palette
  // seed saturation with `default`, and differs only in carrying a tinted surface.
  // Each status theme adds its own hue on top.
  const primaryTheme = defaultTheme.extend({
    colors: TINTED_SURFACE_OVERRIDE,
  });

  // A status theme takes the ACCENT COLOR'S TONE back out.
  //
  // The tone is the brand's, and only the brand's. Inherited, a light brand would put
  // `#danger-accent-surface` at tone 88 in a red hue — a pale pink danger button, which
  // is not a danger button. Status themes carry a *meaning* their hue exists to signal,
  // so they keep the white-anchored derivation that lands every hue at a comparable
  // weight. `extend({ colors })` redefines each listed color from scratch, so restating
  // the null arrangement is enough to undo it.
  //
  // With no accent color this is `TINTED_SURFACE_OVERRIDE` itself, so the shipped
  // palette is provably untouched.
  const statusColors: ColorMap =
    accent == null
      ? TINTED_SURFACE_OVERRIDE
      : { ...TINTED_SURFACE_OVERRIDE, ...accentColors(null) };

  const successTheme = defaultTheme.extend({
    hue: themes.success.hue,
    saturation: themes.success.saturation,
    colors: statusColors,
  });
  const dangerTheme = defaultTheme.extend({
    hue: themes.danger.hue,
    saturation: themes.danger.saturation,
    colors: statusColors,
  });
  const warningTheme = defaultTheme.extend({
    hue: themes.warning.hue,
    saturation: themes.warning.saturation,
    colors: statusColors,
  });
  const noteTheme = defaultTheme.extend({
    hue: themes.note.hue,
    saturation: themes.note.saturation,
    colors: statusColors,
  });

  // --------------------------------------------------------------------------
  // Special theme (fixed-mode, NOT inherited from the default theme)
  // --------------------------------------------------------------------------
  //
  // Standalone theme for `special`-variant components (hero CTAs, banners, etc.)
  // that intentionally sit on a dark surface regardless of the active scheme.
  //
  // Every token here is `mode: 'fixed'` so the resolved value is identical in
  // light, dark, and high-contrast. The shape is purpose-built (not a full
  // mirror of the default theme) — only what `SPECIAL_*_STYLES` in
  // `src/data/item-themes.ts` consumes is emitted. It follows the *primary*
  // seed, since it is the brand-on-dark theme.
  //
  // Token rundown:
  //   - `surface` — dark L≈12 backdrop (same value as `#surface-inverse`).
  //   - `accent-surface` / `accent-surface-2` / `accent-surface-3` —
  //     brand PRIMARY fill ramp (default → hover → pressed). Mirrors the
  //     `#primary-accent-surface` / `-2` / `-3` ramp on the colored themes so
  //     `SPECIAL_PRIMARY_STYLES.fill` can use the same shape.
  //   - `accent-surface-hover` — legacy alias kept around for the
  //     `#special-hover` color shortcut in `src/tokens/colors.ts`. Item
  //     themes themselves no longer reference it.
  //   - `accent-surface-text` — fixed white (= built-in `#white`), exposed
  //     for explicit references.
  //   - `accent-text` — dark brand foreground readable on white. Used as
  //     CLEAR-variant text on the always-white pill, and as the
  //     pressed/focused border on the brand primary fill. Matches the
  //     legacy `#fixed-primary-text` alias (= `#primary-accent-surface-hover`).
  //   - `accent-disabled-surface` / `accent-disabled-surface-text` —
  //     brand-tinted disabled chip + label, positioned with relative tone
  //     deltas against the fixed dark `surface` so the disabled state is
  //     scheme-symmetric.

  const specialTheme = glaze(hue, saturation, instanceConfig);

  specialTheme.colors({
    surface: { tone: 12, saturation: 0.475, mode: 'fixed' },

    // The same fill ramp as the default theme, and for the same reason: this IS the
    // brand CTA — `SPECIAL_PRIMARY_STYLES.fill` mirrors `#primary-accent-surface` — so
    // leaving it on the white-anchored derivation would give a yellow brand a
    // dark-purple hero button.
    //
    // Only the fills: `accent-selected-fill`, `accent-text-soft` and `accent-icon` are
    // not part of this theme's purpose-built shape, and adding them would grow the
    // emitted token set.
    ...accentFillColors(accent),

    // Special's `accent-text` is "dark brand, readable on a WHITE pill" (the CLEAR
    // selected fill) — not on `surface`, which here is the fixed dark backdrop. It
    // stays anchored to `accent-surface-text`, which is a hard white root in both
    // arrangements, so the `-58` delta keeps its meaning either way.
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

  // --------------------------------------------------------------------------
  // Palette composition
  // --------------------------------------------------------------------------
  //
  // `purple` is the legacy alias for `primary` and resolves to identical tokens
  // (same theme instance, different prefix → no token-value collision).
  //
  // `default` is emitted with an empty prefix (custom map in `getPaletteTokens`),
  // so its tokens appear unprefixed (`#surface`, `#border`, …). All other themes
  // are prefixed with `<themeName>-`.
  return {
    palette: glaze.palette({
      default: defaultTheme,
      primary: primaryTheme,
      purple: primaryTheme,
      success: successTheme,
      danger: dangerTheme,
      warning: warningTheme,
      note: noteTheme,
      special: specialTheme,
    }),
    // Kept out of the palette on purpose: it has to emit `code-*` unprefixed, and
    // its mirrored `surface` would collide with the default theme's.
    codeTheme: buildCodeTheme(config, codeInstanceConfig),
  };
}

// ============================================================================
// Tasty-formatted token export
// ============================================================================

const TOKEN_PREFIXES = {
  default: '',
  primary: 'primary-',
  purple: 'purple-',
  success: 'success-',
  danger: 'danger-',
  warning: 'warning-',
  note: 'note-',
  special: 'special-',
};

let paletteCache: GlazePalette | null = null;
let codeThemeCache: GlazeTheme | null = null;
let paletteTokensCache: Styles | null = null;
let cachedVersion = -1;

/**
 * Whether *we* are the ones holding a manual level in Glaze's global config.
 *
 * `contrastLevel` is the one palette option that has to be global: a global
 * level pins `modes.highContrast: false` so no high-contrast tier is emitted at
 * all (which is the point — a manual level already carries the preference),
 * whereas a per-instance level would leave the tier in place and report its own
 * values there. `palette.tasty({ modes })` cannot override that either.
 *
 * Being global means it is shared with the host app, so we only write it when
 * asked. A host that sets its own `glaze.configure({ contrastLevel })` and never
 * touches `setPaletteConfig({ contrastLevel })` keeps its level — without this
 * flag we would silently reset it to `'auto'` on the first token read.
 */
let ownsContrastLevel = false;

function applyContrastLevel(contrastLevel: number | 'auto') {
  // Nothing to do: we hold no level, and the config does not ask for one.
  if (contrastLevel === 'auto' && !ownsContrastLevel) return;

  // Always explicit — `configure()` never clears a field by omission, so
  // returning to `'auto'` has to say so.
  glaze.configure({ contrastLevel });
  ownsContrastLevel = contrastLevel !== 'auto';
}

function refresh() {
  const version = getPaletteVersion();

  if (paletteTokensCache && cachedVersion === version) return;

  const config = getPaletteConfig();

  applyContrastLevel(config.contrastLevel);

  const built = buildPalette(config);

  paletteCache = built.palette;
  paletteTokensCache = {
    ...built.palette.tasty({ prefix: TOKEN_PREFIXES, format: 'oklch' }),
    ...pickCodeTokens(built.codeTheme.tasty({ format: 'oklch' })),
  } as Styles;
  codeThemeCache = built.codeTheme;
  cachedVersion = version;
}

/**
 * Resolve Glaze palette tokens against the current palette config.
 *
 * Memoized against the config version (see `./palette-config.ts`), so repeated
 * reads are free and `setPaletteConfig()` invalidates them. Resolution is
 * deferred rather than done at module import, so host apps can call
 * `setPaletteConfig(...)` / `glaze.configure(...)` after importing
 * `@cube-dev/ui-kit` and still affect the first paint.
 *
 * Keys use `#name` syntax; values are state maps:
 *   '#surface': { '': 'oklch(...)', '@dark': 'oklch(...)', '@hc': 'oklch(...)' }
 */
export function getPaletteTokens(): Styles {
  refresh();

  return paletteTokensCache!;
}

/** The live `GlazePalette`. Rebuilt whenever the palette config changes. */
export function getPalette(): GlazePalette {
  refresh();

  return paletteCache!;
}

/**
 * The live theme behind the `code-*` tokens. Separate from {@link getPalette}
 * because it carries its own saturation seed — see {@link CODE_COLORS}.
 */
export function getCodeTheme(): GlazeTheme {
  refresh();

  return codeThemeCache!;
}

// ============================================================================
// One-variant render (for previewing a palette on a region)
// ============================================================================

const VARIANT_KEY = {
  'light:false': 'light',
  'light:true': 'lightContrast',
  'dark:false': 'dark',
  'dark:true': 'darkContrast',
} as const;

/**
 * Single-entry memo: all four variants of the last config rendered.
 *
 * Keyed on the palette version as well as the config, because the config is not
 * the only input — `buildPalette` also reads Glaze's own global config
 * (`darkTone`, `darkDesaturation`, the state map). A host that drives Glaze
 * directly and then calls `invalidatePaletteTokens()` bumps the version without
 * touching the config, and the region previews have to follow the document.
 */
let renderKey: string | null = null;
let renderVariants: Record<string, Record<string, string>> = {};

/**
 * Resolve one scheme variant of a palette to flat, literal color values.
 *
 * Unlike {@link getPaletteTokens}, which emits state maps (`@dark` / `@hc`) for
 * the whole document, this collapses the palette to the single variant you ask
 * for. That is what makes a **region** preview possible: applied through a tasty
 * `tokens` prop, the values override the inherited ones for that subtree only, so
 * a dark or high-contrast theme can be shown inside a light page.
 *
 * Prefer `renderColorTokens()` from `./colors` unless you specifically want the
 * palette without the legacy aliases.
 */
export function renderPaletteTokens(
  options: RenderPaletteOptions = {},
): Tokens {
  const { scheme = 'light', highContrast = false, ...config } = options;
  const resolved = resolvePaletteConfig(config);
  const key = `${getPaletteVersion()}:${JSON.stringify(resolved)}`;

  if (renderKey !== key) {
    // Force the *global* level to `'auto'` for the duration of the export.
    // Glaze suppresses high-contrast output whenever a global level is set, and
    // that check reads the global config — so without this, a preview's variants
    // would depend on whatever contrast mode the surrounding app happens to be
    // in. The preview's own level rides on the theme instances instead
    // (`isolateContrastLevel`), so the values stay correct. Restored in `finally`;
    // resolution is synchronous, so nothing can observe the window.
    const previousLevel = glaze.getConfig().contrastLevel;

    try {
      glaze.configure({ contrastLevel: 'auto' });

      const built = buildPalette(resolved, { isolateContrastLevel: true });
      const modes = { dark: true, highContrast: true };
      const themed = built.palette.tokens({
        prefix: TOKEN_PREFIXES,
        format: 'oklch',
        modes,
      });
      const code = built.codeTheme.tokens({ format: 'oklch', modes });

      // Built into a local and published together, so a throw part-way through
      // cannot leave a half-filled map sitting under the previous key.
      const variants: typeof renderVariants = {};

      for (const name of Object.keys(themed)) {
        variants[name] = {
          ...themed[name],
          ...pickCodeTokens(code[name] ?? {}),
        };
      }

      renderVariants = variants;
      renderKey = key;
    } finally {
      glaze.configure({ contrastLevel: previousLevel });
    }
  }

  const variant = VARIANT_KEY[`${scheme}:${highContrast}`];
  // The fallback is for `contrastLevel: 100` only. There the normal variants
  // already *are* the high-contrast ones, so Glaze emits a single light/dark set
  // rather than duplicating it — and `highContrast` correctly resolves to the same
  // colors. At every other level the contrast variants are present and genuinely
  // escalated, so the fallback is not taken.
  const flat = renderVariants[variant] ?? renderVariants[scheme];
  const out: Tokens = {};

  for (const name of Object.keys(flat)) out[`#${name}`] = flat[name];

  return out;
}

/**
 * Lazy proxy of {@link getPaletteTokens}. Prefer `getPaletteTokens()` in new
 * code. Property / enumeration access always reflects the current palette
 * config.
 */
export const PALETTE_TOKENS: Styles = lazyStyles(getPaletteTokens);
