import { parseStyle, DIRECTIONS, filterMods } from '../utils/styles';

export function marginStyle({
  margin,
  marginBlock,
  marginInline,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
}) {
  if (typeof margin === 'number') {
    margin = `${margin}px`;
  }

  if (!margin) return '';

  if (margin === true) margin = '1x';

  let { values, mods } = parseStyle(margin);

  let directions = filterMods(mods, DIRECTIONS);

  if (!values.length) {
    values = ['var(--gap)'];
  }

  if (!directions.length) {
    directions = DIRECTIONS;
  }

  const marginDirs = [marginTop, marginRight, marginBottom, marginLeft];

  return directions.reduce((styles, dir) => {
    const index = DIRECTIONS.indexOf(dir);

    if (
      ((!!(index % 2) && marginInline == null)
        || (!(index % 2) && marginBlock == null))
      && marginDirs[index] == null
    ) {
      styles[`margin-${dir}`]
        = values[index] || values[index % 2] || values[0];
    }

    return styles;
  }, {});
}

marginStyle.__lookupStyles = [
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginBlock',
  'marginInline',
];
