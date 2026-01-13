import { DIRECTIONS, filterMods, parseStyle } from '../utils/styles';

/**
 * Parse a margin value and return the first processed value
 */
function parseMarginValue(value: string | number | boolean): string | null {
  if (typeof value === 'number') return `${value}px`;
  if (!value) return null;
  if (value === true) value = '1x';

  const { values } = parseStyle(value).groups[0] ?? { values: [] };

  return values[0] || 'var(--gap)';
}

/**
 * Parse margin value with optional directions (like "1x top" or "2x left right")
 */
function parseDirectionalMargin(value: string | number | boolean): {
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

export function marginStyle({
  margin,
  marginBlock,
  marginInline,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
}: {
  margin?: string | number | boolean;
  marginBlock?: string | number | boolean;
  marginInline?: string | number | boolean;
  marginTop?: string | number | boolean;
  marginRight?: string | number | boolean;
  marginBottom?: string | number | boolean;
  marginLeft?: string | number | boolean;
}) {
  // If no margin is defined, return empty object
  if (
    margin == null &&
    marginBlock == null &&
    marginInline == null &&
    marginTop == null &&
    marginRight == null &&
    marginBottom == null &&
    marginLeft == null
  ) {
    return {};
  }

  // Initialize all directions to 0
  let [top, right, bottom, left] = ['0', '0', '0', '0'];

  // Priority 1 (lowest): margin
  if (margin != null) {
    const { values, directions } = parseDirectionalMargin(margin);

    if (values.length) {
      if (directions.length === 0) {
        top = values[0];
        right = values[1] || values[0];
        bottom = values[2] || values[0];
        left = values[3] || values[1] || values[0];
      } else {
        for (const dir of directions) {
          const idx = DIRECTIONS.indexOf(dir);
          const val = values[idx] || values[idx % 2] || values[0];
          if (dir === 'top') top = val;
          else if (dir === 'right') right = val;
          else if (dir === 'bottom') bottom = val;
          else if (dir === 'left') left = val;
        }
      }
    }
  }

  // Priority 2 (medium): marginBlock/marginInline
  if (marginBlock != null) {
    const val = parseMarginValue(marginBlock);
    if (val) top = bottom = val;
  }
  if (marginInline != null) {
    const val = parseMarginValue(marginInline);
    if (val) left = right = val;
  }

  // Priority 3 (highest): individual directions
  if (marginTop != null) {
    const val = parseMarginValue(marginTop);
    if (val) top = val;
  }
  if (marginRight != null) {
    const val = parseMarginValue(marginRight);
    if (val) right = val;
  }
  if (marginBottom != null) {
    const val = parseMarginValue(marginBottom);
    if (val) bottom = val;
  }
  if (marginLeft != null) {
    const val = parseMarginValue(marginLeft);
    if (val) left = val;
  }

  // Optimize output: 1 value if all same, 2 values if top==bottom && left==right
  if (top === right && right === bottom && bottom === left) {
    return { margin: top };
  }
  if (top === bottom && left === right) {
    return { margin: `${top} ${left}` };
  }

  return { margin: `${top} ${right} ${bottom} ${left}` };
}

marginStyle.__lookupStyles = [
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginBlock',
  'marginInline',
];
