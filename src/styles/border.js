import { createRule, DIRECTIONS, filterMods, parseStyle } from '../utils/styles';

export default function borderStyle({ border }) {
  if (!border) return '';

  if (border === true) border = '1bw';

  const { values, mods, color } = parseStyle(border);

  const directions = filterMods(mods, DIRECTIONS);
  const typeMods = mods.filter(m => !directions.includes(m));

  const value = values[0] || 'var(--border-width)';
  const type = typeMods[0] || 'solid';
  const borderColor = color || 'var(--border-color)';

  const styleValue = [value, type, borderColor].join(' ');

  if (!directions.length) {
    return createRule('border', styleValue);
  }

  return mods.reduce((styles, dir) => {
    styles += createRule(`border-${dir}`, styleValue);

    return styles;
  }, '');
}

borderStyle.__styleLookup = ['border'];
