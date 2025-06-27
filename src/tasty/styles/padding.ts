import { DIRECTIONS, filterMods, parseStyle } from '../utils/styles';

export function paddingStyle({
  padding,
  paddingBlock,
  paddingInline,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
}: {
  padding?: string | number | boolean | string[];
  paddingBlock?: string;
  paddingInline?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
}) {
  if (Array.isArray(padding)) {
    return {
      'padding-top': padding[0],
      'padding-right': padding[1] || padding[0],
      'padding-bottom': padding[2] || padding[0],
      'padding-left': padding[3] || padding[1] || padding[0],
    };
  }

  if (typeof padding === 'number') {
    padding = `${padding}px`;
  }

  if (!padding) return '';

  if (padding === true) padding = '1x';

  const processed = parseStyle(padding);
  let { values, mods } =
    processed.groups[0] ?? ({ values: [], mods: [] } as any);

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
      ((!!(index % 2) && paddingInline == null) ||
        (!(index % 2) && paddingBlock == null)) &&
      paddingDirs[index] == null
    ) {
      styles[`padding-${dir}`] =
        values[index] || values[index % 2] || values[0];
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
