import { parseStyle } from '../utils/styles';

export function fillStyle({ fill }) {
  if (!fill) return '';

  const processed = parseStyle(fill);
  fill = processed.groups[0]?.colors[0] || fill;

  return { 'background-color': fill };
}

fillStyle.__lookupStyles = ['fill'];

export function svgFillStyle({ svgFill }) {
  if (!svgFill) return '';

  const processed = parseStyle(svgFill);
  svgFill = processed.groups[0]?.colors[0] || svgFill;

  return { fill: svgFill };
}

svgFillStyle.__lookupStyles = ['svgFill'];
