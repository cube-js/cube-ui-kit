import {
  ColorValue,
  fromOkhst,
  fromOklch,
  fromRgb,
  isAchromatic,
  maxChroma,
  normalizeHue,
  toHex,
  toOkhst,
  toOklch,
  toRgb,
} from './color';

/**
 * The three color concepts the popover can be driven by. They all edit the
 * same canonical value — only the axes the user manipulates differ.
 */
export const COLOR_SPACES = ['hst', 'lch', 'rgb'] as const;

export type ColorSpace = (typeof COLOR_SPACES)[number];

export const COLOR_SPACE_LABELS: Record<ColorSpace, string> = {
  hst: 'HST',
  lch: 'LCH',
  rgb: 'RGB',
};

export const COLOR_SPACE_HINTS: Record<ColorSpace, string> = {
  hst: 'OKHST — hue, saturation, tone',
  lch: 'OKLCH — lightness, chroma, hue',
  rgb: 'sRGB — red, green, blue',
};

export interface ColorChannel {
  /** Single-letter axis name shown next to the slider. */
  label: string;
  /** Accessible name for the slider. */
  title: string;
  min: number;
  step: number;
  /** The upper bound. Chroma is gamut-bound, so it depends on the color. */
  max: (color: ColorValue) => number;
  value: (color: ColorValue) => number;
  /** The color this channel produces when moved to `value`. */
  apply: (color: ColorValue, value: number) => ColorValue;
  /** Comma-separated gradient stops describing the channel's whole range. */
  stops: (color: ColorValue) => string;
  /** Human-readable rendering of the current channel value. */
  display: (color: ColorValue) => string;
}

const constant = (value: number) => () => value;

function round(value: number, precision = 2): number {
  const factor = 10 ** precision;

  return Math.round(value * factor) / factor;
}

/**
 * `count` evenly spaced gradient stops, always as hex. Perceptual channels are
 * not linear in sRGB, so a two-stop gradient would misrepresent them —
 * sampling the real conversion keeps the track honest. Hex (rather than an
 * `okhsl()` string) because the gradient reaches the DOM as a raw custom
 * property, without passing through Tasty's color functions.
 */
function ramp(count: number, at: (position: number) => ColorValue): string {
  return Array.from({ length: count }, (_, index) =>
    toHex(at(index / (count - 1))),
  ).join(', ');
}

/**
 * The hue strip is drawn at full saturation and a fixed OKHSL lightness, which
 * keeps it perceptually even instead of spiking at yellow the way a CSS-HSL
 * rainbow does. Its own saturation and tone stay fixed: the strip is the same
 * in HST and in LCH, where `H` means the same thing.
 */
const HUE_STOPS = ramp(25, (position) => ({
  h: position * 360,
  s: 1,
  l: 0.6,
}));

const hueChannel: ColorChannel = {
  label: 'H',
  title: 'Hue',
  min: 0,
  // 360° is the same angle as 0°, so the last usable stop is 359 — the range
  // `HueSlider` exposes as well.
  max: constant(359),
  step: 1,
  value: (color) => round(color.h, 1),
  apply: (color, value) => ({ ...color, h: normalizeHue(value) }),
  stops: () => HUE_STOPS,
  display: (color) => `${Math.round(color.h)}°`,
};

const saturationChannel: ColorChannel = {
  label: 'S',
  title: 'Saturation',
  min: 0,
  max: constant(100),
  step: 1,
  value: (color) => round(color.s * 100, 1),
  apply: (color, value) => ({ ...color, s: value / 100 }),
  stops: (color) => ramp(7, (position) => ({ ...color, s: position })),
  display: (color) => `${Math.round(color.s * 100)}%`,
};

const toneChannel: ColorChannel = {
  label: 'T',
  title: 'Tone',
  min: 0,
  max: constant(100),
  step: 1,
  value: (color) => round(toOkhst(color).t * 100, 1),
  apply: (color, value) =>
    fromOkhst({ h: color.h, s: color.s, t: value / 100 }),
  stops: (color) =>
    ramp(7, (position) => fromOkhst({ h: color.h, s: color.s, t: position })),
  display: (color) => `${Math.round(toOkhst(color).t * 100)}%`,
};

const lightnessChannel: ColorChannel = {
  label: 'L',
  title: 'Lightness',
  min: 0,
  max: constant(100),
  step: 1,
  value: (color) => round(toOklch(color).l * 100, 1),
  apply: (color, value) => {
    const { c, h } = toOklch(color);

    return fromOklch({ l: value / 100, c, h });
  },
  stops: (color) => {
    const { c, h } = toOklch(color);

    return ramp(7, (position) => fromOklch({ l: position, c, h }));
  },
  display: (color) => `${Math.round(toOklch(color).l * 100)}%`,
};

const chromaChannel: ColorChannel = {
  label: 'C',
  title: 'Chroma',
  min: 0,
  // Chroma has no fixed ceiling: how far it can go depends on how far the sRGB
  // gamut reaches at the current lightness and hue. Never zero, so the slider
  // always has a range to divide by.
  max: (color) => Math.max(round(maxChroma(color.h, color.l), 4), 0.001),
  step: 0.001,
  value: (color) => round(toOklch(color).c, 4),
  apply: (color, value) => {
    const { l, h } = toOklch(color);

    return fromOklch({ l, c: value, h });
  },
  stops: (color) => {
    const { l, h } = toOklch(color);
    const limit = maxChroma(color.h, color.l);

    return ramp(7, (position) => fromOklch({ l, c: position * limit, h }));
  },
  display: (color) => toOklch(color).c.toFixed(3),
};

function rgbChannel(
  key: 'r' | 'g' | 'b',
  label: string,
  title: string,
): ColorChannel {
  const at = (color: ColorValue, value: number) =>
    fromRgb({ ...toRgb(color), [key]: value });

  return {
    label,
    title,
    min: 0,
    max: constant(255),
    step: 1,
    value: (color) => toRgb(color)[key],
    apply: (color, value) => {
      const next = at(color, value);

      // A gray has no hue of its own, and the conversion invents one. Keeping
      // the authored hue means switching back to HST or LCH resumes where the
      // user left off.
      return isAchromatic(next) ? { ...next, h: color.h } : next;
    },
    // An sRGB channel is linear in the space CSS interpolates gradients in, so
    // the two ends describe the whole ramp exactly.
    stops: (color) => ramp(2, (position) => at(color, position * 255)),
    display: (color) => `${toRgb(color)[key]}`,
  };
}

export const CHANNELS: Record<ColorSpace, ColorChannel[]> = {
  hst: [hueChannel, saturationChannel, toneChannel],
  lch: [lightnessChannel, chromaChannel, hueChannel],
  rgb: [
    rgbChannel('r', 'R', 'Red'),
    rgbChannel('g', 'G', 'Green'),
    rgbChannel('b', 'B', 'Blue'),
  ],
};
