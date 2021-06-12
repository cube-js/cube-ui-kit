import { gapStyle } from './gap.js';
import { flowStyle } from './flow.js';
import { resetStyle } from './reset.js';
import { colorStyle } from './color.js';
import { fillStyle } from './fill.js';
import { widthStyle } from './width.js';
import { heightStyle } from './height.js';
import { radiusStyle } from './radius.js';
import { borderStyle } from './border.js';
import { shadowStyle } from './shadow.js';
import { paddingStyle } from './padding.js';
import { sizeStyle } from './size.js';
import { fontStyleStyle } from './fontStyle.js';
import { marginStyle } from './margin.js';
import { fontStyle } from './font.js';
import { outlineStyle } from './outline.js';
import { createStyle } from '../utils/render-styles.js';
import { transitionStyle } from './transition';
import { groupRadiusAttr } from './groupRadius';
import { boxShadowCombinator } from './boxShadow.combinator.js';
import { styleHandlerCacheWrapper } from '../utils/styles.js';
import { scrollBarStyle } from './scrollBar';

export const STYLES = [
  // `display` style is used in several handlers, so we need to explicitly declare it
  createStyle('display'),
  createStyle('content', 'place-content'),
  createStyle('items', 'place-items'),
  createStyle('place', 'place-self'),
  createStyle('grow', 'flex-grow'),
  createStyle('shrink', 'flex-shrink'),
  createStyle('row', 'grid-row'),
  createStyle('z', 'z-index'),
  createStyle('column', 'grid-column'),
  createStyle('columns', 'grid-template-columns', true),
  createStyle('rows', 'grid-template-rows', true),
].concat(
  [
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
    console.log('style lookup not found for the handler', handler);

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
