import { DIRECTIONS, filterMods, parseStyle } from '../utils/styles';

/**
 * Parse a margin value and return processed values
 */
function parseMarginValue(value: string | number | boolean): string[] {
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
 * Parse directional margin value (like "1x top" or "2x left right")
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

  const processed = parseStyle(value);
  let { values, mods } =
    processed.groups[0] ?? ({ values: [], mods: [] } as any);

  if (!values.length) {
    values = ['var(--gap)'];
  }

  const directions = filterMods(mods, DIRECTIONS);

  return { values, directions };
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
  // Check if any margin property is defined
  const hasAnyMargin =
    margin != null ||
    marginBlock != null ||
    marginInline != null ||
    marginTop != null ||
    marginRight != null ||
    marginBottom != null ||
    marginLeft != null;

  // If no margin is defined, return empty object
  if (!hasAnyMargin) {
    return {};
  }

  // Initialize with all directions set to 0, then override as needed
  const styles: { [key: string]: string } = {
    'margin-top': '0',
    'margin-right': '0',
    'margin-bottom': '0',
    'margin-left': '0',
  };

  // Priority 1 (lowest): margin - apply to all directions if no other properties are specified
  if (margin != null) {
    // Parse directional margin (e.g., "1x top" or "2x left right")
    const { values, directions } = parseDirectionalMargin(margin);

    if (directions.length === 0) {
      // No directions specified, apply to all sides
      styles['margin-top'] = values[0];
      styles['margin-right'] = values[1] || values[0];
      styles['margin-bottom'] = values[2] || values[0];
      styles['margin-left'] = values[3] || values[1] || values[0];
    } else {
      // Apply only to specified directions
      directions.forEach((dir) => {
        const index = DIRECTIONS.indexOf(dir);
        styles[`margin-${dir}`] =
          values[index] || values[index % 2] || values[0];
      });
    }
  }

  // Priority 2 (medium): marginBlock - override top and bottom
  if (marginBlock != null) {
    const values = parseMarginValue(marginBlock);
    styles['margin-top'] = values[0];
    styles['margin-bottom'] = values[1] || values[0];
  }

  // Priority 2 (medium): marginInline - override left and right
  if (marginInline != null) {
    const values = parseMarginValue(marginInline);
    styles['margin-left'] = values[0];
    styles['margin-right'] = values[1] || values[0];
  }

  // Priority 3 (highest): individual directions - override specific sides
  if (marginTop != null) {
    const values = parseMarginValue(marginTop);
    styles['margin-top'] = values[0];
  }

  if (marginRight != null) {
    const values = parseMarginValue(marginRight);
    styles['margin-right'] = values[0];
  }

  if (marginBottom != null) {
    const values = parseMarginValue(marginBottom);
    styles['margin-bottom'] = values[0];
  }

  if (marginLeft != null) {
    const values = parseMarginValue(marginLeft);
    styles['margin-left'] = values[0];
  }

  return styles;
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
