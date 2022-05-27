import { parseStyle } from '../utils/styles';

export function presetStyle({
  preset,
  fontSize,
  lineHeight,
  textTransform,
  letterSpacing,
  fontWeight,
  fontStyle,
  font,
}) {
  if (!preset) return '';

  if (preset === true) preset = '';

  const { mods } = parseStyle(preset);

  const name = mods[0] || 'default';

  const styles: Record<string, any> = {};

  if (!fontSize) {
    styles['font-size'] = styles[
      '--font-size'
    ] = `var(--${name}-font-size, var(--initial-font-size, inherit))`;
  }

  if (!lineHeight) {
    styles['line-height'] = styles[
      '--line-height'
    ] = `var(--${name}-line-height, var(--initial-line-height, 1.5))`;
  }

  if (!letterSpacing) {
    styles['letter-spacing'] = styles[
      '--letter-spacing'
    ] = `var(--${name}-letter-spacing, var(--initial-letter-spacing, 0))`;
  }

  if (!fontWeight) {
    styles['font-weight'] = styles[
      '--font-weight'
    ] = `var(--${name}-font-weight, var(--initial-font-weight, 400))`;
  }

  if (!fontStyle) {
    styles['font-style'] = styles[
      '--font-style'
    ] = `var(--${name}-font-style, var(--initial-font-style, normal))`;
  }

  if (!textTransform) {
    styles['text-transform'] = styles[
      '--text-transform'
    ] = `var(--${name}-text-transform, var(--initial-text-transform, none))`;
  }

  if (!font) {
    styles['font-family'] = styles[
      '--font-family'
    ] = `var(--${name}-font-family, var(--font))`;
  }

  return styles;
}

presetStyle.__lookupStyles = [
  'preset',
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'textTransform',
  'fontWeight',
  'fontStyle',
  'font',
];
