import { createRule, parseStyle } from '../utils/styles';

export default function sizeStyle({ size }) {
  if (!size) return '';

  const { values, mods } = parseStyle(size, 1);

  let fontSize, lineHeight;

  if (mods.length) {
    const mod = mods[0];

    fontSize = `var(--${mod}-font-size, inherit)`;
    lineHeight = `var(--${mod}-line-height, inherit)`;
  } else {
    fontSize = values[0] || 'var(--md-font-size)';
    lineHeight = values[1] || '1.5';
  }

  return [
    createRule('font-size', fontSize),
    createRule('line-height', lineHeight),
  ].join('');
}

sizeStyle.__styleLookup = ['size'];
