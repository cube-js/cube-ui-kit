import { StyleDetails } from '../parser/types';
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
] as const;

type Direction = (typeof DIRECTIONS)[number];

interface GroupData {
  values: string[];
  mods: string[];
  colors: string[];
}

interface BorderValue {
  width: string;
  style: string;
  color: string;
}

/**
 * Process a single group and return border values for its directions.
 * @returns Object with directions as keys and border values, or null for "all directions"
 */
function processGroup(group: GroupData): {
  directions: Direction[];
  borderValue: BorderValue;
} {
  const { values, mods, colors } = group;

  const directions = filterMods(mods, DIRECTIONS) as Direction[];
  const typeMods = filterMods(mods, BORDER_STYLES);

  const width = values[0] || 'var(--border-width)';
  const style = typeMods[0] || 'solid';
  const color = colors?.[0] || 'var(--border-color)';

  return {
    directions,
    borderValue: { width, style, color },
  };
}

/**
 * Format a border value to CSS string.
 */
function formatBorderValue(value: BorderValue): string {
  return `${value.width} ${value.style} ${value.color}`;
}

/**
 * Border style handler with multi-group support.
 *
 * Single group (backward compatible):
 * - `border="1bw solid #red"` - all sides
 * - `border="1bw solid #red top left"` - only top and left
 *
 * Multi-group (new):
 * - `border="1bw #red, 2bw #blue top"` - all sides red 1bw, then top overridden to blue 2bw
 * - `border="1bw, dashed top bottom, #purple left right"` - base 1bw, dashed on top/bottom, purple on left/right
 *
 * Later groups override earlier groups for conflicting directions.
 */
export function borderStyle({ border }) {
  if (!border && border !== 0) return;

  if (border === true) border = '1bw';

  const processed = parseStyle(String(border));
  const groups: GroupData[] = processed.groups ?? [];

  if (!groups.length) return;

  // Single group - use original logic for backward compatibility
  if (groups.length === 1) {
    const { directions, borderValue } = processGroup({
      values: groups[0].values ?? [],
      mods: groups[0].mods ?? [],
      colors: groups[0].colors ?? [],
    });

    const styleValue = formatBorderValue(borderValue);

    if (!directions.length) {
      return { border: styleValue };
    }

    const zeroValue = `0 ${borderValue.style} ${borderValue.color}`;

    return DIRECTIONS.reduce(
      (styles, dir) => {
        if (directions.includes(dir)) {
          styles[`border-${dir}`] = styleValue;
        } else {
          styles[`border-${dir}`] = zeroValue;
        }
        return styles;
      },
      {} as Record<string, string>,
    );
  }

  // Multi-group - process groups in order, later groups override earlier
  // Track whether any group specifies directions
  let hasAnyDirections = false;

  // Build a map of direction -> border value
  // Start with undefined (no border set)
  const directionMap: Record<Direction, BorderValue | null> = {
    top: null,
    right: null,
    bottom: null,
    left: null,
  };

  // Track the last "all directions" value for fallback
  let allDirectionsValue: BorderValue | null = null;

  // Process groups in order (first to last)
  for (const group of groups) {
    const { directions, borderValue } = processGroup({
      values: group.values ?? [],
      mods: group.mods ?? [],
      colors: group.colors ?? [],
    });

    if (directions.length === 0) {
      // No specific directions - applies to all
      allDirectionsValue = borderValue;
      // Set all directions
      for (const dir of DIRECTIONS) {
        directionMap[dir] = borderValue;
      }
    } else {
      // Specific directions - override only those
      hasAnyDirections = true;
      for (const dir of directions) {
        directionMap[dir] = borderValue;
      }
    }
  }

  // If no group specified any directions and we have an all-directions value,
  // return the simple `border` shorthand
  if (!hasAnyDirections && allDirectionsValue) {
    return { border: formatBorderValue(allDirectionsValue) };
  }

  // Otherwise, output individual border-* properties
  const result: Record<string, string> = {};

  for (const dir of DIRECTIONS) {
    const value = directionMap[dir];
    if (value) {
      result[`border-${dir}`] = formatBorderValue(value);
    } else {
      // No border for this direction - set to 0
      // Use the last all-directions value for style/color consistency, or defaults
      const fallback = allDirectionsValue || {
        width: '0',
        style: 'solid',
        color: 'var(--border-color)',
      };
      result[`border-${dir}`] = `0 ${fallback.style} ${fallback.color}`;
    }
  }

  return result;
}

borderStyle.__lookupStyles = ['border'];
