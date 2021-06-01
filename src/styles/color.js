import { parseColor } from '../utils/styles.js';

export function colorStyle({ color }) {
  if (!color) return '';

  color = parseColor(color).color;

  return { color };
}

colorStyle.__lookupStyles = ['color'];
