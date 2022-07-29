import { parseStyle } from '../utils/styles';
import { Styles } from './types';

function setCSSValue(
  styles: Styles,
  styleName: string,
  presetName: string,
  isPropOnly = false,
) {
  styles[`--${styleName}`] =
    presetName === 'inherit'
      ? 'inherit'
      : `var(--${presetName}-${styleName}, var(--default-${styleName}, var(--font, inherit)))${
          styleName === 'font-family' ? ', var(--font)' : ''
        }`;

  if (!isPropOnly) {
    styles[styleName] = styles[`--${styleName}`];
  }
}

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

  const styles: Styles = {};

  if (!fontSize) {
    setCSSValue(styles, 'font-size', name);
  }

  if (!lineHeight) {
    setCSSValue(styles, 'line-height', name);
  }

  if (!letterSpacing) {
    setCSSValue(styles, 'letter-spacing', name);
  }

  if (!fontWeight) {
    setCSSValue(styles, 'font-weight', name);
  }

  if (!fontStyle) {
    setCSSValue(styles, 'font-style', name);
  }

  if (!textTransform) {
    setCSSValue(styles, 'text-transform', name);
  }

  if (!font) {
    setCSSValue(styles, 'font-family', name);
  }

  setCSSValue(styles, 'bold-font-weight', name, true);

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
