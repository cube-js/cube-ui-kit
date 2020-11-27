import { createRule } from '../utils/styles';

export default function italicStyle({ italic }) {
  if (italic !== 'inherit') {
    italic = italic ? 'italic' : 'normal'
  }

  return createRule('font-style', italic);
}

italicStyle.__styleLookup = ['italic'];
