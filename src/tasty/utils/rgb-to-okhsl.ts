/**
 * RGB to OKHSL Conversion Utility
 *
 * Converts sRGB colors to OKHSL format. This is the reverse of the okhsl-plugin.
 * Used for converting existing RGB color tokens to OKHSL.
 *
 * NOT exported from the main tasty module — for internal/temporary use only.
 */

import { okhslToSrgb, sRGBToOKHSL } from './okhsl-color-math';

import type { Vec3 } from './okhsl-color-math';

// ============================================================================
// Public API
// ============================================================================

/**
 * Parse an RGB string like "rgb(R G B)" or "rgb(R, G, B)" where R, G, B are 0-255.
 */
export function parseRgbString(rgb: string): Vec3 | null {
  const match = rgb.match(/rgb\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)\s*\)/);
  if (!match) return null;

  return [
    parseInt(match[1]) / 255,
    parseInt(match[2]) / 255,
    parseInt(match[3]) / 255,
  ];
}

export { sRGBToOKHSL };

/**
 * Convert an RGB string to OKHSL string format.
 * Input: "rgb(R G B)" or "rgb(R, G, B)" where R, G, B are 0-255
 * Output: "okhsl(H S% L%)" where H is degrees, S and L are percentages
 */
export function rgbStringToOkhslString(
  rgb: string,
  options?: {
    hueDecimals?: number;
    percentDecimals?: number;
  },
): string | null {
  const parsed = parseRgbString(rgb);
  if (!parsed) return null;

  const okhsl = sRGBToOKHSL(parsed);

  const hueDecimals = options?.hueDecimals ?? 1;
  const percentDecimals = options?.percentDecimals ?? 0;

  const h = okhsl[0].toFixed(hueDecimals);
  const s = (okhsl[1] * 100).toFixed(percentDecimals);
  const l = (okhsl[2] * 100).toFixed(percentDecimals);

  return `okhsl(${h} ${s}% ${l}%)`;
}

/**
 * Verify conversion by round-tripping: RGB → OKHSL → RGB
 * Returns the difference in RGB values (0-255 scale).
 */
export function verifyConversion(rgb: string): {
  original: Vec3;
  okhsl: Vec3;
  roundTrip: Vec3;
  maxDiff: number;
} | null {
  const parsed = parseRgbString(rgb);
  if (!parsed) return null;

  const okhsl = sRGBToOKHSL(parsed);
  const roundTrip = okhslToSrgb(okhsl[0], okhsl[1], okhsl[2]);

  const diff = [
    Math.abs(parsed[0] - roundTrip[0]) * 255,
    Math.abs(parsed[1] - roundTrip[1]) * 255,
    Math.abs(parsed[2] - roundTrip[2]) * 255,
  ];

  return {
    original: parsed,
    okhsl,
    roundTrip,
    maxDiff: Math.max(...diff),
  };
}
