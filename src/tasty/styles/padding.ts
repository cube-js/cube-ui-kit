import { DIRECTIONS, filterMods, parseStyle } from '../utils/styles';

/**
 * Parse a padding value and return processed values
 */
function parsePaddingValue(value: string | number | boolean): string[] {
  if (typeof value === 'number') {
    return [`${value}px`];
  }

  if (!value) return [];

  if (value === true) value = '1x';

  const processed = parseStyle(value);
  let { values } = processed.groups[0] ?? ({ values: [] } as any);

  if (!values.length) {
    values = ['var(--gap)'];
  }

  return values;
}

/**
 * Parse directional padding value (like "1x top" or "2x left right")
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

  const processed = parseStyle(value);
  let { values, mods } =
    processed.groups[0] ?? ({ values: [], mods: [] } as any);

  if (!values.length) {
    values = ['var(--gap)'];
  }

  const directions = filterMods(mods, DIRECTIONS);

  return { values, directions };
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
  // Check if any padding property is defined
  const hasAnyPadding =
    padding != null ||
    paddingBlock != null ||
    paddingInline != null ||
    paddingTop != null ||
    paddingRight != null ||
    paddingBottom != null ||
    paddingLeft != null;

  // If no padding is defined, return empty object
  if (!hasAnyPadding) {
    return {};
  }

  // Initialize with all directions set to 0, then override as needed
  const styles: { [key: string]: string } = {
    'padding-top': '0',
    'padding-right': '0',
    'padding-bottom': '0',
    'padding-left': '0',
  };

  // Priority 1 (lowest): padding - apply to all directions if no other properties are specified
  if (padding != null) {
    // Parse directional padding (e.g., "1x top" or "2x left right")
    const { values, directions } = parseDirectionalPadding(padding);

    if (directions.length === 0) {
      // No directions specified, apply to all sides
      styles['padding-top'] = values[0];
      styles['padding-right'] = values[1] || values[0];
      styles['padding-bottom'] = values[2] || values[0];
      styles['padding-left'] = values[3] || values[1] || values[0];
    } else {
      // Apply only to specified directions
      directions.forEach((dir) => {
        const index = DIRECTIONS.indexOf(dir);
        styles[`padding-${dir}`] =
          values[index] || values[index % 2] || values[0];
      });
    }
  }

  // Priority 2 (medium): paddingBlock - override top and bottom
  if (paddingBlock != null) {
    const values = parsePaddingValue(paddingBlock);
    styles['padding-top'] = values[0];
    styles['padding-bottom'] = values[1] || values[0];
  }

  // Priority 2 (medium): paddingInline - override left and right
  if (paddingInline != null) {
    const values = parsePaddingValue(paddingInline);
    styles['padding-left'] = values[0];
    styles['padding-right'] = values[1] || values[0];
  }

  // Priority 3 (highest): individual directions - override specific sides
  if (paddingTop != null) {
    const values = parsePaddingValue(paddingTop);
    styles['padding-top'] = values[0];
  }

  if (paddingRight != null) {
    const values = parsePaddingValue(paddingRight);
    styles['padding-right'] = values[0];
  }

  if (paddingBottom != null) {
    const values = parsePaddingValue(paddingBottom);
    styles['padding-bottom'] = values[0];
  }

  if (paddingLeft != null) {
    const values = parsePaddingValue(paddingLeft);
    styles['padding-left'] = values[0];
  }

  return styles;
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
