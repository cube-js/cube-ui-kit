import { parseStyle } from '../utils/styles';

export function presetStyle({ preset }) {
  if (!preset) return '';

  if (preset === true) preset = '';

  const { mods } = parseStyle(preset);

  let fontSize, lineHeight, letterSpacing, fontWeight, textTransform;

  const name = mods[0] || 'default';

  fontSize = `var(--${name}-font-size, var(--initial-font-size, inherit))`;
  lineHeight = `var(--${name}-line-height, var(--initial-line-height, 1.5))`;
  letterSpacing = `var(--${name}-letter-spacing, var(--initial-letter-spacing, 0))`;
  fontWeight = `var(--${name}-font-weight, var(--initial-font-weight, 400))`;
  textTransform = `var(--${name}-text-transform, var(--initial-text-transform, none))`;

  return {
    'font-size': fontSize,
    'line-height': lineHeight,
    'letter-spacing': letterSpacing,
    'font-weight': fontWeight,
    'text-transform': textTransform,
    '--font-size': fontSize,
    '--line-height': lineHeight,
    '--letter-spacing': letterSpacing,
    '--font-weight': fontWeight,
    '--text-transform': textTransform,
  };
}

presetStyle.__lookupStyles = ['preset'];
