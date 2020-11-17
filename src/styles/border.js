import { createRule, parseStyle } from '../utils/styles';

export default function borderStyle({ border }) {
  if (border === true) border = '1bw';

  const { values, mods, color } = parseStyle(border);

  const value = values[0] || 'var(--border-width)';
  const mod = mods[0] || 'solid';
  const borderColor = color || 'var(--border-color)';

  return createRule('border', [value, mod, borderColor].join(' '));
}

borderStyle.__styleLookup = ['border'];
