import { parseStyle } from '../utils/styles.js';

export function shadowStyle({ shadow }) {
  if (!shadow) return '';

  if (shadow === true) shadow = '0 5px 15px #shadow';

  const { values, mods, color } = parseStyle(shadow);

  const mod = mods[0] || '';
  const shadowColor = color || 'var(--shadow-color)';

  return {
    '--local-shadow-box-shadow': [mod, ...values, shadowColor].join(' '),
  };
}

shadowStyle.__lookupStyles = ['shadow'];
