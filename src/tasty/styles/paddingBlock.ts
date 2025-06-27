import { parseStyle } from '../utils/styles';

export function paddingBlockStyle({
  paddingBlock: padding,
  paddingTop,
  paddingBottom,
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

  if (paddingTop == null) {
    styles['padding-top'] = values[0];
  }

  if (paddingBottom == null) {
    styles['padding-bottom'] = values[1] || values[0];
  }

  return styles;
}

paddingBlockStyle.__lookupStyles = [
  'paddingBlock',
  'paddingTop',
  'paddingBottom',
];
