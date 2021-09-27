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
import { presetStyle } from './preset';
import { fontStyleStyle } from './fontStyle';
import { marginStyle } from './margin';
import { fontStyle } from './font';
import { outlineStyle } from './outline';
import { createStyle } from '../utils/renderStyles';
import { transitionStyle } from './transition';
import { groupRadiusAttr } from './groupRadius';
import { boxShadowCombinator } from './boxShadow.combinator';
import { styleHandlerCacheWrapper } from '../utils/styles';
import { styledScrollbarStyle } from './styledScrollbar';
import { displayStyle } from './display';

const columnsConverter = (val) => {
  if (typeof val === 'number') {
    return 'minmax(1px, 1fr) '.repeat(val).trim();
  }

  return null;
};
const rowsConverter = (val) => {
  if (typeof val === 'number') {
    return 'auto '.repeat(val).trim();
  }

  return null;
};

export const STYLES = [
  // Manually define styles that are used in other custom styles.
  // Otherwise, they won't be handled as expected.
  createStyle('fontSize'),
  createStyle('lineHeight'),
  createStyle('fontWeight'),
  createStyle('letterSpacing'),
  createStyle('textTransform'),
  // Style aliases
  createStyle('gridAreas', 'grid-template-areas'),
  createStyle('gridColumns', 'grid-template-columns', columnsConverter),
  createStyle('gridRows', 'grid-template-rows', rowsConverter),
  createStyle('gridTemplate', 'grid-template', (val) => {
    if (typeof val !== 'string') return;

    return val
      .split('/')
      .map((s, i) => (i ? columnsConverter : rowsConverter)(s))
      .join('/');
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
    presetStyle,
    boxShadowCombinator,
    outlineStyle,
    fontStyle,
    fontStyleStyle,
    groupRadiusAttr,
    styledScrollbarStyle,
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
