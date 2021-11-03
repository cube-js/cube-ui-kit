import { parseStyle, DIRECTIONS, filterMods } from '../utils/styles';

export function paddingStyle({
  padding,
  paddingBlock,
  paddingInline,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
}) {
  if (typeof padding === 'number') {
    padding = `${padding}px`;
  }

  if (!padding) return '';

  if (padding === true) padding = '1x';

  let { values, mods } = parseStyle(padding);

  let directions = filterMods(mods, DIRECTIONS);

  if (!values.length) {
    values = ['var(--gap)'];
  }

  if (!directions.length) {
    directions = DIRECTIONS;
  }

  const paddingDirs = [paddingTop, paddingRight, paddingBottom, paddingLeft];

  return directions.reduce((styles, dir) => {
    const index = DIRECTIONS.indexOf(dir);

    if (
      ((!!(index % 2) && paddingInline == null)
        || (!(index % 2) && paddingBlock == null))
      && paddingDirs[index] == null
    ) {
      styles[`padding-${dir}`]
        = values[index] || values[index % 2] || values[0];
    }

    return styles;
  }, {});
}

paddingStyle.__lookupStyles = [
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingBlock',
  'paddingInline',
];
