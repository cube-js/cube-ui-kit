import { parseColor } from '../utils/styles';

export function colorStyle({ color }) {
  if (!color) return '';

  if (color === true) color = 'currentColor';

  if (typeof color === 'string' && color.startsWith('#')) {
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

  if (name) {
    Object.assign(styles, {
      '--current-color': `var(--${name}-color, ${name})`,
      '--current-color-rgb': `var(--${name}-color-rgb)`,
    });
  }

  return styles;
}

colorStyle.__lookupStyles = ['color'];
