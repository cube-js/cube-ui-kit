import { parseStyle, DIRECTIONS, filterMods } from '../utils/styles.js';

export function paddingStyle({ padding }) {
  if (typeof padding === 'number') {
    padding = `${padding}px`;
  }

  if (!padding) return '';

  if (padding === true) padding = '1x';

  let { values, mods } = parseStyle(padding);

  const directions = filterMods(mods, DIRECTIONS);

  if (!values.length) {
    values = ['var(--gap)'];
  }

  if (!directions.length) {
    return { padding: values.join(' ') };
  }

  return directions.reduce((styles, dir) => {
    const index = DIRECTIONS.indexOf(dir);

    styles[`padding-${dir}`] = values[index] || values[index % 2] || values[0];

    return styles;
  }, {});
}

paddingStyle.__lookupStyles = ['padding'];
