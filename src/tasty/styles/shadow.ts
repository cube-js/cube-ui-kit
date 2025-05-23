import { parseStyle } from '../utils/styles';

function toBoxShadow(shadow) {
  const { values, mods, colors } = parseStyle(shadow);
  const mod = mods[0] || '';
  const shadowColor = (colors && colors[0]) || 'var(--shadow-color)';

  return [mod, ...values, shadowColor].join(' ');
}

export function shadowStyle({ shadow }) {
  if (!shadow) return '';

  if (shadow === true) shadow = '0 5px 15px #shadow';

  return {
    'box-shadow': shadow.split(',').map(toBoxShadow).join(','),
  };
}

shadowStyle.__lookupStyles = ['shadow'];
