import { parseStyle } from '../utils/styles';

function toBoxShadow(shadow) {
  const processed = parseStyle(shadow);
  const { values, mods, colors } =
    processed.groups[0] ?? ({ values: [], mods: [], colors: [] } as any);
  const mod = mods[0] || '';
  const shadowColor = (colors && colors[0]) ?? '';

  return [mod, ...values, shadowColor].join(' ');
}

export function shadowStyle({ shadow }) {
  if (!shadow) return;

  if (shadow === true) shadow = 'var(--card-shadow)';

  return {
    'box-shadow': shadow.split(',').map(toBoxShadow).join(','),
  };
}

shadowStyle.__lookupStyles = ['shadow'];
