/**
 * Convert HSL color string to RGB.
 * Supports: hsl(h s% l%), hsla(h, s%, l%, a), hsl(h s% l% / a)
 */
export function hslToRgb(hslStr: string): string | null {
  const match = hslStr.match(/hsla?\(([^)]+)\)/i);
  if (!match) return null;

  const inner = match[1].trim();
  const [colorPart, alphaPart] = inner.split('/');
  const parts = colorPart
    .trim()
    .split(/[,\s]+/)
    .filter(Boolean);

  if (parts.length < 3) return null;

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

  // HSL to RGB algorithm
  const a = s * Math.min(l, 1 - l);
  const f = (n: number): number => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };

  const r = Math.round(f(0) * 255);
  const g = Math.round(f(8) * 255);
  const b = Math.round(f(4) * 255);

  if (alphaPart) {
    const alpha = parseFloat(alphaPart.trim());
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return `rgb(${r} ${g} ${b})`;
}
