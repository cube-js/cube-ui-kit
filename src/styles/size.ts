import { parseStyle } from '../utils/styles';

export function sizeStyle({ size, fontSize, lineHeight, letterSpacing }) {
  if (!size) return '';

  const { values, mods } = parseStyle(size);

  if (fontSize || lineHeight || letterSpacing) {
    console.log(
      'CubeUIKit: unable to use `fontSize`, `lineHeight` and `letterSpacing` styles simultaneously with `size` style.',
    );
  }

  if (mods.length) {
    fontSize = `var(--${mods[0] || 'default'}-font-size, inherit)`;
    lineHeight = `var(--${
      mods[1] || mods[0] || 'default'
    }-line-height, inherit)`;
    letterSpacing = `var(--${
      mods[2] || mods[1] || mods[0] || 'default'
    }-letter-spacing, 0)`;
  } else {
    fontSize = values[0] || 'var(--default-font-size, inherit)';
    lineHeight = values[1] || 'var(--default-line-height, inherit)';
    letterSpacing = values[2] || 'var(--default-letter-spacing, 0)';
  }

  return {
    'font-size': fontSize,
    'line-height': lineHeight,
    'letter-spacing': letterSpacing,
    '--font-size': fontSize,
    '--line-height': lineHeight,
    '--letter-spacing': letterSpacing,
  };
}

sizeStyle.__lookupStyles = ['size', 'fontSize', 'lineHeight', 'letterSpacing'];
