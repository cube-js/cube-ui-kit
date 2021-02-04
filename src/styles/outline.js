import { createRule, parseStyle } from '../utils/styles';

export default function outlineStyle({ outline }) {
  if (!outline && outline !== 0) return '';

  if (outline === true) outline = '1bw';

  const { values, color } = parseStyle(String(outline));

  const size = values[0] || 'var(--outline-width)';
  const outlineColor = color || 'var(--outline-color)';

  return createRule(
    '--local-outline-box-shadow',
    `0 0 0 ${size} ${outlineColor}`,
  );
}

outlineStyle.__styleLookup = ['outline'];
