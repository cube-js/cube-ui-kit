import React, { useContext, forwardRef } from 'react';
import styled from 'styled-components';
import { ResponsiveContext } from '../providers/Responsive';
import gapStyle from '../styles/gap';
import flowStyle from '../styles/flow';
import {
  mediaWrapper,
  normalizeStyleZones,
  pointsToZones,
} from '../utils/responsive';
import columnsStyle from '../styles/colums';
import rowsStyle from '../styles/rows';
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
import italicStyle from '../styles/italic';
import marginStyle from '../styles/margin';
import fontStyle from '../styles/font';
import { useCombinedRefs } from '../utils/react';

const STYLES = [
  createNativeStyle('display'),
  createNativeStyle('content', 'place-content'),
  createNativeStyle('items', 'place-items'),
  createNativeStyle('place', 'place-self'),
  createNativeStyle('grow', 'flex-grow'),
  createNativeStyle('shrink', 'flex-shrink'),
  createNativeStyle('order'),
  createNativeStyle('cursor'),
  createNativeStyle('textAlign'),
  createNativeStyle('fontWeight'),
  createNativeStyle('textTransform'),
  italicStyle,
  marginStyle,
  gapStyle,
  flowStyle,
  columnsStyle,
  rowsStyle,
  colorStyle,
  fillStyle,
  widthStyle,
  heightStyle,
  radiusStyle,
  borderStyle,
  shadowStyle,
  paddingStyle,
  sizeStyle,
  fontStyle,
];

const BaseElement = styled.div(({ styles, responsive, css }) => {
  const zones = responsive;

  let rawStyles = '',
    responsiveStyles = Array.from(Array(zones.length)).map(() => '');

  STYLES.forEach((STYLE) => {
    const lookupStyles = STYLE.__styleLookup;
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

      const rulesByPoint = propsByPoint.map(STYLE);

      rulesByPoint.forEach((rules, i) => {
        responsiveStyles[i] += rules || '';
      });
    } else {
      rawStyles += STYLE(styles) || '';
    }
  });

  return `${css || ''}${rawStyles}${mediaWrapper(responsiveStyles, zones)}`;
});

export default forwardRef(function Base(
  { styles, defaultStyles, styleAttrs = [], responsive, css, ...props },
  ref,
) {
  const combinedRef = useCombinedRefs(ref);

  defaultStyles = defaultStyles || {};
  styles = Object.assign({}, defaultStyles, styles || {});
  styles.display = styles.display || 'inline-block';

  const filteredProps = { ...props };

  ['display', ...styleAttrs].forEach((style) => {
    if (props.hasOwnProperty(style)) {
      styles[style] = props[style];
      delete filteredProps[style];
    }
  });

  props = filteredProps;

  const zonesContext = useContext(ResponsiveContext);
  const zones = responsive ? pointsToZones(responsive) : zonesContext;

  return (
    <BaseElement
      {...props}
      css={css}
      responsive={zones}
      styles={styles}
      ref={combinedRef}
    />
  );
});

const styleProps = new Set();

STYLES.forEach((STYLE) => {
  STYLE.__styleLookup.forEach((style) => {
    styleProps.add(style);
  });
});

export const STYLE_PROPS = Array.from(styleProps);
