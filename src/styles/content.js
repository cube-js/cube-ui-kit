import { createRule } from '../utils/styles';

export default function contentStyle({ content }) {
  if (!content) return '';

  return createRule('place-content', content);
}

contentStyle.__styleLookup = ['content'];
