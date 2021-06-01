import { DIRECTIONS, filterMods, parseStyle } from '../utils/styles.js';

/**
 *
 * @param border
 * @return {{border: string}|*}
 */
export function borderStyle({ border }) {
  if (!border && border !== 0) return;

  if (border === true) border = '1bw';

  const { values, mods, color } = parseStyle(String(border));

  const directions = filterMods(mods, DIRECTIONS);
  const typeMods = mods.filter((m) => !directions.includes(m));

  const value = values[0] || 'var(--border-width)';
  const type = typeMods[0] || 'solid';
  const borderColor = color || 'var(--border-color)';

  const styleValue = [value, type, borderColor].join(' ');

  if (!directions.length) {
    return { border: styleValue };
  }

  return mods.reduce((styles, dir) => {
    styles[`border-${dir}`] = styleValue;

    return styles;
  }, {});
}

borderStyle.__lookupStyles = ['border'];
