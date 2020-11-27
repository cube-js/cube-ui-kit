import { createRule, parseColor } from '../utils/styles';

export default function colorStyle({ color }) {
  if (!color) return '';

  color = parseColor(color).color;

  return createRule('color', color);
}

colorStyle.__styleLookup = ['color'];
