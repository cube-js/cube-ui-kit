import { createRule, parseStyle } from '../utils/styles';

export default function shadowStyle({ shadow }) {
  if (shadow === true) shadow = '0 3x 4x #shadow';

  const { values, mods, color } = parseStyle(shadow);

  const mod = mods[0] || '';
  const shadowColor = color || 'var(--shadow-color)';

  return createRule('box-shadow', [mod, ...values, shadowColor].join(' '));
}

shadowStyle.__styleLookup = ['shadow'];
