import { createRule } from '../utils/styles';

export default function fontStyleStyle({ fontStyle }) {
  if (fontStyle !== 'inherit') {
    fontStyle = fontStyle ? 'italic' : 'normal';
  }

  return createRule('font-style', fontStyle);
}

fontStyleStyle.__styleLookup = ['fontStyle'];
