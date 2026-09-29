import { renderWithRoot } from '../../../test';

import { Badge } from './Badge';

/** A computed CSS color as sRGB bytes, via a canvas so `oklch()` works too. */
function toRgb(color: string): number[] {
  const context = document.createElement('canvas').getContext('2d')!;

  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);

  return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)];
}

function luminance(color: string): number {
  const [r, g, b] = toRgb(color).map((byte) => {
    const c = byte / 255;

    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);

  return (high + 0.05) / (low + 0.05);
}

/**
 * Only a real engine resolves the scheme's tokens, and dark is where this
 * broke: the `disabled` fill is an adaptive text token that turns light there,
 * and a fixed `#white` label on it read 3.59:1.
 */
describe('Badge theme="disabled"', () => {
  afterEach(() => document.documentElement.removeAttribute('data-scheme'));

  it.each(['light', 'dark'])('keeps its label legible in %s', (scheme) => {
    document.documentElement.setAttribute('data-scheme', scheme);

    const { getByRole } = renderWithRoot(<Badge theme="disabled">Draft</Badge>);
    const style = getComputedStyle(getByRole('status'));

    expect(contrast(style.color, style.backgroundColor)).toBeGreaterThanOrEqual(
      4.5,
    );
  });
});
