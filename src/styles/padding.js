import { createRule, parseStyle, DIRECTIONS, filterMods } from '../utils/styles';

export default function paddingStyle({ padding }) {
  if (padding === true) padding = '1x';

  const { values, mods: allMods } = parseStyle(padding, 1);

  const mods = filterMods(allMods, DIRECTIONS);

  if (!mods.length) {
    return createRule('padding', values.join(' '));
  }

  return mods.reduce((styles, mod) => {
    const index = DIRECTIONS.indexOf(mod);

    styles += createRule(`padding-${mod}`, values[index] || values[index % 2] || values[0]);

    return styles;
  }, '');
}

paddingStyle.__styleLookup = ['padding'];
