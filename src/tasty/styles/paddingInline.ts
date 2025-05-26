import { parseStyle } from '../utils/styles';

export function paddingInlineStyle({
  paddingInline: padding,
  paddingLeft,
  paddingRight,
}) {
  if (typeof padding === 'number') {
    padding = `${padding}px`;
  }

  if (!padding) return '';

  if (padding === true) padding = '1x';

  const processed = parseStyle(padding);
  let { values } = processed.groups[0] ?? ({ values: [] } as any);

  if (!values.length) {
    values = ['var(--gap)'];
  }

  const styles = {};

  if (paddingLeft == null) {
    styles['padding-left'] = values[0];
  }

  if (paddingRight == null) {
    styles['padding-right'] = values[1] || values[0];
  }

  return styles;
}

paddingInlineStyle.__lookupStyles = [
  'paddingInline',
  'paddingLeft',
  'paddingRight',
];
