import { isDevEnv } from '../utils/isDevEnv';
import {
  RawStyleHandler,
  StyleHandler,
  StyleHandlerDefinition,
} from '../utils/styles';

import { alignStyle } from './align';
import { borderStyle } from './border';
import { colorStyle } from './color';
import { createStyle } from './createStyle';
import { displayStyle } from './display';
import { fadeStyle } from './fade';
import { fillStyle, svgFillStyle } from './fill';
import { flowStyle } from './flow';
import { fontStyle } from './font';
import { fontStyleStyle } from './fontStyle';
import { gapStyle } from './gap';
import { groupRadiusAttr } from './groupRadius';
import { heightStyle } from './height';
import { insetStyle } from './inset';
import { justifyStyle } from './justify';
import { marginStyle } from './margin';
import { outlineStyle } from './outline';
import { paddingStyle } from './padding';
import { presetStyle } from './preset';
import { radiusStyle } from './radius';
import { resetStyle } from './reset';
import { scrollbarStyle } from './scrollbar';
import { shadowStyle } from './shadow';
import { styledScrollbarStyle } from './styledScrollbar';
import { transitionStyle } from './transition';
import { widthStyle } from './width';

const devMode = isDevEnv();

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

// Store initial handler state for reset functionality
let initialHandlerMapSnapshot: StyleHandlerMap | null = null;

/**
 * Capture a snapshot of the current STYLE_HANDLER_MAP.
 * Called after predefine() to preserve built-in handler state.
 */
function captureInitialHandlerState(): void {
  initialHandlerMapSnapshot = {};
  for (const key of Object.keys(STYLE_HANDLER_MAP)) {
    // Shallow copy the array - handlers themselves are immutable
    initialHandlerMapSnapshot[key] = [...STYLE_HANDLER_MAP[key]];
  }
}

/**
 * Reset STYLE_HANDLER_MAP to the initial built-in state.
 * Called by resetConfig() to restore handlers after tests.
 */
export function resetHandlers(): void {
  if (!initialHandlerMapSnapshot) {
    // predefine() hasn't been called yet, nothing to reset
    return;
  }

  // Clear current map
  for (const key of Object.keys(STYLE_HANDLER_MAP)) {
    delete STYLE_HANDLER_MAP[key];
  }

  // Restore initial state
  for (const key of Object.keys(initialHandlerMapSnapshot)) {
    STYLE_HANDLER_MAP[key] = [...initialHandlerMapSnapshot[key]];
  }
}

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
  defineStyleAlias('fontSize', 'font-size', numberConverter);
  defineStyleAlias('lineHeight', 'line-height', numberConverter);
  defineStyleAlias('fontWeight', 'font-weight', numberConverter);
  defineStyleAlias('fontStyle');
  defineStyleAlias('letterSpacing', 'letter-spacing', numberConverter);
  defineStyleAlias('textTransform');
  defineStyleAlias('fontFamily');
  defineStyleAlias('overflow');
  defineStyleAlias('paddingTop', 'padding-top', numberConverter);
  defineStyleAlias('paddingRight', 'padding-right', numberConverter);
  defineStyleAlias('paddingBottom', 'padding-bottom', numberConverter);
  defineStyleAlias('paddingLeft', 'padding-left', numberConverter);
  defineStyleAlias('marginTop', 'margin-top', numberConverter);
  defineStyleAlias('marginRight', 'margin-right', numberConverter);
  defineStyleAlias('marginBottom', 'margin-bottom', numberConverter);
  defineStyleAlias('marginLeft', 'margin-left', numberConverter);
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
  defineStyleAlias('outlineOffset', 'outline-offset', numberConverter);

  [
    displayStyle,
    transitionStyle,
    resetStyle,
    fillStyle,
    svgFillStyle,
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
    alignStyle,
    justifyStyle,
    presetStyle,
    outlineStyle,
    fontStyle,
    fontStyleStyle,
    groupRadiusAttr,
    // DEPRECATED: `styledScrollbar` is deprecated, use `scrollbar` instead
    styledScrollbarStyle,
    scrollbarStyle,
    fadeStyle,
    insetStyle,
  ]
    // @ts-ignore
    .forEach((handler) => defineCustomStyle(handler));

  // Capture initial state after all built-in handlers are registered
  captureInitialHandlerState();

  return { STYLE_HANDLER_MAP, defineCustomStyle, defineStyleAlias };
}

// ============================================================================
// Handler Registration API (for configure())
// ============================================================================

/**
 * Normalize a handler definition to a StyleHandler with __lookupStyles.
 * - Function only: lookup styles inferred from key name
 * - [string, fn]: single lookup style
 * - [string[], fn]: multiple lookup styles
 */
