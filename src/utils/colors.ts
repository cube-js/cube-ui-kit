import {
  hslToSrgb,
  okhslToOklch,
  okhslToSrgb,
  okhstToOkhsl,
  oklabToOkhsl,
  parseHexAlpha,
} from '@tenphi/glaze';

import type { OkhslColor, OklchColor, RgbColor } from '@tenphi/glaze';

/**
 * Reading a CSS color *literal* into channels — the layer under both the color
 * fields (which parse what a user types) and {@link toLegacyColor} (which parses
 * what `resolveTokenValue()` hands back).
 *
 * It lives here rather than in either consumer because the two need the same
 * grammar and disagreeing about it is invisible: a component this parser fails
 * to recognise does not throw, it makes the whole color unparseable, and the
 * caller falls back to something that merely looks plausible. The cases that
 * actually show up — a negative hue, a `none` component, scientific notation
 * out of a serializer, `oklch(from …)` relative syntax — are exactly the ones a
 * hand-rolled regex misses.
 *
 * Named CSS colors (`red`, `rebeccapurple`) are deliberately not supported,
 * matching `glaze.color()`. `transparent` is the one exception, because the kit
 * declares it: `#clear` is `transparent`.
 */

const FUNCTION_RE = /^([a-z]+)\(([^()]+)\)$/;

/**
 * A number with an optional unit, both captured in one pass.
 *
 * This runs on whatever the user types, so it is written to stay linear in two
 * separate ways. The integer and fraction parts are arranged so that no two
 * quantifiers can consume the same digit — `\d+(?:\.\d*)?` rather than
 * `\d+\.?\d*`, whose `\d+` and `\d*` can split a digit run n ways and make
 * rejecting a long one quadratic. And the unit is a capture group here rather
 * than a second, unanchored scan: reading it back with `/[a-z%]+$/` is itself
 * polynomial (CodeQL `js/polynomial-redos`), because every start position
 * re-walks the run of unit characters before failing at `$` — quadratic on a
 * string of many `%`.
 */
const NUMBER_RE =
  /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(%|deg|rad|grad|turn)?$/;

/** Degrees per unit, for the angle units `<hue>` accepts. */
const ANGLE_UNITS: Record<string, number> = {
  deg: 1,
  rad: 180 / Math.PI,
  grad: 0.9,
  turn: 360,
};

/**
 * `none` is a real component value, not a parse failure. Outside interpolation
 * and relative-color syntax CSS Color 4 resolves it to zero, which is what every
 * caller here wants — `oklch(0.5 none 200)` is a grey, and `… / none` is
 * invisible rather than unparseable.
 */
const NONE = 'none';

/** A component we can read: a number with an optional unit, or `none`. */
function isComponent(arg: string): boolean {
  return arg === NONE || NUMBER_RE.test(arg);
}

/** A component's magnitude and its unit, `''` when it is a bare number. */
interface NumericComponent {
  value: number;
  unit: string;
}

/** Read a numeric component and its unit together, or `null` if it is neither. */
function readNumber(arg: string): NumericComponent | null {
  const match = NUMBER_RE.exec(arg);

  return match ? { value: parseFloat(match[1]), unit: match[2] ?? '' } : null;
}

export function normalizeHue(hue: number): number {
  if (!Number.isFinite(hue)) return 0;

  return ((hue % 360) + 360) % 360;
}

/**
 * A color-function call split into its parts, with alpha separated out. Each
 * component keeps its unit, so the caller can tell `50%` from `50` — what a
 * percentage means is per space and per position (`oklch()`'s `100%` is `1` for
 * lightness and `0.4` for chroma), so only the caller can scale it.
 */
export interface ColorFunction {
  /** Lowercased function name — `'oklch'`, `'rgba'`, `'okhst'`. */
  name: string;
  /** The color components, alpha excluded. */
  args: string[];
  /** The alpha component as written, or `null` when the call omits it. */
  alpha: string | null;
}

/**
 * Split a color-function literal into its name, components and alpha. Both the
 * modern space-separated (`rgb(0 0 0 / 50%)`) and legacy comma-separated
 * (`rgba(0, 0, 0, 0.5)`) syntaxes are accepted.
 *
 * Returns `null` for anything that is not a plain color-function call, which
 * includes the two forms whose value cannot be worked out without a CSS engine:
 * relative syntax (`oklch(from var(--x) l c h)`) and `color-mix()`. Rejecting
 * them is the point — passing them through unchanged is what makes a consumer
 * silently drop the color.
 */
