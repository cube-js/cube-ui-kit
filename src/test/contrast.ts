/**
 * WCAG contrast between computed CSS colors, for browser specs: only a real
 * engine resolves the scheme's tokens, so a spec reads `getComputedStyle` and
 * measures what is on screen.
 */

/**
 * Colors painted over each other, bottom first, as sRGB bytes. A canvas does
 * the parsing and the alpha blending, so `oklch()` and translucent fills work.
 */
function paint(colors: string[]): number[] {
  const context = document.createElement('canvas').getContext('2d')!;

  for (const color of colors) {
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
  }

  return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)];
}

function luminance(colors: string[]): number {
  const [r, g, b] = paint(colors).map((byte) => {
    const c = byte / 255;

    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * The contrast of `foreground` over its `background`: one color, or the
 * layers under it, bottom first, when the nearest fill is translucent.
 */
export function contrast(foreground: string, ...background: string[]): number {
  const [high, low] = [
    luminance([...background, foreground]),
    luminance(background),
  ].sort((x, y) => y - x);

  return (high + 0.05) / (low + 0.05);
}
