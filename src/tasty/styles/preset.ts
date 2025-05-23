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
}: {
  preset?: string | boolean;
  fontSize?: string | number;
  lineHeight?: string | number;
  textTransform?: string;
  letterSpacing?: string | number;
  fontWeight?: string | number;
  fontStyle?: string;
  font?: string;
}) {
  if (!preset) return '';

  if (preset === true) preset = '';

  let { mods } = parseStyle(preset);

  const isStrong = mods.includes('strong');
  const isItalic = mods.includes('italic');
  const isIcon = mods.includes('icon');

  mods = mods.filter(
    (mod) => mod !== 'bold' && mod !== 'italic' && mod !== 'icon',
  );

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
  setCSSValue(styles, 'icon-size', name, true);

  if (isStrong) {
    styles['font-weight'] = 'var(--bold-font-weight)';
  }

  if (isItalic) {
    styles['font-style'] = 'italic';
  }

  if (isIcon) {
    styles['font-size'] = 'var(--icon-size)';
    styles['line-height'] = 'var(--icon-size)';
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
