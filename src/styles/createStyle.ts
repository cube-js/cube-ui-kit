import {
  getRgbValuesFromRgbaString,
  parseColor,
  parseStyle,
  strToRgb,
  styleHandlerCacheWrapper,
} from '../utils/styles';
import { toSnakeCase } from '../utils/string';

const CACHE = {};

export function createStyle<T = string>(
  styleName: string,
  cssStyle?: string,
  converter?: (styleValue: T) => string | undefined,
) {
  const key = `${styleName}.${cssStyle ?? ''}`;

  if (!CACHE[key]) {
    CACHE[key] = styleHandlerCacheWrapper((styleMap) => {
      let styleValue = styleMap[styleName];

      if (styleValue == null || styleValue === false) return;

      const finalCssStyle =
        cssStyle || toSnakeCase(styleName).replace(/^@/, '--');

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
            ).join(', ')})`,
          };
        } else if (name) {
          if (color) {
            return {
              [finalCssStyle]: color,
              [`${finalCssStyle}-rgb`]: `var(--${name}-color-rgb)`,
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
              getRgbValuesFromRgbaString(rgba).join(', '),
          };
        }

        return {
          [finalCssStyle]: color,
        };
      }

      const { value } = parseStyle(styleValue, 1);

      return { [finalCssStyle]: value };
    });

    CACHE[key].__lookupStyles = [styleName];
  }

  return CACHE[key];
}
