import { createRule, parseStyle } from '../utils/styles';

export default function bgStyle({ fill }) {
  if (!fill) return '';

  if (fill.startsWith('#')) {
    fill = parseStyle(fill).color;
  }

  return createRule('background-color', fill);
}

bgStyle.__styleLookup = ['fill'];
