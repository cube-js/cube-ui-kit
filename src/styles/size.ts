import { parseStyle } from '../utils/styles';

export function sizeStyle({ size }) {
  if (!size) return '';

  const { values, mods } = parseStyle(size);

  let fontSize, lineHeight, letterSpacing;

  if (mods.length) {
    const mod = mods[0];

    fontSize = `var(--${mod}-font-size, inherit)`;
    lineHeight = `var(--${mod}-line-height, inherit)`;
    letterSpacing = `var(--${mod}-letter-spacing, 0)`;
  } else {
    fontSize = values[0] || 'var(--md-font-size)';
    lineHeight = values[1] || '1.5';
    letterSpacing = values[2] || '0';
  }

  return {
    'font-size': fontSize,
    'line-height': lineHeight,
    'letter-spacing': letterSpacing,
  };
}

sizeStyle.__lookupStyles = ['size'];
