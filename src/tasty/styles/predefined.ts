import {
  RawStyleHandler,
  StyleHandler,
  styleHandlerCacheWrapper,
} from '../utils/styles';

import { alignStyle } from './align';
import { borderStyle } from './border';
import { colorStyle } from './color';
import { createStyle } from './createStyle';
import { displayStyle } from './display';
import { fadeStyle } from './fade';
import { fillStyle } from './fill';
import { flowStyle } from './flow';
import { fontStyle } from './font';
import { fontStyleStyle } from './fontStyle';
import { gapStyle } from './gap';
import { groupRadiusAttr } from './groupRadius';
import { heightStyle } from './height';
import { insetStyle } from './inset';
import { justifyStyle } from './justify';
import { marginStyle } from './margin';
import { marginBlockStyle } from './marginBlock';
import { marginInlineStyle } from './marginInline';
import { outlineStyle } from './outline';
import { paddingStyle } from './padding';
import { paddingBlockStyle } from './paddingBlock';
import { paddingInlineStyle } from './paddingInline';
import { presetStyle } from './preset';
import { radiusStyle } from './radius';
import { resetStyle } from './reset';
import { shadowStyle } from './shadow';
import { styledScrollbarStyle } from './styledScrollbar';
import { transitionStyle } from './transition';
import { widthStyle } from './width';

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
  // Dimensions
  defineStyleAlias('minWidth', 'min-width', numberConverter);
  defineStyleAlias('maxWidth', 'max-width', numberConverter);
  defineStyleAlias('minHeight', 'min-height', numberConverter);
  defineStyleAlias('maxHeight', 'max-height', numberConverter);
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
  // Other styles
  defineStyleAlias('outlineOffset', 'outlineOffset', numberConverter);

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
    outlineStyle,
    fontStyle,
    fontStyleStyle,
    groupRadiusAttr,
    styledScrollbarStyle,
    fadeStyle,
    insetStyle,
  ]
    // @ts-ignore
    .forEach((handler) => defineCustomStyle(handler));

  return { STYLE_HANDLER_MAP, defineCustomStyle, defineStyleAlias };
}
