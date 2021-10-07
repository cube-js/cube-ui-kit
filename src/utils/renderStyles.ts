import { mediaWrapper, normalizeStyleZones } from './responsive';
import { StyleHandler, StyleMap, StyleValueStateMap } from './styles';
import { Styles } from '../styles/types';
import { createStyle, STYLE_HANDLER_MAP } from '../styles';

type HandlerQueueItem = {
  handler: StyleHandler;
  styleMap: StyleMap;
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
 * @return {string}
 */
export function renderStyles(styles: Styles, responsive: number[]) {
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
      let handlers: StyleHandler[] = STYLE_HANDLER_MAP[styleName];

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
        rawStyles += handler(styleMap as StyleValueStateMap<string>) || '';
      }
    });

    STYLE_CACHE[cacheKey] = `${rawStyles}${
      responsive ? mediaWrapper(responsiveStyles, zones) : ''
    }`;
  }

  return `outline: none;\n${STYLE_CACHE[cacheKey]}`;
}
