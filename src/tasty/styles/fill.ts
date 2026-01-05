import { parseStyle } from '../utils/styles';

export function fillStyle({ fill }) {
  if (!fill) return '';

  const processed = parseStyle(fill);
  fill = processed.groups[0]?.colors[0] || fill;

  return { 'background-color': fill };
}

fillStyle.__lookupStyles = ['fill'];
