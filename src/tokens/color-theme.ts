import { glaze } from '@tenphi/glaze';
import { useGlobalStyles } from '@tenphi/tasty';

// Imported for its SIDE EFFECT as much as for `tintRecipe`.
//
// `palette.ts` runs `glaze.configure({ states: { dark: '@dark', highContrast:
// '@hc' }, modes: …, darkTone: … })` at module scope, and that global config is
// what makes a theme emit `'@dark'` / `'@hc'` keys at all. Without this import
// a runtime theme falls back to Glaze's defaults — `@media(prefers-color-scheme:
// dark)` keys and NO high-contrast tier — which still renders, so the failure is
// silent. `color-theme.test.ts` asserts the `'@hc'` key exists to catch it.
import { colorSeed } from './color-seed';
import { tintRecipe } from './palette';
import {
  DEFAULT_HUE,
  DEFAULT_SATURATION,
  getPaletteConfig,
  getPaletteVersion,
  usePaletteVersion,
} from './palette-config';

import type { ColorMap, GlazeConfigOverride } from '@tenphi/glaze';
import type { Styles } from '@tenphi/tasty';

export interface ColorThemeConfig {
  /**
   * A hue in 0–360, or any colour Glaze parses — hex, `rgb()`, `hsl()`,
   * `okhsl()`, `okhst()`, `oklch()`.
   *
   * From a colour only the HUE and SATURATION are taken; the lightness is
   * discarded and re-derived per scheme. That is what makes the result adaptive
   * rather than a value that happens to work in one theme.
   */
  hue: number | string;
  /** 0–100. @default the palette's own saturation seed */
  saturation?: number;
  pastel?: boolean;
  /**
   * Extra colour definitions, merged over {@link tintRecipe}. Anything Glaze's
   * `theme.colors()` accepts, including `contrast` floors against a sibling.
   */
  colors?: ColorMap;
}

export interface ColorTheme {
  /**
   * A hash of the config, and the token prefix — `'tint-1a2b3c'`.
   *
   * Content-addressed rather than positional so two components asking for the
   * same colour name the same theme, and therefore share one injection. Also
   * makes it safe to stamp on the DOM as an identifier.
   */
  name: string;
  /**
   * Tasty token declarations, one state map per colour:
   * `{ '#tint-1a2b3c-surface': { '': …, '@dark': …, '@hc': …, '@dark & @hc': … } }`
   */
  tokens: Styles;
  /** Token references by their unprefixed name — `{ surface: '#tint-1a2b3c-surface' }`. */
  colors: Record<string, string>;
}

/**
 * FNV-1a, base36. Short, stable and dependency-free.
 *
 * These hashes name CSS custom properties and land in DOM attributes, so they
 * have to be deterministic across processes (SSR and the client must agree) and
 * safe as identifiers — but not cryptographic.
 */
export function hashString(input: string): string {
  let hash = 0x811c9dc5;

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // >>> 0 keeps it an unsigned 32-bit int; `Math.imul` is the 32-bit multiply.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash.toString(36);
}

/**
 * Hashes the RESOLVED seed, not the config as written.
 *
 * `{ hue: '#0ea5e9' }` and `{ hue: 237.32, saturation: 98.19 }` are the same
 * colour said two ways; hashing the input would give them two names, two
 * injections and two sets of generated rules. Rounded, because a seed that
 * differs in the twelfth decimal is the same colour to every eye and every
 * renderer — and an unrounded float would defeat the deduplication it is here to
 * provide.
 */
function hashSeed(seed: ResolvedSeed): string {
  return `tint-${hashString(
    JSON.stringify([
      seed.hue.toFixed(4),
      seed.saturation.toFixed(4),
      seed.pastel,
      seed.colors ? stableStringify(seed.colors) : null,
    ]),
  )}`;
}

interface ResolvedSeed {
  hue: number;
  saturation: number;
  pastel: boolean;
  colors?: ColorMap;
}

/** Key order must not change the hash, or two identical configs get two slots. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
  );

  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(',')}}`;
}

/**
 * The hue and saturation of a colour, for use as a theme seed.
 *
 * ```ts
 * colorThemeSeed('#0ea5e9'); // → { hue: 237.32, saturation: 98.19 }
 * ```
 *
 * The tone {@link colorSeed} also reads is dropped here on purpose: a tint theme
 * re-derives its lightness per scheme, which is what makes it adaptive. The palette's
 * `accentColor` keeps the tone, because a brand fill has to *be* the colour.
 *
 * An unparseable value falls back to the shipped seed rather than throwing — a hue
 * typed into a settings field should not take the render down.
 */
export function colorThemeSeed(value: string): {
  hue: number;
  saturation: number;
} {
  const seed = colorSeed(value);

  if (!seed) return { hue: DEFAULT_HUE, saturation: DEFAULT_SATURATION };

  return { hue: seed.hue, saturation: seed.saturation };
}

