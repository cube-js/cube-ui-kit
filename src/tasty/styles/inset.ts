import { parseStyle, DIRECTIONS, filterMods } from '../utils/styles';

export function insetStyle({ inset }) {
  if (typeof inset === 'number') {
    inset = `${inset}px`;
  }

  if (!inset) return '';

  if (inset === true) inset = '1x';

  let { values, mods } = parseStyle(inset);

  let directions = filterMods(mods, DIRECTIONS);

  if (!values.length) {
    values = ['var(--gap)'];
  }

  if (!directions.length) {
    directions = DIRECTIONS;
  }

  return directions.reduce((styles, dir, index) => {
    styles[dir] = values[index] || values[index % 2] || values[0];
    return styles;
  }, {});
}

insetStyle.__lookupStyles = ['inset'];
