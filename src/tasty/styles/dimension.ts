import { parseStyle } from '../utils/styles';

const DEFAULT_MIN_SIZE = 'var(--gap)';
const DEFAULT_MAX_SIZE = '100%';

/**
 * Parse a dimension value (string, number, or boolean) into a CSS value
 */
function parseDimensionValue(
  val: string | number | boolean | undefined,
): string | null {
  if (val == null) return null;
  if (typeof val === 'number') return `${val}px`;
  if (val === true) return 'initial';

  const processed = parseStyle(String(val));
  return processed.groups[0]?.values[0] || null;
}

interface DimensionProps {
  value?: string | number | boolean;
  min?: string | number | boolean;
  max?: string | number | boolean;
}

/**
 * Creates a dimension style handler for width or height.
 *
 * Supports:
 * - Main dimension prop (width/height) with syntax for min/max
 * - Separate min/max props (minWidth/maxWidth or minHeight/maxHeight)
 *
 * Priority: Individual min/max props override values from main prop syntax
 */
export function dimensionStyle(name: 'width' | 'height') {
  const minStyle = `min-${name}`;
  const maxStyle = `max-${name}`;

  return ({ value, min, max }: DimensionProps) => {
    // If nothing is defined, return undefined
    if (value == null && min == null && max == null) return;

    // Handle boolean true on main value - reset all to initial
    if (value === true) {
      const styles: Record<string, string | string[]> = {
        [name]: 'auto',
        [minStyle]: 'initial',
        [maxStyle]: 'initial',
      };

      // Apply individual min/max overrides
      const minVal = parseDimensionValue(min);
      const maxVal = parseDimensionValue(max);
      if (minVal) styles[minStyle] = minVal;
      if (maxVal) styles[maxStyle] = maxVal;

      return styles;
    }

    const styles: Record<string, string | string[]> = {
      [name]: 'auto',
      [minStyle]: 'initial',
      [maxStyle]: 'initial',
    };

    // Process main dimension value
    if (value != null) {
      let val = value;
      if (typeof val === 'number') {
        val = `${val}px`;
      }

      val = String(val);

      const processed = parseStyle(val);
      const { mods, values } =
        processed.groups[0] ?? ({ mods: [], values: [] } as any);

      let flag = false;

      for (let mod of mods) {
        switch (mod) {
          case 'min':
            styles[minStyle] = values[0] || DEFAULT_MIN_SIZE;
            flag = true;
            break;
          case 'max':
            styles[maxStyle] = values[0] || DEFAULT_MAX_SIZE;
            flag = true;
            break;
          case 'fixed': {
            // Fixed modifier: set all three dimensions to the same value
            const fixedValue = values[0] || 'max-content';
            styles[minStyle] = fixedValue;
            styles[name] = fixedValue;
            styles[maxStyle] = fixedValue;
            flag = true;
            break;
          }
          default:
            break;
        }
      }

      if (!flag || !mods.length) {
        if (values.length === 2) {
          styles[minStyle] = values[0];
          styles[maxStyle] = values[1];
        } else if (values.length === 3) {
          styles[minStyle] = values[0];
          styles[name] = values[1];
          styles[maxStyle] = values[2];
        } else {
          styles[name] = values[0] || 'auto';
        }
      }

      if (styles[name] === 'stretch') {
        if (name === 'width') {
          styles[name] = [
            'stretch',
            '-webkit-fill-available',
            '-moz-available',
          ];
        } else {
          styles[name] = 'auto';
        }
      }
    }

    // Apply individual min/max props (higher priority, override main prop syntax)
    const minVal = parseDimensionValue(min);
    const maxVal = parseDimensionValue(max);
    if (minVal) styles[minStyle] = minVal;
    if (maxVal) styles[maxStyle] = maxVal;

    return styles;
  };
}
