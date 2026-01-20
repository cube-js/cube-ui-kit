import { DIRECTIONS, filterMods, parseStyle } from '../utils/styles';

/**
 * Parse an inset value and return the first processed value
 */
function parseInsetValue(value: string | number | boolean): string | null {
  if (typeof value === 'number') return `${value}px`;
  if (!value) return null;
  if (value === true) value = '0';

  const { values } = parseStyle(value).groups[0] ?? { values: [] };

  return values[0] || '0';
}

/**
 * Parse inset value with optional directions (like "1x top" or "2x left right")
 */
function parseDirectionalInset(value: string | number | boolean): {
  values: string[];
  directions: string[];
} {
  if (typeof value === 'number') {
    return { values: [`${value}px`], directions: [] };
  }
  if (!value) return { values: [], directions: [] };
  if (value === true) value = '0';

  const { values = [], mods = [] } = parseStyle(value).groups[0] ?? {};

  return {
    values: values.length ? values : ['0'],
    directions: filterMods(mods, DIRECTIONS),
  };
}

/**
 * Inset style handler.
 *
 * IMPORTANT: This handler uses individual CSS properties (top, right, bottom, left)
 * when only individual direction props are specified. This allows CSS cascade to work
 * correctly when modifiers override only some directions.
 *
 * Example problem with using `inset` shorthand everywhere:
 *   styles: {
 *     top: { '': 0, 'side=bottom': 'initial' },
 *     right: { '': 0, 'side=left': 'initial' },
 *     bottom: { '': 0, 'side=top': 'initial' },
 *     left: { '': 0, 'side=right': 'initial' },
 *   }
 *
 * If we output `inset` for both cases:
 *   - Default: inset: 0 0 0 0
 *   - side=bottom: inset: initial auto auto auto  ← WRONG! Overrides all 4 directions
 *
 * With individual properties:
 *   - Default: top: 0; right: 0; bottom: 0; left: 0
 *   - side=bottom: top: initial  ← CORRECT! Only overrides top
 *
 * The `inset` shorthand is only used when the base `inset` prop is specified
 * OR when `insetBlock`/`insetInline` are used (which imply setting pairs).
 */
export function insetStyle({
  inset,
  insetBlock,
  insetInline,
  top,
  right,
  bottom,
  left,
}: {
  inset?: string | number | boolean;
  insetBlock?: string | number | boolean;
  insetInline?: string | number | boolean;
  top?: string | number | boolean;
  right?: string | number | boolean;
  bottom?: string | number | boolean;
  left?: string | number | boolean;
}) {
  // If no props are defined, return empty object
  if (
    inset == null &&
    insetBlock == null &&
    insetInline == null &&
    top == null &&
    right == null &&
    bottom == null &&
    left == null
  ) {
    return {};
  }

  // When only individual direction props are used (no inset, insetBlock, insetInline),
  // output individual CSS properties to allow proper CSS cascade with modifiers
  const onlyIndividualProps =
    inset == null && insetBlock == null && insetInline == null;

  if (onlyIndividualProps) {
    const result: Record<string, string> = {};

    if (top != null) {
      const val = parseInsetValue(top);
      if (val) result['top'] = val;
    }
    if (right != null) {
      const val = parseInsetValue(right);
      if (val) result['right'] = val;
    }
    if (bottom != null) {
      const val = parseInsetValue(bottom);
      if (val) result['bottom'] = val;
    }
    if (left != null) {
      const val = parseInsetValue(left);
      if (val) result['left'] = val;
    }

    return result;
  }

  // When inset, insetBlock, or insetInline is used, use the shorthand approach
  // Initialize all directions to auto
  let [topVal, rightVal, bottomVal, leftVal] = ['auto', 'auto', 'auto', 'auto'];

  // Priority 1 (lowest): inset
  if (inset != null) {
    const { values, directions } = parseDirectionalInset(inset);

    if (values.length) {
      if (directions.length === 0) {
        topVal = values[0];
        rightVal = values[1] || values[0];
        bottomVal = values[2] || values[0];
        leftVal = values[3] || values[1] || values[0];
      } else {
        for (const dir of directions) {
          const idx = DIRECTIONS.indexOf(dir);
          const val = values[idx] || values[idx % 2] || values[0];
          if (dir === 'top') topVal = val;
          else if (dir === 'right') rightVal = val;
          else if (dir === 'bottom') bottomVal = val;
          else if (dir === 'left') leftVal = val;
        }
      }
    }
  }

  // Priority 2 (medium): insetBlock/insetInline
  if (insetBlock != null) {
    const val = parseInsetValue(insetBlock);
    if (val) topVal = bottomVal = val;
  }
  if (insetInline != null) {
    const val = parseInsetValue(insetInline);
    if (val) leftVal = rightVal = val;
  }

  // Priority 3 (highest): individual directions
  if (top != null) {
    const val = parseInsetValue(top);
    if (val) topVal = val;
  }
  if (right != null) {
    const val = parseInsetValue(right);
    if (val) rightVal = val;
  }
  if (bottom != null) {
    const val = parseInsetValue(bottom);
    if (val) bottomVal = val;
  }
  if (left != null) {
    const val = parseInsetValue(left);
    if (val) leftVal = val;
  }

  // Optimize output: 1 value if all same, 2 values if top==bottom && left==right
  if (topVal === rightVal && rightVal === bottomVal && bottomVal === leftVal) {
    return { inset: topVal };
  }
  if (topVal === bottomVal && leftVal === rightVal) {
    return { inset: `${topVal} ${leftVal}` };
  }

  return { inset: `${topVal} ${rightVal} ${bottomVal} ${leftVal}` };
}

insetStyle.__lookupStyles = [
  'inset',
  'insetBlock',
  'insetInline',
  'top',
  'right',
  'bottom',
  'left',
];
