import { filterMods, parseStyle } from '../utils/styles';

const BORDER_STYLES = [
  'none',
  'hidden',
  'dotted',
  'dashed',
  'solid',
  'double',
  'groove',
  'ridge',
  'inset',
  'outset',
];

/**
 *
 * @param outline
 * @return {{outline: string}|*}
 */
export function outlineStyle({ outline }) {
  if (!outline && outline !== 0) return;

  if (outline === true) outline = '1ow';

  const { values, mods, color } = parseStyle(String(outline));

  const typeMods = filterMods(mods, BORDER_STYLES);

  const value = values[0] || 'var(--outline-width)';
  const type = typeMods[0] || 'solid';
  const outlineColor = color || 'var(--outline-color)';

  const styleValue = [value, type, outlineColor].join(' ');

  return { outline: styleValue };
}

outlineStyle.__lookupStyles = ['outline'];
