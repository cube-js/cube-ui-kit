import { DIRECTIONS, filterMods, parseStyle } from '../utils/styles';

export function insetStyle({ inset }) {
  if (typeof inset === 'number') {
    inset = `${inset}px`;
  }

  if (!inset) return;

  if (inset === true) inset = '0 0 0 0';

  const processed = parseStyle(inset);
  let { values, mods } =
    processed.groups[0] ?? ({ values: [], mods: [] } as any);

  let directions = filterMods(mods, DIRECTIONS);

  if (!values.length) {
    values = ['0'];
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
