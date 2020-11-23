import React, { useContext } from 'react';
import styled from 'styled-components';
import { ResponsiveContext } from '../providers/Responsive';
import gapStyle from '../styles/gap';
import flowStyle from '../styles/flow';
import { mediaWrapper, normalizeStyleZones, pointsToZones } from '../utils/responsive';
import columnsStyle from '../styles/colums';
import rowsStyle from '../styles/rows';
import colorStyle from '../styles/color';
import bgStyle from '../styles/bg';
import widthStyle from '../styles/width';
import heightStyle from '../styles/height';
import radiusStyle from '../styles/radius';
import borderStyle from '../styles/border';
import shadowStyle from '../styles/shadow';
import paddingStyle from '../styles/padding';
import createNativeStyle from '../styles/native';

const STYLES = [
  createNativeStyle('display'),
  createNativeStyle('content', 'place-content'),
  createNativeStyle('items', 'place-items'),
  createNativeStyle('place', 'place-self'),
  createNativeStyle('grow'),
  createNativeStyle('shrink'),
  createNativeStyle('order'),
  createNativeStyle('cursor'),
  gapStyle,
  flowStyle,
  columnsStyle,
  rowsStyle,
  colorStyle,
  bgStyle,
  widthStyle,
  heightStyle,
  radiusStyle,
  borderStyle,
  shadowStyle,
  paddingStyle,
];

const BaseElement = styled.div(({ styles, defaultStyles, styleAttrs, responsive, ...props }) => {
  const zones = responsive;

  let rawStyles = '',
    responsiveStyles = Array.from(Array(zones.length)).map(() => '');

  STYLES.map((STYLE) => {
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

  return `${rawStyles}${mediaWrapper(responsiveStyles, zones)}`;
});

export default function({ styles, defaultStyles, styleAttrs, responsive, ...props }) {
  defaultStyles = defaultStyles || {};
  styles = Object.assign({}, defaultStyles, styles || {});
  styles.display = styles.display || 'inline-block';

  if (styleAttrs) {
    const filteredProps = { ...props };

    styleAttrs.forEach((style) => {
      if (props.hasOwnProperty(style)) {
        styles[style] = props[style];
        delete filteredProps[style];
      }
    });

    props = filteredProps;
  }

  const zones = responsive ? pointsToZones(responsive) : useContext(ResponsiveContext);

  return <BaseElement {...props} responsive={zones} styles={styles}/>;
}

const styleProps = new Set();

STYLES.forEach(STYLE => {
  STYLE.__styleLookup.forEach(style => {
    styleProps.add(style);
  });
});

export const STYLE_PROPS = Array.from(styleProps);
