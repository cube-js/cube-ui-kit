import { DIRECTIONS, filterMods, parseStyle } from '../utils/styles';

/**
 * Parse a padding value and return the first processed value
 */
function parsePaddingValue(value: string | number | boolean): string | null {
  if (typeof value === 'number') return `${value}px`;
  if (!value) return null;
  if (value === true) value = '1x';

  const { values } = parseStyle(value).groups[0] ?? { values: [] };

  return values[0] || 'var(--gap)';
}

/**
 * Parse padding value with optional directions (like "1x top" or "2x left right")
 */
function parseDirectionalPadding(value: string | number | boolean): {
  values: string[];
  directions: string[];
} {
  if (typeof value === 'number') {
    return { values: [`${value}px`], directions: [] };
  }
  if (!value) return { values: [], directions: [] };
  if (value === true) value = '1x';

  const { values = [], mods = [] } = parseStyle(value).groups[0] ?? {};

  return {
    values: values.length ? values : ['var(--gap)'],
    directions: filterMods(mods, DIRECTIONS),
  };
}

export function paddingStyle({
  padding,
  paddingBlock,
  paddingInline,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
}: {
  padding?: string | number | boolean;
  paddingBlock?: string | number | boolean;
  paddingInline?: string | number | boolean;
  paddingTop?: string | number | boolean;
  paddingRight?: string | number | boolean;
  paddingBottom?: string | number | boolean;
  paddingLeft?: string | number | boolean;
}) {
  // If no padding is defined, return empty object
  if (
    padding == null &&
    paddingBlock == null &&
    paddingInline == null &&
    paddingTop == null &&
    paddingRight == null &&
    paddingBottom == null &&
    paddingLeft == null
  ) {
    return {};
  }

  // Initialize all directions to 0
  let [top, right, bottom, left] = ['0', '0', '0', '0'];

  // Priority 1 (lowest): padding
  if (padding != null) {
    const { values, directions } = parseDirectionalPadding(padding);

    if (values.length) {
      if (directions.length === 0) {
        top = values[0];
        right = values[1] || values[0];
        bottom = values[2] || values[0];
        left = values[3] || values[1] || values[0];
      } else {
        // Assign values to directions in the order they appear
        // e.g., 'right 1x top 2x' → right: 1x, top: 2x
        directions.forEach((dir, i) => {
          const val = values[i] ?? values[0];
          if (dir === 'top') top = val;
          else if (dir === 'right') right = val;
          else if (dir === 'bottom') bottom = val;
          else if (dir === 'left') left = val;
        });
      }
    }
  }

  // Priority 2 (medium): paddingBlock/paddingInline
  if (paddingBlock != null) {
    const val = parsePaddingValue(paddingBlock);
    if (val) top = bottom = val;
  }
  if (paddingInline != null) {
    const val = parsePaddingValue(paddingInline);
    if (val) left = right = val;
  }

  // Priority 3 (highest): individual directions
  if (paddingTop != null) {
    const val = parsePaddingValue(paddingTop);
    if (val) top = val;
  }
  if (paddingRight != null) {
    const val = parsePaddingValue(paddingRight);
    if (val) right = val;
  }
  if (paddingBottom != null) {
    const val = parsePaddingValue(paddingBottom);
    if (val) bottom = val;
  }
  if (paddingLeft != null) {
    const val = parsePaddingValue(paddingLeft);
    if (val) left = val;
  }

  // Optimize output: 1 value if all same, 2 values if top==bottom && left==right
  if (top === right && right === bottom && bottom === left) {
    return { padding: top };
  }
  if (top === bottom && left === right) {
    return { padding: `${top} ${left}` };
  }

  return { padding: `${top} ${right} ${bottom} ${left}` };
}

paddingStyle.__lookupStyles = [
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingBlock',
  'paddingInline',
];
