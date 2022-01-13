import { parseStyle } from '../utils/styles';

export function marginBlockStyle({
  marginBlock: margin,
  marginTop,
  marginBottom,
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

  if (marginTop == null) {
    styles['margin-top'] = values[0];
  }

  if (marginBottom == null) {
    styles['margin-bottom'] = values[1] || values[0];
  }

  return styles;
}

marginBlockStyle.__lookupStyles = [
  'marginBlock',
  'marginTop',
  'marginBottom',
];
