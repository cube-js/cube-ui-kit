import { mediaWrapper, normalizeStyleZones } from './responsive';
import {
  getRgbValuesFromRgbaString,
  NuStyleHandler,
  NuStyleMap,
  parseColor,
  strToRgb,
  styleHandlerCacheWrapper,
} from './styles';
import { parseStyle } from './styles';
import { toSnakeCase } from './string';
import { NuStyles } from '../styles/types';

type StyleHandlerMap = {
  [key: string]: NuStyleHandler[];
};

type HandlerQueueItem = {
  handler: NuStyleHandler;
  styleMap: NuStyleMap;
  isResponsive: boolean;
};

/** Props level cache for `renderStyles` function. */
let STYLE_CACHE = {};

/** Current size of the cache. */
let STYLE_CACHE_COUNT = 0;

/** Cache limit. */
const CACHE_LIMIT = 1000;

/**
 * Render style props to complete Styled Components CSS.
 * @param styles - Complete style props.
 * @param responsive - A list of responsive zones
 * @param styleHandlerMap - Style to handler list map.
 * @return {string}
 */
export function renderStyles(
  styles: NuStyles,
  responsive: number[],
  styleHandlerMap: StyleHandlerMap = {},
) {
  const zones = responsive;
  const responsiveStyles = Array.from(Array(zones.length)).map(() => '');
  const cacheKey = JSON.stringify({ s: styles, r: responsive });

  let rawStyles = '';

  const handlerQueue: HandlerQueueItem[] = [];

  if (!STYLE_CACHE[cacheKey]) {
    STYLE_CACHE_COUNT++;

    // clear cache if size is more that the limit
    if (STYLE_CACHE_COUNT > CACHE_LIMIT) {
      STYLE_CACHE_COUNT = 0;
      STYLE_CACHE = {};
    }

    Object.keys(styles).forEach((styleName) => {
      let handlers: NuStyleHandler[] = styleHandlerMap[styleName];

      if (!handlers) {
        handlers = [createStyle(styleName)];
      }

      handlers.forEach((STYLE) => {
        if (handlerQueue.find((queueItem) => queueItem.handler === STYLE))
          return;

        let isResponsive = false;
        const lookupStyles = STYLE.__lookupStyles;
        const filteredStyleMap = lookupStyles.reduce((map, name) => {
          map[name] = styles[name];

          if (Array.isArray(styles[name])) {
            isResponsive = true;
          }

          return map;
        }, {});

        handlerQueue.push({
          handler: STYLE,
          styleMap: filteredStyleMap,
          isResponsive,
        });
      });
    });

    handlerQueue.forEach(({ handler, styleMap, isResponsive }) => {
      const lookupStyles = handler.__lookupStyles;

      if (isResponsive) {
        const valueMap = lookupStyles.reduce((map, style) => {
          map[style] = normalizeStyleZones(styleMap[style], zones.length);

          return map;
        }, {});

        const propsByPoint = zones.map((zone, i) => {
          const pointProps = {};

          lookupStyles.forEach((style) => {
            if (valueMap != null && valueMap[style] != null) {
              pointProps[style] = valueMap[style][i];
            }
          });

          return pointProps;
        });

        const rulesByPoint = propsByPoint.map(handler);

        rulesByPoint.forEach((rules, i) => {
          responsiveStyles[i] += rules || '';
        });
      } else {
        rawStyles += handler(styleMap) || '';
      }
    });

    STYLE_CACHE[cacheKey] = `${rawStyles}${
      responsive ? mediaWrapper(responsiveStyles, zones) : ''
    }`;
  }

  return `outline: none;\n${STYLE_CACHE[cacheKey]}`;
}

const CACHE = {};

export function createStyle(
  styleName: string,
  cssStyle?: string,
  converter?: Function,
) {
  if (!CACHE[styleName]) {
    CACHE[styleName] = styleHandlerCacheWrapper((styleMap) => {
      let styleValue = styleMap[styleName];

      if (!styleValue) return;

      const finalCssStyle
        = cssStyle || toSnakeCase(styleName).replace(/^@/, '--');

      // convert non-string values
      if (converter && typeof styleValue !== 'string') {
        styleValue = converter(styleValue);

        if (!styleValue) return;
      }

      if (
        typeof styleValue === 'string'
        && finalCssStyle.startsWith('--')
        && finalCssStyle.endsWith('-color')
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

    CACHE[styleName].__lookupStyles = [styleName];
  }

  return CACHE[styleName];
}
