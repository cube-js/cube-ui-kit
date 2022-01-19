import { mediaWrapper, normalizeStyleZones } from './responsive';
import { StyleHandler, StyleMap, StyleValueStateMap } from './styles';
import { Styles, Selector } from '../styles/types';
import { createStyle, STYLE_HANDLER_MAP } from '../styles';

type HandlerQueueItem = {
  handler: StyleHandler;
  styleMap: StyleMap;
  isResponsive: boolean;
};

export function isSelector(key) {
  return key.startsWith('&') || key.startsWith('.') || key.match(/^[A-Z]/);
}

function getSelector(key) {
  if (key.startsWith('&')) {
    return key.slice(1);
  }

  if (key.startsWith('.')) {
    return ` ${key}`;
  }

  if (key.match(/^[A-Z]/)) {
    return ` [data-element="${key}"]`;
  }

  return null;
}

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
 * @param {string} [suffix]
 * @return {string}
 */
export function renderStyles(
  styles: Styles,
  responsive: number[],
  suffix?: string,
) {
  const zones = responsive;
  const responsiveStyles = Array.from(Array(zones.length)).map(() => '');
  const cacheKey = JSON.stringify({ s: styles, r: responsive, suffix });

  let rawStyles = '';

  const handlerQueue: HandlerQueueItem[] = [];

  if (!STYLE_CACHE[cacheKey]) {
    STYLE_CACHE_COUNT++;

    // clear cache if size is more that the limit
    if (STYLE_CACHE_COUNT > CACHE_LIMIT) {
      STYLE_CACHE_COUNT = 0;
      STYLE_CACHE = {};
    }

    const keys = Object.keys(styles);
    const selectorKeys = keys.filter((key) => isSelector(key)) as Selector[];

    let innerStyles = '';

    if (selectorKeys.length) {
      selectorKeys.forEach((key) => {
        const addSuffix = getSelector(key);

        innerStyles += renderStyles(
          styles[key] as Styles,
          responsive,
          addSuffix,
        );
      });
    }

    keys.forEach((styleName) => {
      if (isSelector(styleName)) return;

      let handlers: StyleHandler[] = STYLE_HANDLER_MAP[styleName];

      if (!handlers) {
        handlers = STYLE_HANDLER_MAP[styleName] = [createStyle(styleName)];
      }

      handlers.forEach((STYLE) => {
        if (handlerQueue.find((queueItem) => queueItem.handler === STYLE))
          return;

        let isResponsive = false;
        const lookupStyles = STYLE.__lookupStyles;
        const filteredStyleMap = lookupStyles.reduce((map, name) => {
          map[name] = styles[name];

          if (Array.isArray(map[name])) {
            if (map[name].length === 0) {
              delete map[name];
            } else {
              if (map[name].length === 1) {
                map[name] = map[name][0];
              }

              isResponsive = true;
            }
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

        const rulesByPoint = propsByPoint.map((props) =>
          handler(props, suffix),
        );

        rulesByPoint.forEach((rules, i) => {
          responsiveStyles[i] += rules || '';
        });
      } else {
        rawStyles
          += handler(styleMap as StyleValueStateMap<string>, suffix) || '';
      }
    });

    STYLE_CACHE[cacheKey] = `outline: none;\n${rawStyles}${
      responsive && responsive.length
        ? mediaWrapper(responsiveStyles, zones)
        : ''
    }${innerStyles}`;
  }

  return STYLE_CACHE[cacheKey];
}