export function parseColorFunction(input: string): ColorFunction | null {
  const match = FUNCTION_RE.exec(input.trim().toLowerCase());

  if (!match) return null;

  const [, name, body] = match;
  const [components, ...rest] = body.split('/');

  // More than one slash is never valid syntax.
  if (rest.length > 1) return null;

  let alpha: string | null = rest.length ? rest[0].trim() : null;

  const args = components
    .trim()
    .split(components.includes(',') ? ',' : /\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  // A fourth component is alpha — that is the legacy `rgba(r, g, b, a)` /
  // `hsla(h, s, l, a)` form, and the same reading is the useful one for a
  // space-separated four-tuple someone typed without the slash.
  if (args.length === 4) {
    // `rgba(0, 0, 0, 1 / 0.5)` names alpha twice.
    if (alpha !== null) return null;

    alpha = args.pop()!;
  }

  if (alpha !== null && !isComponent(alpha)) return null;

  return args.every(isComponent) ? { name, args, alpha } : null;
}

/**
 * Read a non-hue component. `scale` is what `100%` means in this position;
 * `none` is zero, and an angle is not a value this position accepts.
 */
export function readComponent(arg: string, scale: number): number {
  if (arg === NONE) return 0;

  const parsed = readNumber(arg);

  if (!parsed) return NaN;

  if (parsed.unit === '%') return (parsed.value / 100) * scale;

  return parsed.unit ? NaN : parsed.value;
}

/** Read a `<hue>`: any angle unit, or a bare number of degrees. Normalized. */
export function readHue(arg: string): number {
  if (arg === NONE) return 0;

  const parsed = readNumber(arg);

  if (!parsed) return NaN;

  // A percentage is not a valid hue angle.
  if (parsed.unit === '%') return NaN;

  // Every unit {@link NUMBER_RE} captures other than `%` is an angle, so the
  // guard is unreachable today. It stays because a unit added there later — a
  // length, say — would otherwise arrive here and be read as degrees.
  const perDegree = parsed.unit ? ANGLE_UNITS[parsed.unit] : 1;

  return perDegree === undefined ? NaN : normalizeHue(parsed.value * perDegree);
}

/** Read an `<alpha-value>`. A missing alpha is opaque; out of range is clamped. */
export function readAlpha(arg: string | null): number {
  if (arg === null) return 1;

  const alpha = readComponent(arg, 1);

  return Number.isFinite(alpha) ? clamp(alpha, 0, 1) : NaN;
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function anyNaN(...values: number[]): boolean {
  return values.some((value) => !Number.isFinite(value));
}

/**
 * The largest OKLCh chroma that stays inside the sRGB gamut for the given hue
 * and OKHSL lightness — that is exactly what OKHSL saturation `1` means.
 */
export function maxChroma(hue: number, lightness: number): number {
  return okhslToOklch(normalizeHue(hue), 1, clamp(lightness, 0, 1))[1];
}

/**
 * OKLCh addresses colors outside the sRGB gamut, so chroma is clipped to the
 * gamut boundary at the requested lightness. Hue is taken from the input rather
 * than from the conversion, which loses it at zero chroma.
 */
export function oklchToOkhsl(color: OklchColor): OkhslColor {
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

export function rgbFromSrgb([r, g, b]: [number, number, number]): RgbColor {
  return { r: r * 255, g: g * 255, b: b * 255 };
}

/** Gamma-encoded sRGB channels in 0–1, plus alpha in 0–1. */
export interface SrgbColor {
  rgb: [number, number, number];
  alpha: number;
}

/**
 * Read any color literal the kit can emit or accept into gamma-encoded sRGB
 * channels plus alpha — the space every legacy consumer speaks.
 *
 * Returns `null` when the input is not a color, or is one whose value depends on
 * a CSS engine we do not have (see {@link parseColorFunction}).
 */
export function parseSrgbColor(input: string): SrgbColor | null {
  const text = input.trim().toLowerCase();

  if (!text) return null;

  // The one named color the kit declares: `#clear` is `transparent`. Browsers
  // compute it to `rgba(0, 0, 0, 0)`, but a token block read outside a browser
  // hands back the keyword as authored.
  if (text === 'transparent') return { rgb: [0, 0, 0], alpha: 0 };

  if (text.startsWith('#')) {
    const parsed = parseHexAlpha(text);

    return parsed ? { rgb: parsed.rgb, alpha: parsed.alpha ?? 1 } : null;
  }

  const parsed = parseColorFunction(text);

  if (!parsed || parsed.args.length !== 3) return null;

  const { name, args } = parsed;
  const alpha = readAlpha(parsed.alpha);

  if (!Number.isFinite(alpha)) return null;

  const rgb = toSrgbChannels(name, args);

  return rgb ? { rgb, alpha } : null;
}

function toSrgbChannels(
  name: string,
  args: string[],
): [number, number, number] | null {
  switch (name) {
    case 'rgb':
    case 'rgba': {
      const [r, g, b] = args.map((arg) => readComponent(arg, 255));

      if (anyNaN(r, g, b)) return null;

      return [clamp(r / 255, 0, 1), clamp(g / 255, 0, 1), clamp(b / 255, 0, 1)];
    }
    case 'hsl':
    case 'hsla': {
      const h = readHue(args[0]);
      const s = readComponent(args[1], 100) / 100;
      const l = readComponent(args[2], 100) / 100;

      if (anyNaN(h, s, l)) return null;

      return hslToSrgb(h, clamp(s, 0, 1), clamp(l, 0, 1));
    }
    case 'okhsl': {
      const h = readHue(args[0]);
      const s = readComponent(args[1], 100) / 100;
      const l = readComponent(args[2], 100) / 100;

      if (anyNaN(h, s, l)) return null;

      return okhslToSrgb(h, clamp(s, 0, 1), clamp(l, 0, 1));
    }
    case 'okhst': {
      const h = readHue(args[0]);
      const s = readComponent(args[1], 100) / 100;
      const t = readComponent(args[2], 100) / 100;

      if (anyNaN(h, s, t)) return null;

      const okhsl = okhstToOkhsl({
        h,
        s: clamp(s, 0, 1),
        t: clamp(t, 0, 1),
      });

      return okhslToSrgb(
        normalizeHue(okhsl.h),
        clamp(okhsl.s, 0, 1),
        clamp(okhsl.l, 0, 1),
      );
    }
    case 'oklch': {
      // In `oklch()` a percentage means 1 for lightness and 0.4 for chroma.
      const l = readComponent(args[0], 1);
      const c = readComponent(args[1], 0.4);
      const h = readHue(args[2]);

      if (anyNaN(l, c, h)) return null;

      const okhsl = oklchToOkhsl({ l, c, h });

      return okhslToSrgb(okhsl.h, okhsl.s, okhsl.l);
    }
    default:
      return null;
  }
}
