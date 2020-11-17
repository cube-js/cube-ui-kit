import { createRule } from '../utils/styles';

export default function contentStyle({ content }) {
  return createRule('place-content', content);
}

contentStyle.__styleLookup = ['content'];
