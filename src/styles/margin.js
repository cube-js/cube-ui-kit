import {
  createRule,
  parseStyle,
  DIRECTIONS,
  filterMods,
} from '../utils/styles';

export default function marginStyle({ margin }) {
  if (!margin && margin !== 0) return '';

  if (margin === true) margin = '1x';

  if (typeof margin === 'number') {
    margin = `${margin}x`;
  }

  const { values, mods } = parseStyle(margin, 1);

  const directions = filterMods(mods, DIRECTIONS);

  if (!directions.length) {
    return createRule('margin', values.join(' '));
  }

  return directions.reduce((styles, dir) => {
    const index = DIRECTIONS.indexOf(dir);

    styles += createRule(
      `margin-${dir}`,
      values[index] || values[index % 2] || values[0],
    );

    return styles;
  }, '');
}

marginStyle.__styleLookup = ['margin'];
