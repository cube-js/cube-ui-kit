import { parseStyle, DIRECTIONS, filterMods } from '../utils/styles';

export function marginStyle({ margin }) {
  if (typeof margin === 'number') {
    margin = `${margin}px`;
  }

  if (!margin) return '';

  if (margin === true) margin = '1x';

  const { values, mods } = parseStyle(margin);

  const directions = filterMods(mods, DIRECTIONS);

  if (!directions.length) {
    return { margin: values.join(' ') };
  }

  return directions.reduce((styles, dir) => {
    const index = DIRECTIONS.indexOf(dir);

    styles[`margin-${dir}`] = values[index] || values[index % 2] || values[0];

    return styles;
  }, {});
}

marginStyle.__lookupStyles = ['margin'];
