import { gapStyle } from './gap';
import { flowStyle } from './flow';
import { resetStyle } from './reset';
import { colorStyle } from './color';
import { fillStyle } from './fill';
import { widthStyle } from './width';
import { heightStyle } from './height';
import { radiusStyle } from './radius';
import { borderStyle } from './border';
import { shadowStyle } from './shadow';
import { paddingStyle } from './padding';
import { sizeStyle } from './size';
import { fontStyleStyle } from './fontStyle';
import { marginStyle } from './margin';
import { fontStyle } from './font';
import { outlineStyle } from './outline';
import { createStyle } from '../utils/render-styles';
import { transitionStyle } from './transition';
import { groupRadiusAttr } from './groupRadius';
import { boxShadowCombinator } from './boxShadow.combinator';
import { styleHandlerCacheWrapper } from '../utils/styles';
import { scrollBarStyle } from './scrollBar';
import { displayStyle } from './display';

export const STYLES = [
  // `display` style is used in several handlers, so we need to explicitly declare it
  createStyle('area', 'grid-area'),
  createStyle('areas', 'grid-template-areas'),
  createStyle('content', 'place-content'),
  createStyle('items', 'place-items'),
  createStyle('place', 'place-self'),
  createStyle('grow', 'flex-grow'),
  createStyle('shrink', 'flex-shrink'),
  createStyle('row', 'grid-row'),
  createStyle('z', 'z-index'),
  createStyle('column', 'grid-column'),
  createStyle('columns', 'grid-template-columns', (val) => {
    if (typeof val === 'number') {
      return 'minmax(1px, 1fr) '.repeat(val).trim();
    }

    return null;
  }),
  createStyle('rows', 'grid-template-rows', (val) => {
    if (typeof val === 'number') {
      return 'auto '.repeat(val).trim();
    }

    return null;
  }),
].concat(
  [
    displayStyle,
    transitionStyle,
    resetStyle,
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
    groupRadiusAttr,
    scrollBarStyle,
  ].map(styleHandlerCacheWrapper),
);

export const STYLE_HANDLER_MAP = STYLES.reduce((map, handler) => {
  const lookup = handler.__lookupStyles;

  if (!lookup) {
    console.warn('style lookup not found for the handler', handler);

    return map;
  }

  lookup.forEach((styleName) => {
    if (!map[styleName]) {
      map[styleName] = [];
    }

    if (!map[styleName].includes(handler)) {
      map[styleName].push(handler);
    }
  });

  return map;
}, {});
