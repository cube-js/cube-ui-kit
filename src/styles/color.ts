import { parseColor } from '../utils/styles';

export function colorStyle({ color }) {
  if (!color) return '';

  if (color === true) color = 'currentColor';

  if (color.startsWith('#')) {
    color = parseColor(color).color || color;
  }

  const match = color.match(/var\(--(.+?)-color/);
  let name = '';

  if (match) {
    name = match[1];
  }

  const styles: any[] = [
    {
      'color': color,
    },
  ];

  if (name) {
    styles.push([
      {
        '--current-color': `var(--${name}-color)`,
        '--current-color-rgb': `var(--${name}-color-rgb)`,
      },
    ]);
  }

  return styles;
}

colorStyle.__lookupStyles = ['color'];
