import { createRule, parseStyle } from '../utils/styles';

export default function sizeStyle({ size }) {
  if (!size) return '';

  const { values, mods } = parseStyle(size, 1);

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

  return [
    createRule('font-size', fontSize),
    createRule('line-height', lineHeight),
    createRule('letter-spacing', letterSpacing),
  ].join('');
}

sizeStyle.__styleLookup = ['size'];
