import { parseColor } from '../utils/styles';

import { convertColorChainToRgbChain } from './createStyle';

export function colorStyle({ color }) {
  if (!color) return;

  if (color === true) color = 'currentColor';

  // Handle color values that need parsing:
  // - Simple color tokens: #placeholder
  // - Color fallback syntax: (#placeholder, #dark-04)
  if (
    typeof color === 'string' &&
    (color.startsWith('#') || color.startsWith('(#'))
  ) {
    color = parseColor(color).color || color;
  }

  const match = color.match(/var\(--(.+?)-color/);
  let name = '';

  if (match) {
    name = match[1];
  }

  const styles = {
    color: color,
  };

  if (name && name !== 'current') {
    Object.assign(styles, {
      '--current-color': color,
      '--current-color-rgb': convertColorChainToRgbChain(color),
    });
  }

  return styles;
}

colorStyle.__lookupStyles = ['color'];
