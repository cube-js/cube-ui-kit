/**
 * OKHSL string → RGB string conversion.
 *
 * Parses CSS `okhsl(...)` strings and converts them to `rgb(...)` or `rgba(...)`.
 */

import { okhslToSrgb } from './okhsl-color-math';

/**
 * Convert OKHSL color string to RGB.
 * Input: `okhsl(H S% L%)` or `okhsl(H S% L% / alpha)`
 * Output: `rgb(R G B)` or `rgba(R, G, B, alpha)`
 */
export function okhslToRgb(okhslStr: string): string | null {
  const match = okhslStr.match(/okhsl\(([^)]+)\)/i);
  if (!match) return null;

  const inner = match[1].trim();
  const [colorPart, alphaPart] = inner.split('/');
  const parts = colorPart
    .trim()
    .split(/[,\s]+/)
    .filter(Boolean);

  if (parts.length < 3) return null;

  // Parse hue (can have units)
  let h = parseFloat(parts[0]);
  const hueStr = parts[0].toLowerCase();
  if (hueStr.endsWith('turn')) h = parseFloat(hueStr) * 360;
  else if (hueStr.endsWith('rad')) h = (parseFloat(hueStr) * 180) / Math.PI;
  else if (hueStr.endsWith('deg')) h = parseFloat(hueStr);

  // Parse saturation and lightness (percentages)
  const parsePercent = (val: string): number => {
    const num = parseFloat(val);
    return val.includes('%') ? num / 100 : num;
  };
  const s = Math.max(0, Math.min(1, parsePercent(parts[1])));
  const l = Math.max(0, Math.min(1, parsePercent(parts[2])));

  const [r, g, b] = okhslToSrgb(h, s, l);

  const r255 = Math.round(Math.max(0, Math.min(1, r)) * 255);
  const g255 = Math.round(Math.max(0, Math.min(1, g)) * 255);
  const b255 = Math.round(Math.max(0, Math.min(1, b)) * 255);

  if (alphaPart) {
    const alpha = parseFloat(alphaPart.trim());
    return `rgba(${r255}, ${g255}, ${b255}, ${alpha})`;
  }

  return `rgb(${r255} ${g255} ${b255})`;
}
