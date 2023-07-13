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

const SETTINGS_DEFAULT_MAP = {
  wght: 400,
};
function setVariationSetting(
  styles: Styles,
  setting: string,
  presetName: string,
  isPropOnly = false,
) {
  styles[
    `--font-variation-${setting}`
  ] = `var(--${presetName}-font-variation-${setting}, var(--default-font-variation-${setting}, ${
    SETTINGS_DEFAULT_MAP[setting] || 'initial'
  }))`;

  if (!isPropOnly) {
    styles[
      'font-variation-settings'
    ] = `'${setting}' var(--font-variation-${setting}, 400)`;
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
  fontVariationWeight,
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

  setVariationSetting(styles, 'wght', name);

  setCSSValue(styles, 'bold-font-weight', name, true);
  setCSSValue(styles, 'icon-size', name, true);

  return styles;
}

presetStyle.__lookupStyles = [
  'preset',
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'textTransform',
  'fontWeight',
  'fontVariationWeight',
  'fontStyle',
  'font',
];
