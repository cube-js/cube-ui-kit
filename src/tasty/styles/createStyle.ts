import { toSnakeCase } from '../utils/string';
import {
  getRgbValuesFromRgbaString,
  parseColor,
  parseStyle,
  strToRgb,
} from '../utils/styles';

const CACHE = {};

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

      const finalCssStyle =
        cssStyle || toSnakeCase(styleName).replace(/^[@$]/, '--');

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