export function normalizeHandlerDefinition(
  keyName: string,
  definition: StyleHandlerDefinition,
): StyleHandler {
  let handler: RawStyleHandler;
  let lookupStyles: string[];

  if (typeof definition === 'function') {
    // Function only - lookup styles inferred from key name
    handler = definition;
    lookupStyles = [keyName];
  } else if (Array.isArray(definition)) {
    const [first, fn] = definition;

    if (typeof fn !== 'function') {
      throw new Error(
        `[Tasty] Invalid handler definition for "${keyName}". ` +
          'Tuple must have a function as the second element: [string, function] or [string[], function].',
      );
    }

    handler = fn;

    if (typeof first === 'string') {
      // [string, fn] - single lookup style
      lookupStyles = [first];
    } else if (Array.isArray(first)) {
      // [string[], fn] - multiple lookup styles
      lookupStyles = first;
    } else {
      throw new Error(
        `[Tasty] Invalid handler definition for "${keyName}". ` +
          'First element must be a string or string array.',
      );
    }
  } else {
    throw new Error(
      `[Tasty] Invalid handler definition for "${keyName}". ` +
        'Expected function, [string, function], or [string[], function].',
    );
  }

  // Validate handler in dev mode
  validateHandler(keyName, handler, lookupStyles);

  // Wrap the handler to avoid mutation issues when the same function
  // is reused for multiple handler definitions. Each registration
  // gets its own function identity with its own __lookupStyles.
  const wrappedHandler = ((props) => handler(props)) as StyleHandler;
  wrappedHandler.__lookupStyles = lookupStyles;

  return wrappedHandler;
}

/**
 * Validate a handler definition in development mode.
 */
function validateHandler(
  name: string,
  handler: RawStyleHandler,
  lookupStyles: string[],
): void {
  if (!devMode) return;

  if (typeof handler !== 'function') {
    console.warn(
      `[Tasty] Handler "${name}" is not a function. ` +
        'Handlers must be functions that return CSSMap, CSSMap[], or void.',
    );
  }

  if (
    !lookupStyles ||
    !Array.isArray(lookupStyles) ||
    lookupStyles.length === 0
  ) {
    console.warn(
      `[Tasty] Handler "${name}" has invalid lookupStyles. ` +
        'Expected non-empty array of style names.',
    );
  }
}

/**
 * Validate a handler result in development mode.
 * Call this after invoking a handler to check the return value.
 */
export function validateHandlerResult(name: string, result: unknown): void {
  if (!devMode) return;
  if (result === undefined || result === null) return; // void is valid

  // Check for empty string (migration from old pattern)
  if (result === '') {
    console.warn(
      `[Tasty] Handler "${name}" returned empty string. ` +
        'Return void/undefined instead for no output.',
    );
    return;
  }

  // Check result is object (CSSMap or CSSMap[])
  if (typeof result !== 'object') {
    console.warn(
      `[Tasty] Handler "${name}" returned invalid type: ${typeof result}. ` +
        'Expected CSSMap, CSSMap[], or void.',
    );
  }
}

/**
 * Register a custom handler, replacing any existing handlers for the same lookup styles.
 * This is called by configure() to process user-defined handlers.
 */
export function registerHandler(handler: StyleHandler): void {
  const lookupStyles = handler.__lookupStyles;

  if (!lookupStyles || lookupStyles.length === 0) {
    if (devMode) {
      console.warn(
        '[Tasty] Cannot register handler without __lookupStyles property.',
      );
    }
    return;
  }

  // Replace existing handlers for each lookup style
  for (const styleName of lookupStyles) {
    STYLE_HANDLER_MAP[styleName] = [handler];
  }
}

// ============================================================================
// Wrapped Style Handlers Export
// ============================================================================

/**
 * Create a wrapped handler that can be safely called by users.
 * The wrapper preserves __lookupStyles for proper registration.
 */
function wrapHandler<T extends { __lookupStyles: string[] }>(handler: T): T {
  const fn = handler as unknown as (props: unknown) => unknown;
  const wrapped = ((props: unknown) => fn(props)) as unknown as T;
  wrapped.__lookupStyles = handler.__lookupStyles;
  return wrapped;
}

/**
 * Exported object containing wrapped predefined style handlers.
 * Users can import and call these to extend or delegate to built-in behavior.
 *
 * Internal handlers use *Style suffix for searchability.
 * External API uses short names for convenience.
 *
 * @example
 * ```ts
 * import { styleHandlers, configure } from '@cube-dev/ui-kit';
 *
 * configure({
 *   handlers: {
 *     fill: ({ fill }) => {
 *       if (fill?.startsWith('gradient:')) {
 *         return { background: fill.slice(9) };
 *       }
 *       return styleHandlers.fill({ fill });
 *     },
 *   },
 * });
 * ```
 */
export const styleHandlers = {
  align: wrapHandler(alignStyle),
  border: wrapHandler(borderStyle),
  color: wrapHandler(colorStyle),
  display: wrapHandler(displayStyle),
  fade: wrapHandler(fadeStyle),
  fill: wrapHandler(fillStyle),
  svgFill: wrapHandler(svgFillStyle),
  flow: wrapHandler(flowStyle),
  font: wrapHandler(fontStyle),
  fontStyle: wrapHandler(fontStyleStyle),
  gap: wrapHandler(gapStyle),
  groupRadius: wrapHandler(groupRadiusAttr),
  height: wrapHandler(heightStyle),
  inset: wrapHandler(insetStyle),
  justify: wrapHandler(justifyStyle),
  margin: wrapHandler(marginStyle),
  outline: wrapHandler(outlineStyle),
  padding: wrapHandler(paddingStyle),
  preset: wrapHandler(presetStyle),
  radius: wrapHandler(radiusStyle),
  reset: wrapHandler(resetStyle),
  scrollbar: wrapHandler(scrollbarStyle),
  shadow: wrapHandler(shadowStyle),
  styledScrollbar: wrapHandler(styledScrollbarStyle),
  transition: wrapHandler(transitionStyle),
  width: wrapHandler(widthStyle),
} as const;