/**
 * Cached by `${paletteVersion}:${name}`.
 *
 * The palette version is in the KEY rather than triggering a clear, so a stale
 * entry is simply unreachable. `lastVersion` still clears the map on a change,
 * or repeated `setPaletteConfig` calls would grow it without bound.
 */
const cache = new Map<string, ColorTheme>();
let lastVersion = -1;

/**
 * Build (or reuse) an adaptive theme from a hue.
 *
 * Pure and memoized: the same config returns the same object identity until the
 * palette is re-seeded. Registering the tokens is {@link useColorTheme}'s job —
 * this only computes them, so it is safe to call while rendering or from a test.
 */
export function getColorTheme(config: ColorThemeConfig): ColorTheme {
  const version = getPaletteVersion();

  if (version !== lastVersion) {
    cache.clear();
    lastVersion = version;
  }

  const paletteConfig = getPaletteConfig();
  const parsed =
    typeof config.hue === 'string' ? colorThemeSeed(config.hue) : null;
  const seed: ResolvedSeed = {
    hue: parsed ? parsed.hue : (config.hue as number),
    saturation:
      config.saturation ??
      parsed?.saturation ??
      paletteConfig.saturation ??
      DEFAULT_SATURATION,
    pastel: config.pastel ?? paletteConfig.pastel ?? false,
    colors: config.colors,
  };

  const name = hashSeed(seed);
  const cached = cache.get(name);

  if (cached) return cached;

  const { hue, saturation } = seed;

  // `pastel` and `contrastLevel` are instance-level in Glaze, not settable
  // through `glaze.configure`, so a runtime theme has to carry them itself or it
  // would ignore a pastel palette. Omitted entirely when off, so the default
  // output is provably the same as passing nothing.
  const overrides: GlazeConfigOverride = {
    ...(paletteConfig.contrastLevel != null
      ? { contrastLevel: paletteConfig.contrastLevel }
      : null),
    ...(seed.pastel ? { pastel: true } : null),
  };

  const theme = glaze(
    hue,
    saturation,
    Object.keys(overrides).length ? overrides : undefined,
  );

  // The recipe follows the palette's `surfaceMode`, so a runtime tint sits the same
  // distance off the page as a built-in status theme does. Safe to read here rather
  // than hash into the seed: the cache is cleared on every palette version change,
  // and `surfaceMode` is one of the fields that bumps it.
  theme.colors({ ...tintRecipe(paletteConfig), ...config.colors });

  // `prefix` is a palette-only option, so the keys are renamed here. `oklch`
  // because that is what the palette emits; tasty converts to the configured
  // colour space on the way out either way.
  const raw = theme.tasty({ format: 'oklch' }) as Record<string, unknown>;
  const tokens: Styles = {};
  const colors: Record<string, string> = {};

  for (const [key, value] of Object.entries(raw)) {
    // Only the `#colour` entries are renamed; `splitHue` is off, so there are no
    // `$…-hue` companions to worry about, but a future one must not be mangled.
    if (!key.startsWith('#')) {
      (tokens as Record<string, unknown>)[key] = value;
      continue;
    }

    const bare = key.slice(1);
    const token = `#${name}-${bare}`;

    (tokens as Record<string, unknown>)[token] = value;
    colors[bare] = token;
  }

  const result: ColorTheme = { name, tokens, colors };

  cache.set(name, result);

  return result;
}

/**
 * Register an adaptive theme's tokens once per document, and get it back.
 *
 * The tokens land on `body` under a slot keyed by the theme's name, which is a
 * hash of the config — so every component asking for the same colour shares one
 * injection no matter how many of them there are. Tasty's global-style slots are
 * also permanent, which is what makes that safe: one component unmounting cannot
 * strip tokens another is still referencing.
 *
 * `body` rather than `:root`, which emits nothing at all — the same selector
 * `GlobalStyles` uses for the palette's own tokens. Custom properties inherit, so
 * anything rendered inside the document sees them; the one thing this cannot
 * reach is content portalled outside `<body>`, which nothing does.
 *
 * Because the slot id hashes the CONFIG rather than the resolved values,
 * re-seeding the palette replaces the same slot instead of leaking a new one.
 *
 * ```tsx
 * const theme = useColorTheme({ hue: '#0ea5e9' });
 * // theme.colors.surface → '#tint-1a2b3c-surface'
 * ```
 */
export function useColorTheme(config: ColorThemeConfig): ColorTheme {
  // Subscribes this component to a re-seed. `getColorTheme` reads the version
  // itself for its cache, so the value is unused here — the subscription is the
  // point, and it is what makes the tokens below re-inject.
  usePaletteVersion();

  const theme = getColorTheme(config);

  useGlobalStyles('body', theme.tokens, {
    id: `cube-color-theme-${theme.name}`,
  });

  return theme;
}
