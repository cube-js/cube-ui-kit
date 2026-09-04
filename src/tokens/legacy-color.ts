import { srgbToHex } from '@tenphi/glaze';

import { parseSrgbColor } from '../utils/colors';

/**
 * Converting a resolved color token into a form a third-party parser will
 * actually accept.
 *
 * Since Glaze every color token computes to `oklch(...)`, and a large class of
 * consumers validates colors against "HEX, `rgb()`, or `hsl()`" and *silently
 * drops* anything else — Stripe's Appearance API falls back to its own light
 * theme, `d3-color` (so Vega) throws, mapbox-gl's `csscolorparser` rejects even
 * an `#rrggbbaa` tail. A round trip through the DOM does not normalize it:
 * Chrome serializes `oklch` back as `oklch`.
 *
 * So the value `resolveTokenValue()` hands back is correct and unusable at the
 * same time, and this is the step between them.
 */

/** Output form for a *translucent* color — see {@link ToLegacyColorOptions}. */
export type LegacyAlphaFormat = 'rgba' | 'hex';

export interface ToLegacyColorOptions {
  /**
   * How to carry alpha when the color is translucent. An opaque color is always
   * `#rrggbb`, which every consumer accepts.
   *
   * - `'rgba'` (default) — `rgba(97, 71, 214, 0.4)`. The widest form: Stripe
   *   takes it, mapbox-gl takes it, CSS takes it.
   * - `'hex'` — `#rrggbbaa`. Shorter, and what Vega and plain CSS prefer, but
   *   mapbox-gl's hex branch accepts only `#rgb` / `#rrggbb` and will drop it.
   *
   * When in doubt keep the default; pick `'hex'` only for a consumer known to
   * read the tail.
   */
  alpha?: LegacyAlphaFormat;
  /** Returned in place of `null` when the input is not a color we can read. */
  fallback?: string;
}

/**
 * Convert a color literal — most usefully the `oklch(...)` a color token
 * resolves to — into a hex or `rgba()` string.
 *
 * ```ts
 * toLegacyColor(resolveTokenValue('#purple')); // '#6147d6'
 * toLegacyColor('oklch(0.55 0.21 285 / 0.4)'); // 'rgba(97, 71, 214, 0.4)'
 * toLegacyColor('oklch(0.55 0.21 285 / 0.4)', { alpha: 'hex' }); // '#6147d666'
 * ```
 *
 * Takes `null` / `undefined` so it composes with `resolveTokenValue()` without
 * a null check, and reads every notation the kit emits or accepts: `oklch()`,
 * `okhsl()`, `okhst()`, `rgb()`, `hsl()`, hex (3/4/6/8 digits) and
 * `transparent`, in either the modern slash or the legacy comma alpha syntax.
 *
 * Returns `options.fallback ?? null` rather than the input when the value
 * cannot be read — a color that is not `oklch()` but still not legacy-safe is
 * the failure this helper exists to prevent, so handing it back would defeat
 * the purpose. Named colors other than `transparent`, `color-mix()` and
 * relative syntax (`oklch(from …)`) are all unreadable here, the last two
 * because their value only exists inside a CSS engine.
 */
export function toLegacyColor(
  value: string | null | undefined,
  options: ToLegacyColorOptions = {},
): string | null {
  const { alpha: format = 'rgba', fallback = null } = options;

  if (typeof value !== 'string') return fallback;

  const parsed = parseSrgbColor(value);

  if (!parsed) return fallback;

  const hex = srgbToHex(parsed.rgb);

  if (parsed.alpha >= 1) return hex;

  if (format === 'hex') return `${hex}${toHexByte(parsed.alpha)}`;

  const [r, g, b] = parsed.rgb.map(toByte);

  return `rgba(${r}, ${g}, ${b}, ${round(parsed.alpha)})`;
}

/**
 * 8-bit channels rather than the fractional ones `formatRgb()` emits. The point
 * of this helper is a value a *legacy* parser accepts, and those commonly read
 * channels with an integer parse; the hex form is 8-bit regardless, so this also
 * keeps the two output forms describing the same color.
 */
function toByte(channel: number): number {
  return Math.round(Math.min(Math.max(channel, 0), 1) * 255);
}

function toHexByte(alpha: number): string {
  return toByte(alpha).toString(16).padStart(2, '0');
}

/** Three decimals is finer than the 8-bit alpha the hex form can carry. */
function round(alpha: number): number {
  return Math.round(alpha * 1000) / 1000;
}
