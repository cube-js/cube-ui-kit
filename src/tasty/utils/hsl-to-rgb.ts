import { hslToRgbValues } from './process-tokens';

/**
 * Convert HSL color string to RGB.
 * Supports:
 * - Modern: hsl(h s% l%), hsl(h s% l% / a)
 * - Legacy: hsl(h, s%, l%), hsla(h, s%, l%, a)
 */
export function hslToRgb(hslStr: string): string | null {
  const match = hslStr.match(/hsla?\(([^)]+)\)/i);
  if (!match) return null;

  const inner = match[1].trim();
  const [colorPart, slashAlpha] = inner.split('/');
  const parts = colorPart
    .trim()
    .split(/[,\s]+/)
    .filter(Boolean);

  if (parts.length < 3) return null;

  // Alpha can come from slash notation (modern) or 4th part (legacy comma syntax)
  const alphaPart = slashAlpha?.trim() || (parts.length >= 4 ? parts[3] : null);

  // Parse hue
  let h = parseFloat(parts[0]);
  const hueStr = parts[0].toLowerCase();
  if (hueStr.endsWith('turn')) h = parseFloat(hueStr) * 360;
  else if (hueStr.endsWith('rad')) h = (parseFloat(hueStr) * 180) / Math.PI;
  h = ((h % 360) + 360) % 360;

  // Parse saturation and lightness
  const parsePercent = (val: string): number => {
    const num = parseFloat(val);
    return val.includes('%') ? num / 100 : num;
  };
  const s = Math.max(0, Math.min(1, parsePercent(parts[1])));
  const l = Math.max(0, Math.min(1, parsePercent(parts[2])));

  // Use shared HSL to RGB conversion
  const [r, g, b] = hslToRgbValues(h, s, l);

  if (alphaPart) {
    const alpha = parseFloat(alphaPart.trim());
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
  }

  return `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;
}
