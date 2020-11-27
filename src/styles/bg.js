import { createRule, parseStyle } from '../utils/styles';

export default function bgStyle({ bg }) {
  if (!bg) return '';

  if (bg.startsWith('#')) {
    bg = parseStyle(bg).color;
  }

  return createRule('background-color', bg);
}

bgStyle.__styleLookup = ['bg'];
