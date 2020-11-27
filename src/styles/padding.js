import {
  createRule,
  parseStyle,
  DIRECTIONS,
  filterMods,
} from '../utils/styles';

export default function paddingStyle({ padding }) {
  if (padding === true) padding = '1x';

  if (typeof padding === 'number') {
    padding = `${padding}x`;
  }

  const { values, mods } = parseStyle(padding, 1);

  const directions = filterMods(mods, DIRECTIONS);

  if (!directions.length) {
    return createRule('padding', values.join(' '));
  }

  return directions.reduce((styles, dir) => {
    const index = DIRECTIONS.indexOf(dir);

    styles += createRule(
      `padding-${dir}`,
      values[index] || values[index % 2] || values[0],
    );

    return styles;
  }, '');
}

paddingStyle.__styleLookup = ['padding'];
