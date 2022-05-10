import {
  RawStyleHandler,
  StyleHandler,
  styleHandlerCacheWrapper,
} from '../utils/styles';
import { gapStyle } from './gap';
import { fillStyle } from './fill';
import { flowStyle } from './flow';
import { resetStyle } from './reset';
import { colorStyle } from './color';
import { widthStyle } from './width';
import { heightStyle } from './height';
import { radiusStyle } from './radius';
import { borderStyle } from './border';
import { shadowStyle } from './shadow';
import { paddingStyle } from './padding';
import { paddingBlockStyle } from './paddingBlock';
import { paddingInlineStyle } from './paddingInline';
import { presetStyle } from './preset';
import { fontStyleStyle } from './fontStyle';
import { marginStyle } from './margin';
import { marginBlockStyle } from './marginBlock';
import { marginInlineStyle } from './marginInline';
import { fontStyle } from './font';
import { outlineStyle } from './outline';
import { transitionStyle } from './transition';
import { groupRadiusAttr } from './groupRadius';
import { boxShadowCombinator } from './boxShadow.combinator';
import { styledScrollbarStyle } from './styledScrollbar';
import { displayStyle } from './display';
import { alignStyle } from './align';
import { justifyStyle } from './justify';
import { createStyle } from './createStyle';

const numberConverter = (val) => {
  if (typeof val === 'number') {
    return `${val}px`;
  }

  return val;
};
const columnsConverter = (val) => {
  if (typeof val === 'number') {
    return 'minmax(1px, 1fr) '.repeat(val).trim();
  }

  return;
};
const rowsConverter = (val) => {
  if (typeof val === 'number') {
    return 'auto '.repeat(val).trim();
  }

  return;
};

type StyleHandlerMap = Record<string, StyleHandler[]>;

export const STYLE_HANDLER_MAP: StyleHandlerMap = {};

export function defineCustomStyle(
  names: string[] | StyleHandler,
  handler?: RawStyleHandler,
) {
  let handlerWithLookup: StyleHandler;

  if (typeof names === 'function') {
    handlerWithLookup = names;
    names = handlerWithLookup.__lookupStyles;
  } else if (handler) {
    handlerWithLookup = Object.assign(handler, { __lookupStyles: names });
  } else {
    console.warn('CubeUIKit: incorrect custom style definition: ', names);
    return;
  }

  handlerWithLookup = styleHandlerCacheWrapper(handlerWithLookup);

  if (Array.isArray(names)) {
    // just to pass type checking
    names.forEach((name) => {
      if (!STYLE_HANDLER_MAP[name]) {
        STYLE_HANDLER_MAP[name] = [];
      }

      STYLE_HANDLER_MAP[name].push(handlerWithLookup);
    });
  }
}

type ConverterHandler = (
  s: string | boolean | number | undefined,
) => string | undefined;

export function defineStyleAlias(
  styleName: string,
  cssStyleName?: string,
  converter?: ConverterHandler,
) {
  const styleHandler = createStyle(styleName, cssStyleName, converter);

  if (!STYLE_HANDLER_MAP[styleName]) {
    STYLE_HANDLER_MAP[styleName] = [];
  }

  STYLE_HANDLER_MAP[styleName].push(styleHandler);
}

export function predefine() {
  // Manually define styles that are used in other custom styles.
  // Otherwise, they won't be handled as expected.
  defineStyleAlias('fontSize');
  defineStyleAlias('lineHeight');
  defineStyleAlias('fontWeight');
  defineStyleAlias('fontStyle');
  defineStyleAlias('letterSpacing');
  defineStyleAlias('textTransform');
  defineStyleAlias('fontFamily');
  defineStyleAlias('paddingTop');
  defineStyleAlias('paddingRight');
  defineStyleAlias('paddingBottom');
  defineStyleAlias('paddingLeft');
  defineStyleAlias('marginTop');
  defineStyleAlias('marginRight');
  defineStyleAlias('marginBottom');
  defineStyleAlias('marginLeft');
  // Coordinates
  defineStyleAlias('top', 'top', numberConverter);
  defineStyleAlias('right', 'right', numberConverter);
  defineStyleAlias('bottom', 'bottom', numberConverter);
  defineStyleAlias('left', 'left', numberConverter);
  // Style aliases
  defineStyleAlias('gridAreas', 'grid-template-areas');
  defineStyleAlias('gridColumns', 'grid-template-columns', columnsConverter);
  defineStyleAlias('gridRows', 'grid-template-rows', rowsConverter);
  defineStyleAlias('gridTemplate', 'grid-template', (val) => {
    if (typeof val !== 'string') return;

    return val
      .split('/')
      .map((s, i) => (i ? columnsConverter : rowsConverter)(s))
      .join('/');
  });

  [
    displayStyle,
    transitionStyle,
    resetStyle,
    fillStyle,
    widthStyle,
    marginStyle,
    marginBlockStyle,
    marginInlineStyle,
    gapStyle,
    flowStyle,
    colorStyle,
    heightStyle,
    radiusStyle,
    borderStyle,
    shadowStyle,
    paddingStyle,
    paddingBlockStyle,
    paddingInlineStyle,
    alignStyle,
    justifyStyle,
    presetStyle,
    boxShadowCombinator,
    outlineStyle,
    fontStyle,
    fontStyleStyle,
    groupRadiusAttr,
    styledScrollbarStyle,
  ]
    // @ts-ignore
    .forEach((handler) => defineCustomStyle(handler));

  return { STYLE_HANDLER_MAP, defineCustomStyle, defineStyleAlias };
}
