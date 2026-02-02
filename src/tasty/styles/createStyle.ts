import { toSnakeCase } from '../utils/string';
import {
  getRgbValuesFromRgbaString,
  parseColor,
  parseStyle,
  strToRgb,
} from '../utils/styles';

const CACHE = {};

/**
 * Convert color fallback chain to RGB fallback chain.
 * Example: var(--primary-color, var(--secondary-color)) → var(--primary-color-rgb, var(--secondary-color-rgb))
 */
export function convertColorChainToRgbChain(colorValue: string): string {
  // Match var(--name-color, ...) pattern
  const varPattern = /var\(--([a-z0-9-]+)-color\s*(?:,\s*(.+))?\)/;
  const match = colorValue.match(varPattern);

  if (!match) {
    // Not a color variable, check if it's a color function or literal
    if (colorValue.startsWith('rgb(') || colorValue.startsWith('rgba(')) {
      return colorValue;
    }
    // Try to convert to RGB if possible
    const rgba = strToRgb(colorValue);
    if (rgba) {
      const rgbValues = getRgbValuesFromRgbaString(rgba);
      return rgbValues.join(' ');
    }
    return colorValue;
  }

  const [, name, fallback] = match;

  if (!fallback) {
    // Simple var without fallback
    return `var(--${name}-color-rgb)`;
  }

  // Recursively process the fallback
  const processedFallback = convertColorChainToRgbChain(fallback.trim());
  return `var(--${name}-color-rgb, ${processedFallback})`;
}

export function createStyle(
  styleName: string,
  cssStyle?: string,
  converter?: (styleValue: string | number | true) => string | undefined,
) {
  const key = `${styleName}.${cssStyle ?? ''}`;

  if (!CACHE[key]) {
    const styleHandler = (styleMap) => {
      let styleValue = styleMap[styleName];

      if (styleValue == null || styleValue === false) return;

      // Map style name to final CSS property.
      // - "$foo" → "--foo"
      // - "#name"        → "--name-color" (alternative color definition syntax)
      let finalCssStyle: string;
      const isColorToken =
        !cssStyle && typeof styleName === 'string' && styleName.startsWith('#');

      if (isColorToken) {
        const raw = styleName.slice(1);
        // Convert camelCase to kebab and remove possible leading dash from uppercase start
        const name = toSnakeCase(raw).replace(/^-+/, '');
        finalCssStyle = `--${name}-color`;
      } else {
        finalCssStyle = cssStyle || toSnakeCase(styleName).replace(/^\$/, '--');
      }

      // For color tokens, convert boolean true to 'transparent'
      if (isColorToken && styleValue === true) {
        styleValue = 'transparent';
      }

      // convert non-string values
      if (converter && typeof styleValue !== 'string') {
        styleValue = converter(styleValue);

        if (!styleValue) return;
      }

      if (
        typeof styleValue === 'string' &&
        finalCssStyle.startsWith('--') &&
        finalCssStyle.endsWith('-color')
      ) {
        styleValue = styleValue.trim();

        const rgba = strToRgb(styleValue);

        const { color, name } = parseColor(styleValue);

        if (name && rgba) {
          return {
            [finalCssStyle]: `var(--${name}-color, ${rgba})`,
            [`${finalCssStyle}-rgb`]: `var(--${name}-color-rgb, ${getRgbValuesFromRgbaString(
              rgba,
            ).join(' ')})`,
          };
        } else if (name) {
          if (color) {
            return {
              [finalCssStyle]: color,
              [`${finalCssStyle}-rgb`]: convertColorChainToRgbChain(color),
            };
          }

          return {
            [finalCssStyle]: `var(--${name}-color)`,
            [`${finalCssStyle}-rgb`]: `var(--${name}-color-rgb)`,
          };
        } else if (rgba) {
          return {
            [finalCssStyle]: rgba,
            [`${finalCssStyle}-rgb`]:
              getRgbValuesFromRgbaString(rgba).join(' '),
          };
        }

        return {
          [finalCssStyle]: color,
        };
      }

      const processed = parseStyle(styleValue as any);
      return { [finalCssStyle]: processed.output };
    };

    styleHandler.__lookupStyles = [styleName];

    CACHE[key] = styleHandler;
  }

  return CACHE[key];
}
