import React, { useContext, forwardRef } from 'react';
import {
  replaceStateValues,
  applyStates,
  styleMapToStyleMapStateList,
} from 'numl-utils';
import styled from 'styled-components';
import { ResponsiveContext } from '../providers/Responsive';
import gapStyle from '../styles/gap';
import flowStyle from '../styles/flow';
import {
  mediaWrapper,
  normalizeStyleZones,
  pointsToZones,
} from '../utils/responsive';
import resetStyle from '../styles/reset';
import colorStyle from '../styles/color';
import fillStyle from '../styles/fill';
import widthStyle from '../styles/width';
import heightStyle from '../styles/height';
import radiusStyle from '../styles/radius';
import borderStyle from '../styles/border';
import shadowStyle from '../styles/shadow';
import paddingStyle from '../styles/padding';
import createNativeStyle from '../styles/native';
import sizeStyle from '../styles/size';
import fontStyleStyle from '../styles/fontStyle';
import marginStyle from '../styles/margin';
import fontStyle from '../styles/font';
import boxShadowCombinator from '../styles/box-shadow.combinator';
import outlineStyle from '../styles/outline';
import { extendStyles } from '../utils/styles';

const INLINE_MAP = {
  block: 'inline',
  grid: 'inline-grid',
  flex: 'inline-flex',
};

const STYLES = [
  resetStyle,
  createNativeStyle('display'),
  createNativeStyle('content', 'place-content'),
  createNativeStyle('items', 'place-items'),
  createNativeStyle('place', 'place-self'),
  createNativeStyle('grow', 'flex-grow'),
  createNativeStyle('shrink', 'flex-shrink'),
  createNativeStyle('row', 'grid-row'),
  createNativeStyle('column', 'grid-column'),
  createNativeStyle('order'),
  createNativeStyle('cursor'),
  createNativeStyle('opacity'),
  createNativeStyle('textAlign'),
  createNativeStyle('fontWeight'),
  createNativeStyle('fontFamily'),
  createNativeStyle('textTransform'),
  createNativeStyle('z', 'z-index'),
  createNativeStyle('columns', 'grid-template-columns', true),
  createNativeStyle('rows', 'grid-template-rows', true),
  fillStyle,
  widthStyle,
  marginStyle,
  gapStyle,
  flowStyle,
  colorStyle,
  heightStyle,
  radiusStyle,
  borderStyle,
  shadowStyle,
  paddingStyle,
  sizeStyle,
  boxShadowCombinator,
  outlineStyle,
  fontStyle,
  fontStyleStyle,
];

const CACHE_LIMIT = 1000;
let STYLE_CACHE = {};
let STYLE_CACHE_COUNT = 0;

const BaseElement = styled.div(({ styles, responsive, css }) => {
  const zones = responsive;

  let rawStyles = '',
    responsiveStyles = Array.from(Array(zones.length)).map(() => '');

  const cacheKey = JSON.stringify({ s: styles, r: responsive });

  if (STYLE_CACHE[cacheKey] == null) {
    STYLE_CACHE_COUNT++;

    if (STYLE_CACHE_COUNT > CACHE_LIMIT) {
      STYLE_CACHE = {};
      STYLE_CACHE_COUNT = 0;
    }

    STYLES.forEach((STYLE) => {
      const lookupStyles = STYLE.__styleLookup;

      if (!STYLE.__handler) {
        STYLE.__handler = (styleMap) => {
          if (!lookupStyles.find((style) => style in styleMap)) return;

          const filteredStyleMap = lookupStyles.reduce((map, name) => {
            map[name] = styleMap[name];

            return map;
          }, {});
          const styleCacheKey = JSON.stringify(filteredStyleMap);

          if (!STYLE.__cache || STYLE.__cacheCount > 1000) {
            STYLE.__cache = {};
            STYLE.__cacheCount = 0;
          }

          if (STYLE.__cache[styleCacheKey] == null) {
            const stateMapList = styleMapToStyleMapStateList(
              filteredStyleMap,
              STYLE.__styleLookup,
            );

            replaceStateValues(stateMapList, STYLE);

            STYLE.__cache[styleCacheKey] = applyStates('&&', stateMapList);
          }

          return STYLE.__cache[styleCacheKey];
        };
      }

      const handler = STYLE.__handler;
      const hasStyles = !!lookupStyles.find((style) => style in styles);

      if (!hasStyles) return;

      const hasResponsive = !!lookupStyles.find((style) =>
        Array.isArray(styles[style]),
      );

      if (hasResponsive) {
        const valueMap = lookupStyles.reduce((map, style) => {
          map[style] = normalizeStyleZones(styles[style], zones.length);

          return map;
        }, {});

        const propsByPoint = zones.map((zone, i) => {
          const pointProps = {};

          lookupStyles.forEach((style) => {
            if (valueMap != null) {
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
        rawStyles += handler(styles) || '';
      }
    });

    STYLE_CACHE[cacheKey] = `${rawStyles}${mediaWrapper(
      responsiveStyles,
      zones,
    )}`;
  }

  return `outline: none;${css || ''}${STYLE_CACHE[cacheKey]}`;
});

export default forwardRef(
  (
    {
      styles,
      defaultStyles,
      styleAttrs = [],
      responsive,
      css,
      block,
      inline,
      hidden,
      ...props
    },
    ref,
  ) => {
    defaultStyles = defaultStyles || {};
    styles = extendStyles(defaultStyles, styles);
    styles.display = styles.display || 'inline-block';

    const filteredProps = { ...props };

    ['display', ...styleAttrs].forEach((style) => {
      if (props.hasOwnProperty(style) && props[style] != null) {
        styles[style] = props[style];
        delete filteredProps[style];
      }
    });

    if (block) {
      styles.display = 'block';
    }

    if (inline) {
      styles.display = INLINE_MAP[defaultStyles.display || 'block'];
    }

    props = filteredProps;

    const zonesContext = useContext(ResponsiveContext);
    const zones = responsive ? pointsToZones(responsive) : zonesContext;

    return (
      <BaseElement
        {...props}
        css={css}
        responsive={zones}
        styles={styles}
        ref={ref}
        hidden={!!hidden}
      />
    );
  },
);

const styleProps = new Set();

STYLES.forEach((STYLE) => {
  STYLE.__styleLookup.forEach((style) => {
    styleProps.add(style);
  });
});

export const STYLE_PROPS = Array.from(styleProps);
