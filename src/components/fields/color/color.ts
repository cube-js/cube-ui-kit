import {
  contrastRatioFromLuminance,
  formatHsl,
  formatOkhsl,
  formatOkhst,
  formatOklch,
  formatRgb,
  hslToSrgb,
  okhslToLinearSrgb,
  okhslToOkhst,
  okhslToOklch,
  okhslToSrgb,
  okhstToOkhsl,
  oklabToOkhsl,
  parseHexAlpha,
  relativeLuminanceFromLinearRgb,
  srgbToHex,
  srgbToOkhsl,
} from '@tenphi/glaze';

import type {
  OkhslColor,
  OkhstColor,
  OklchColor,
  RgbColor,
} from '@tenphi/glaze';

export type { OkhslColor, OkhstColor, OklchColor, RgbColor };

/**
 * Every color format the picker can read and write.
 *
 * `okhsl` and `okhst` are Glaze / Tasty spaces rather than native CSS ones,
 * but Tasty parses both, so the produced strings are usable as style values.
 */
export const COLOR_FORMATS = [
  'hex',
  'rgb',
  'hsl',
  'okhsl',
  'okhst',
  'oklch',
] as const;

export type ColorFormat = (typeof COLOR_FORMATS)[number];

/**
 * OKHSL is the canonical space of the picker: it is Glaze's authoring space,
 * every channel is bounded, and — unlike OKLCh — every value inside those
 * bounds is inside the sRGB gamut, so no state can be unrepresentable.
 */
export type ColorValue = OkhslColor;

const FUNCTION_RE = /^([a-z]+)\(([^()]+)\)$/;
/**
 * A number with an optional `%` or `deg` unit.
 *
 * The integer and fraction parts are deliberately written so that no two
 * quantifiers can consume the same digit — `\d+(?:\.\d*)?` rather than
 * `\d+\.?\d*`, whose `\d+` and `\d*` can split a digit run n ways and make
 * rejecting a long one quadratic. This runs on whatever the user types.
 */
const NUMBER_RE = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?:%|deg)?$/;

/**
 * Saturation below this rounds to `0%` in every output notation, so the color
 * is achromatic for display purposes even when the conversion left a residue.
 */
const ACHROMATIC_SATURATION = 5e-5;

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function normalizeHue(hue: number): number {
  if (!Number.isFinite(hue)) return 0;

  return ((hue % 360) + 360) % 360;
}

/**
 * The color carries no meaningful hue: every conversion out of it invents an
 * angle, so callers that need one should keep the hue they already had.
 */
export function isAchromatic(color: ColorValue): boolean {
  return color.s < ACHROMATIC_SATURATION;
}

/** Both channel objects describe the same color, within display precision. */
export function isSameColor(a?: ColorValue | null, b?: ColorValue | null) {
  if (!a || !b) return a === b;

  return (
    Math.abs(a.h - b.h) < 1e-6 &&
    Math.abs(a.s - b.s) < 1e-6 &&
    Math.abs(a.l - b.l) < 1e-6
  );
}

/**
 * Split a color-function body into its numeric arguments, dropping the alpha
 * component. Both the modern space-separated and the legacy comma-separated
 * syntaxes are accepted.
 *
 * Each argument keeps its unit so the caller can tell `50%` from `50`.
 */
