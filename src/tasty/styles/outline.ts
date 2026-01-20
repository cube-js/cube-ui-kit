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

interface OutlineStyleProps {
  outline?: string | boolean | number;
  outlineOffset?: string | number;
}

/**
 * Generates CSS for outline property with optional offset.
 *
 * Syntax:
 * - `outline="2px solid #red"` - outline only
 * - `outline="2px solid #red / 4px"` - outline with offset (slash separator)
 * - `outline="2px / 4px"` - width with offset (simpler form)
 * - `outline={true}` - default 1ow solid outline
 * - `outlineOffset="4px"` - offset as separate prop (can be combined with outline)
 *
 * Priority: slash syntax in outline takes precedence over outlineOffset prop
 *
 * @return CSS properties for outline and optionally outline-offset
 */
export function outlineStyle({ outline, outlineOffset }: OutlineStyleProps) {
  const result: Record<string, string> = {};

  // Handle outline (0 is valid - means no outline)
  if (outline != null && outline !== false) {
    let outlineValue: string | boolean | number = outline;
    if (outline === true) outlineValue = '1ow';
    if (outline === 0) outlineValue = '0';

    const processed = parseStyle(String(outlineValue));
    const group = processed.groups[0];

    if (group) {
      const { parts } = group;
      const outlinePart = parts[0] ?? { values: [], mods: [], colors: [] };
      const offsetPart = parts[1];

      const typeMods = filterMods(outlinePart.mods, BORDER_STYLES);

      const value = outlinePart.values[0] || 'var(--outline-width)';
      const type = typeMods[0] || 'solid';
      const outlineColor = outlinePart.colors[0] || 'var(--outline-color)';

      result['outline'] = [value, type, outlineColor].join(' ');

      // Check for offset in second part (after /) - takes precedence
      if (offsetPart?.values[0]) {
        result['outline-offset'] = offsetPart.values[0];
      }
    }
  }

  // Handle outlineOffset prop (only if not already set by slash syntax)
  if (outlineOffset != null && !result['outline-offset']) {
    const offsetValue =
      typeof outlineOffset === 'number' ? `${outlineOffset}px` : outlineOffset;
    const processed = parseStyle(offsetValue);
    result['outline-offset'] = processed.groups[0]?.values[0] || offsetValue;
  }

  // Return undefined if no styles to apply
  if (Object.keys(result).length === 0) {
    return;
  }

  return result;
}

outlineStyle.__lookupStyles = ['outline', 'outlineOffset'];
