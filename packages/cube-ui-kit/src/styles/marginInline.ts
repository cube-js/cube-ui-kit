import { parseStyle } from '../utils/styles';

export function marginInlineStyle({
  marginInline: margin,
  marginLeft,
  marginRight,
}) {
  if (typeof margin === 'number') {
    margin = `${margin}px`;
  }

  if (!margin) return '';

  if (margin === true) margin = '1x';

  let { values } = parseStyle(margin);

  if (!values.length) {
    values = ['var(--gap)'];
  }

  const styles = {};

  if (marginLeft == null) {
    styles['margin-left'] = values[0];
  }

  if (marginRight == null) {
    styles['margin-right'] = values[1] || values[0];
  }

  return styles;
}

marginInlineStyle.__lookupStyles = [
  'marginInline',
  'marginLeft',
  'marginRight',
];
