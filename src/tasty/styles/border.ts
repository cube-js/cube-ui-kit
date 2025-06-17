import { StyleDetails } from '../../parser/types';
import { DIRECTIONS, filterMods, parseStyle } from '../utils/styles';

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
 * @param border
 * @return {{border: string}|*}
 */
export function borderStyle({ border }) {
  if (!border && border !== 0) return;

  if (border === true) border = '1bw';

  const processed = parseStyle(String(border));
  const { values, mods, colors } =
    processed.groups[0] ??
    ({ values: [], mods: [], colors: [] } as Pick<
      StyleDetails,
      'values' | 'mods' | 'colors'
    >);

  const directions = filterMods(mods, DIRECTIONS);
  const typeMods = filterMods(mods, BORDER_STYLES);

  const value = values[0] || 'var(--border-width)';
  const type = typeMods[0] || 'solid';
  const borderColor = (colors && colors[0]) || 'var(--border-color)';

  const styleValue = [value, type, borderColor].join(' ');

  if (!directions.length) {
    return { border: styleValue };
  }

  const zeroValue = [0, type, borderColor].join(' ');

  return DIRECTIONS.reduce((styles, dir) => {
    if (mods.includes(dir)) {
      styles[`border-${dir}`] = styleValue;
    } else {
      styles[`border-${dir}`] = zeroValue;
    }

    return styles;
  }, {});
}

borderStyle.__lookupStyles = ['border'];
