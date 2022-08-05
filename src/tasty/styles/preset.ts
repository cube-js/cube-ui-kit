import { parseStyle } from '../utils/styles';
import { Styles } from './types';

function setCSSValue(
  styles: Styles,
  styleName: string,
  presetName: string,
  isPropOnly = false,
) {
  styles[`--${styleName}`] = (() => {
    if (presetName === 'inherit') {
      return 'inherit';
    }

    const defaultValue = `var(--default-${styleName}, ${
      styleName === 'font-family'
        ? 'var(--font, NonexistentFontName)'
        : 'inherit'
    })`;
    const fontSuffix =
      styleName === 'font-family' ? ', var(--font, sans-serif)' : '';

    if (presetName === 'default') {
      return `${defaultValue}${fontSuffix}`;
    } else {
      return `var(--${presetName}-${styleName}, ${defaultValue})${fontSuffix}`;
    }
  })();

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
