import { mediaWrapper, normalizeStyleZones } from './responsive.js';
import {
  getRgbValuesFromRgbaString,
  hexToRgb,
  parseColor, strToRgb,
  styleHandlerCacheWrapper
} from './styles.js';
import { parseStyle } from './styles.js';
import { toSnakeCase } from './string.js';

/**
 * Props level cache for `renderStyles` function.
 * @type {{}}
 */
let STYLE_CACHE = {};
/**
 * Current size of the cache.
 * @type {number}
 */
let STYLE_CACHE_COUNT = 0;
/**
 * Cache limit.
 * @type {number}
 */
const CACHE_LIMIT = 1000;

/**
 * Render style props to complete Styled Components CSS.
 * @param {NuStyleMap} styles - Complete style props.
 * @param {Array<Object>} responsive - A list of responsive zones
 * @param styleHandlerMap - Style to handler list map.
 * @return {string}
 */
export function renderStyles(styles, responsive, styleHandlerMap = {}) {
  const zones = responsive;
  const responsiveStyles = Array.from(Array(zones.length)).map(() => '');
  const cacheKey = JSON.stringify({ s: styles, r: responsive });

  let rawStyles = '';

  const handlerQueue = [];

  if (!STYLE_CACHE[cacheKey]) {
    STYLE_CACHE_COUNT++;

    // clear cache if size is more that the limit
    if (STYLE_CACHE_COUNT > CACHE_LIMIT) {
      STYLE_CACHE_COUNT = 0;
      STYLE_CACHE = {};
    }

    Object.keys(styles).forEach((styleName) => {
      let handlers = styleHandlerMap[styleName];

      if (!handlers) {
        handlers = [createStyle(styleName)];
      }

      handlers.forEach((STYLE) => {
        if (handlerQueue.includes(STYLE)) return;

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

export function createStyle(styleName, cssStyle, converter) {
  if (!CACHE[styleName]) {
    CACHE[styleName] = styleHandlerCacheWrapper((styleMap) => {
      let styleValue = styleMap[styleName];

      cssStyle = cssStyle || toSnakeCase(styleName).replace(/^@/, '--');

      // convert non-string values
      if (converter && typeof styleValue !== 'string') {
        styleValue = converter(styleValue);

        if (!styleValue) return;
      }

      if (typeof styleValue === 'string' && cssStyle.startsWith('--') && cssStyle.endsWith('-color')) {
        styleValue = styleValue.trim();

        const rgba = strToRgb(styleValue);

        const { color, name } = parseColor(styleValue);

        if (name && rgba) {
          return {
            [cssStyle]: `var(--${name}-color, ${rgba})`,
            [`${cssStyle}-rgb`]: `var(--${name}-color-rgb, ${getRgbValuesFromRgbaString(rgba).join(', ')})`,
          };
        } else if (name) {
          return {
            [cssStyle]: `var(--${name}-color)`,
            [`${cssStyle}-rgb`]: `var(--${name}-color-rgb)`,
          };
        } else if (rgba) {
          return {
            [cssStyle]: rgba,
            [`${cssStyle}-rgb`]: getRgbValuesFromRgbaString(rgba).join(', '),
          };
        }

        return {
          [cssStyle]: color,
        };
      }

      const { value } = parseStyle(styleValue, 1);

      return { [cssStyle]: value };
    });

    CACHE[styleName].__lookupStyles = [styleName];
  }

  return CACHE[styleName];
}