function splitArguments(body: string): string[] | null {
  const [values, ...rest] = body.split('/');

  // More than one slash is never valid syntax.
  if (rest.length > 1) return null;

  const args = values
    .trim()
    .split(values.includes(',') ? ',' : /\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  // Legacy `rgba(r, g, b, a)` / `hsla(h, s, l, a)` carry alpha as a fourth
  // argument. Alpha is not part of the value, so it is dropped either way.
  if (args.length === 4) args.pop();

  return args.every((arg) => NUMBER_RE.test(arg)) ? args : null;
}

/** Parse an argument that may carry a `%` unit. `scale` is the 100% value. */
function scalar(arg: string, scale: number): number {
  return arg.endsWith('%') ? (parseFloat(arg) / 100) * scale : parseFloat(arg);
}

function hueArgument(arg: string): number {
  // A percentage is not a valid hue angle.
  return arg.endsWith('%') ? NaN : normalizeHue(parseFloat(arg));
}

export function fromRgb(color: RgbColor): ColorValue {
  const [h, s, l] = srgbToOkhsl([
    clamp(color.r, 0, 255) / 255,
    clamp(color.g, 0, 255) / 255,
    clamp(color.b, 0, 255) / 255,
  ]);

  return { h: normalizeHue(h), s: clamp(s, 0, 1), l: clamp(l, 0, 1) };
}

export function toRgb(color: ColorValue): RgbColor {
  const [r, g, b] = okhslToSrgb(color.h, color.s, color.l);

  return {
    r: Math.round(clamp(r, 0, 1) * 255),
    g: Math.round(clamp(g, 0, 1) * 255),
    b: Math.round(clamp(b, 0, 1) * 255),
  };
}

export function fromOkhst(color: OkhstColor): ColorValue {
  const { h, s, l } = okhstToOkhsl({
    h: normalizeHue(color.h),
    s: clamp(color.s, 0, 1),
    t: clamp(color.t, 0, 1),
  });

  return { h: normalizeHue(h), s: clamp(s, 0, 1), l: clamp(l, 0, 1) };
}

export function toOkhst(color: ColorValue): OkhstColor {
  const { t } = okhslToOkhst(color);

  return { h: color.h, s: color.s, t: clamp(t, 0, 1) };
}

/**
 * The largest OKLCh chroma that stays inside the sRGB gamut for the given hue
 * and OKHSL lightness — that is exactly what OKHSL saturation `1` means.
 */
export function maxChroma(hue: number, lightness: number): number {
  return okhslToOklch(normalizeHue(hue), 1, clamp(lightness, 0, 1))[1];
}

export function toOklch(color: ColorValue): OklchColor {
  const [l, c, h] = okhslToOklch(color.h, color.s, color.l);

  return { l, c, h: normalizeHue(h) };
}

/**
 * OKLCh addresses colors outside the sRGB gamut, so chroma is clipped to the
 * gamut boundary at the requested lightness before it is stored. Hue is taken
 * from the input rather than from the conversion, which loses it at zero
 * chroma.
 */
export function fromOklch(color: OklchColor): ColorValue {
  const h = normalizeHue(color.h);
  const c = Math.max(color.c, 0);
  const radians = (h * Math.PI) / 180;
  const [, s, l] = oklabToOkhsl([
    clamp(color.l, 0, 1),
    c * Math.cos(radians),
    c * Math.sin(radians),
  ]);
  const limit = maxChroma(h, l);

  return {
    h,
    s: limit > 0 ? (c >= limit ? 1 : clamp(s, 0, 1)) : 0,
    l: clamp(l, 0, 1),
  };
}

export function toHex(color: ColorValue): string {
  return srgbToHex(okhslToSrgb(color.h, color.s, color.l));
}

/**
 * Read any supported color notation into the canonical space. Returns `null`
 * for anything that is not a real color — that is what lets the picker reject
 * partial input instead of guessing.
 *
 * Named CSS colors (`red`, `rebeccapurple`) are intentionally not supported,
 * matching `glaze.color()`.
 */
export function parseColor(input: string): ColorValue | null {
  const text = input.trim().toLowerCase();

  if (!text) return null;

  if (text.startsWith('#')) {
    const parsed = parseHexAlpha(text);

    return parsed ? fromRgb(rgbFromSrgb(parsed.rgb)) : null;
  }

  const match = FUNCTION_RE.exec(text);

  if (!match) return null;

  const [, name, body] = match;
  const args = splitArguments(body);

  if (!args || args.length !== 3) return null;

  switch (name) {
    case 'rgb':
    case 'rgba': {
      const [r, g, b] = args.map((arg) => scalar(arg, 255));

      return anyNaN(r, g, b) ? null : fromRgb({ r, g, b });
    }
    case 'hsl':
    case 'hsla': {
      const h = hueArgument(args[0]);
      const s = scalar(args[1], 100) / 100;
      const l = scalar(args[2], 100) / 100;

      if (anyNaN(h, s, l)) return null;

      return fromRgb(rgbFromSrgb(hslToSrgb(h, clamp(s, 0, 1), clamp(l, 0, 1))));
    }
    case 'okhsl': {
      const h = hueArgument(args[0]);
      const s = scalar(args[1], 100) / 100;
      const l = scalar(args[2], 100) / 100;

      if (anyNaN(h, s, l)) return null;

      return { h, s: clamp(s, 0, 1), l: clamp(l, 0, 1) };
    }
    case 'okhst': {
      const h = hueArgument(args[0]);
      const s = scalar(args[1], 100) / 100;
      const t = scalar(args[2], 100) / 100;

      if (anyNaN(h, s, t)) return null;

      return fromOkhst({ h, s, t });
    }
    case 'oklch': {
      // In `oklch()` a percentage means 1 for lightness and 0.4 for chroma.
      const l = scalar(args[0], 1);
      const c = scalar(args[1], 0.4);
      const h = hueArgument(args[2]);

      return anyNaN(l, c, h) ? null : fromOklch({ l, c, h });
    }
    default:
      return null;
  }
}

function anyNaN(...values: number[]): boolean {
  return values.some((value) => !Number.isFinite(value));
}

function rgbFromSrgb([r, g, b]: [number, number, number]): RgbColor {
  return { r: r * 255, g: g * 255, b: b * 255 };
}

/** Serialize the canonical color into one of the supported notations. */
export function formatColor(color: ColorValue, format: ColorFormat): string {
  // An achromatic color has no meaningful hue, and the conversions leave
  // whatever angle the source happened to carry. Zero reads better.
  const gray = isAchromatic(color);
  const hue = gray ? 0 : color.h;
  const saturation = color.s;
  const lightness = color.l;

  switch (format) {
    case 'rgb':
      return formatRgb(hue, saturation, lightness);
    case 'hsl': {
      const text = formatHsl(hue, saturation, lightness);

      // CSS HSL derives its hue from the sRGB channels, which is undefined
      // when they are equal — Glaze emits whatever the formula produces. Every
      // other notation carries the hue through, so only HSL needs this.
      return gray ? text.replace(/\(-?[\d.]+/, '(0') : text;
    }
    case 'okhsl':
      return formatOkhsl(hue, saturation, lightness);
    case 'okhst':
      return formatOkhst(hue, saturation, toOkhst(color).t);
    case 'oklch':
      return formatOklch(hue, saturation, lightness);
    default:
      return toHex(color);
  }
}

/**
 * Which notation a string is written in, or `null` when it is not a color.
 * Used to keep the user's own notation while still normalizing the value.
 */
export function detectFormat(input: string): ColorFormat | null {
  const text = input.trim().toLowerCase();

  if (!parseColor(text)) return null;

  if (text.startsWith('#')) return 'hex';

  const name = FUNCTION_RE.exec(text)?.[1];

  switch (name) {
    case 'rgb':
    case 'rgba':
      return 'rgb';
    case 'hsl':
    case 'hsla':
      return 'hsl';
    case 'okhsl':
      return 'okhsl';
    case 'okhst':
      return 'okhst';
    case 'oklch':
      return 'oklch';
    default:
      return null;
  }
}

/**
 * Black or white — whichever the WCAG contrast ratio favors on the given
 * color. Keeps the popover preview label readable at any lightness. Returns a
 * literal hex rather than a token, because the answer is measured against this
 * exact fill and must not adapt with the color schema.
 */
export function getContrastingColor(color: ColorValue): '#000000' | '#ffffff' {
  const luminance = relativeLuminanceFromLinearRgb(
    okhslToLinearSrgb(color.h, color.s, color.l),
  );

  return contrastRatioFromLuminance(luminance, 0) >=
    contrastRatioFromLuminance(1, luminance)
    ? '#000000'
    : '#ffffff';
}
