import { StyleParser } from '../parser/parser';
import { Styles } from '../styles/types';

import { cacheWrapper } from './cache-wrapper';
import { camelToKebab } from './case-converter';

import type { ProcessedStyle, StyleDetails } from '../parser/types';

export type StyleValue<T = string> = T | boolean | number | null | undefined;

export type StyleValueStateMap<T = string> = {
  [key: string]: StyleValue<T>;
};

export type ResponsiveStyleValue<T = string> =
  | StyleValue<T>
  | StyleValue<T>[]
  | StyleValueStateMap<T>
  | StyleValueStateMap<T>[];

export type ComputeModel = string | number;

export type CSSMap = { $?: string | string[] } & {
  [key: string]: string | string[];
};

export type StyleHandlerResult = CSSMap | CSSMap[] | void;

export type RawStyleHandler = (
  value: StyleValueStateMap,
  suffix?: string,
) => StyleHandlerResult;

export type StyleHandler = RawStyleHandler & {
  __lookupStyles: string[];
};

export interface StyleStateData {
  model?: ComputeModel;
  tokens?: string[];
  value: ResponsiveStyleValue;
  /** The list of mods to apply */
  mods: string[];
  /** The list of **not** mods to apply (e.g. `:not(:hover)`) */
  notMods: string[];
}

export interface ParsedColor {
  color?: string;
  name?: string;
  opacity?: number;
}

export type StyleStateDataList = StyleStateData[];

export type StyleStateDataListMap = { [key: string]: StyleStateDataList };

export type StyleMap = { [key: string]: ResponsiveStyleValue };

export type StyleStateMap = { [key: string]: StyleStateData };

const devMode = process.env.NODE_ENV !== 'production';

// Precompiled regex patterns for parseColor optimization
// Match var(--name-color...) and extract the name, regardless of fallbacks
const COLOR_VAR_PATTERN = /var\(--([a-z0-9-]+)-color/;
const COLOR_VAR_RGB_PATTERN = /var\(--([a-z0-9-]+)-color-rgb/;
const RGB_ALPHA_PATTERN = /\/\s*([0-9.]+)\)/;
const SIMPLE_COLOR_PATTERNS = [
  /^#[0-9a-fA-F]{3,8}$/, // Hex colors: #fff, #ffffff, #ffff, #ffffffff
  /^rgb\(/, // RGB/RGBA functions
  /^hsl\(/, // HSL/HSLA functions
  /^lch\(/, // LCH color functions
  /^oklch\(/, // OKLCH color functions
  /^var\(--[a-z0-9-]+-color/, // CSS custom properties for colors
  /^currentColor$/, // CSS currentColor keyword
  /^transparent$/, // CSS transparent keyword
];

// Rate limiting for dev warnings to avoid spam
let colorWarningCount = 0;
const MAX_COLOR_WARNINGS = 10;

const IS_DVH_SUPPORTED =
  typeof CSS !== 'undefined' && typeof CSS?.supports === 'function'
    ? CSS.supports('height: 100dvh')
    : false;

export const CUSTOM_UNITS = {
  r: 'var(--radius)',
  cr: 'var(--card-radius)',
  bw: 'var(--border-width)',
  ow: 'var(--outline-width)',
  x: 'var(--gap)',
  fs: 'var(--font-size)',
  lh: 'var(--line-height)',
  rp: 'var(--rem-pixel)',
  gp: 'var(--column-gap)',
  sf: function sf(num) {
    return `minmax(0, ${num}fr)`;
  },
  // global setting
  dvh: function dvh(num) {
    return IS_DVH_SUPPORTED
      ? `${num}dvh`
      : `calc(var(--cube-dynamic-viewport-height, 100dvh) / 100 * ${num})`;
  },
  // span unit for GridProvider
  sp: function spanWidth(num) {
    return `((${num} * var(--column-width)) + (${
      num - 1
    } * var(--column-gap)))`;
  },
};

export const DIRECTIONS = ['top', 'right', 'bottom', 'left'];

const MOD_NAME_CACHE = new Map();

export function getModSelector(modName: string): string {
  if (!MOD_NAME_CACHE.has(modName)) {
    let selector: string;

    // Check if it's a shorthand value mod: key=value, key^=value, key$=value, key*=value
    // Supports: key=value, key="value", key='value', and with ^=, $=, *= operators
    const valueModMatch = modName.match(
      /^([a-z][a-z0-9-]*)(\^=|\$=|\*=|=)(.+)$/i,
    );
    if (valueModMatch) {
      const key = valueModMatch[1];
      const operator = valueModMatch[2];
      let value = valueModMatch[3];

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Convert to full attribute selector with the appropriate operator
      selector = `[data-${camelToKebab(key)}${operator}"${value}"]`;
    } else if (modName.match(/^[a-z]/)) {
      // Boolean mod: convert camelCase to kebab-case
      selector = `[data-${camelToKebab(modName)}]`;
    } else {
      // Check if it contains :has() with capitalized element names
      if (modName.includes(':has(')) {
        selector = modName.replace(/:has\(([^)]+)\)/g, (match, content) => {
          // Validate that combinators have spaces around them
          // Check for capitalized words adjacent to combinators without spaces
          const invalidPattern = /[A-Z][a-z]*[>+~]|[>+~][A-Z][a-z]*/;
          if (invalidPattern.test(content)) {
            console.error(
              `[Tasty] Invalid :has() selector syntax: "${modName}"\n` +
                `Combinators (>, +, ~) must have spaces around them when used with element names.\n` +
                `Example: Use ":has(Body > Row)" instead of ":has(Body>Row)"\n` +
                `This is a design choice: the parser uses simple whitespace splitting for performance.`,
            );
          }

          // Transform capitalized words to [data-element="..."] selectors
          const tokens = content.split(/\s+/);
          const transformed = tokens.map((token: string) =>
            /^[A-Z]/.test(token) ? `[data-element="${token}"]` : token,
          );
          return `:has(${transformed.join(' ')})`;
        });
      } else {
        // Pass through (e.g., :hover, .class, [attr])
        selector = modName;
      }
    }

    MOD_NAME_CACHE.set(modName, selector);
  }

  return MOD_NAME_CACHE.get(modName);
}

// Keep a single shared instance across the whole library so that the cache of
// the new StyleParser keeps working and custom functions/units can be updated
// at runtime.
const __tastyParser = new StyleParser({ units: CUSTOM_UNITS });

// Registry for user-provided custom functions that the parser can call.
// It is updated through the `customFunc` helper exported below.
const __tastyFuncs: Record<string, (groups: StyleDetails[]) => string> = {};

export function customFunc(
  name: string,
  fn: (groups: StyleDetails[]) => string,
) {
  __tastyFuncs[name] = fn;
  __tastyParser.setFuncs(__tastyFuncs);
}

/**
 *
 * @param {String} value
 * @param {Number} mode
 * @returns {Object<String,String|Array>}
 */
export function parseStyle(value: StyleValue): ProcessedStyle {
  let str: string;

  if (typeof value === 'string') {
    str = value;
  } else if (typeof value === 'number') {
    str = String(value);
  } else {
    // boolean, null, undefined, objects etc. → empty string
    str = '';
  }

  return __tastyParser.process(str);
}

/**
 * Parse color. Find it value, name and opacity.
 * Optimized to avoid heavy parseStyle calls for simple color patterns.
 */
export function parseColor(val: string, ignoreError = false): ParsedColor {
  // Early return for non-strings or empty values
  if (typeof val !== 'string') {
    val = String(val ?? '');
  }

  val = val.trim();
  if (!val) return {};

  // Fast path: Check if it's a simple color pattern that doesn't need full parsing
  const isSimpleColor = SIMPLE_COLOR_PATTERNS.some((pattern) =>
    pattern.test(val),
  );

  let firstColor: string;
  let shouldUseParser = false;

  if (isSimpleColor) {
    // For simple colors, use the value directly without parsing
    firstColor = val;
  } else {
    // Complex value - might contain multiple tokens, fallback to full parser
    shouldUseParser = true;
    const processed = parseStyle(val as any);
    const extractedColor = processed.groups.find((g) => g.colors.length)
      ?.colors[0];

    if (!extractedColor) {
      // Rate-limited warning to avoid spam
      if (!ignoreError && devMode && colorWarningCount < MAX_COLOR_WARNINGS) {
        console.warn('CubeUIKit: unable to parse color:', val);
        colorWarningCount++;
        if (colorWarningCount === MAX_COLOR_WARNINGS) {
          console.warn(
            'CubeUIKit: color parsing warnings will be suppressed from now on',
          );
        }
      }
      return {};
    }

    firstColor = extractedColor;
  }

  // Extract color name (if present) from variable pattern using precompiled regex
  let nameMatch = firstColor.match(COLOR_VAR_PATTERN);
  if (!nameMatch) {
    nameMatch = firstColor.match(COLOR_VAR_RGB_PATTERN);
  }

  let opacity: number | undefined;
  if (
    firstColor.startsWith('rgb') ||
    firstColor.startsWith('hsl') ||
    firstColor.startsWith('lch') ||
    firstColor.startsWith('oklch')
  ) {
    const alphaMatch = firstColor.match(RGB_ALPHA_PATTERN);
    if (alphaMatch) {
      const v = parseFloat(alphaMatch[1]);
      if (!isNaN(v)) opacity = v * 100;
    }
  }

  return {
    color: firstColor,
    name: nameMatch ? nameMatch[1] : undefined,
    opacity,
  };
}

export function strToRgb(color, ignoreAlpha = false) {
  if (!color) return undefined;

  if (color.startsWith('rgb')) return color;

  if (color.startsWith('#')) return hexToRgb(color);

  return null;
}

export function getRgbValuesFromRgbaString(str) {
  return str
    .match(/\d+/g)
    .map((s) => parseInt(s))
    .slice(0, 3);
}

export function hexToRgb(hex) {
  const rgba = hex
    .replace(
      /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
      (m, r, g, b) => '#' + r + r + g + g + b + b,
    )
    .substring(1)
    .match(/.{2}/g)
    .map((x, i) => parseInt(x, 16) * (i === 3 ? 1 / 255 : 1));

  if (rgba.some((v) => Number.isNaN(v))) {
    return null;
  }

  if (rgba.length >= 3) {
    return `rgb(${rgba.slice(0, 3).join(' ')}${rgba.length > 3 ? ` / ${rgba[3]}` : ''})`;
  }

  return null;
}

export function filterMods(mods, allowedMods) {
  return mods.filter((mod) => allowedMods.includes(mod));
}

export function extendStyles(defaultStyles, newStyles) {
  let styles = {};

  if (!defaultStyles) {
    if (!newStyles) {
      return styles;
    }
  } else {
    styles = Object.assign({}, defaultStyles);
  }

  if (newStyles) {
    Object.keys(newStyles).forEach((key) => {
      if (newStyles[key] != null) {
        styles[key] = newStyles[key];
      }
    });
  }

  return styles;
}

/**
 * Split properties into style and non-style properties.
 * @param props - Component prop map.
 * @param [styleList] - List of all style properties.
 * @param [defaultStyles] - Default style map of the component.
 * @param [propMap] - Props to style alias map.
 * @param [ignoreList] - A list of properties to ignore.
 */
export function extractStyles(
  props: { [key: string]: any },
  styleList: readonly string[] = [],
  defaultStyles?: Styles,
  propMap?: { [key: string]: string },
  ignoreList: readonly string[] = [],
): Styles {
  const styles: Styles = {
    ...defaultStyles,
    ...(ignoreList.includes('styles') ? undefined : props.styles),
  };

  Object.keys(props).forEach((prop) => {
    const propName = propMap ? propMap[prop] || prop : prop;
    const value = props[prop];

    if (ignoreList && ignoreList.includes(prop)) {
      // do nothing
    } else if (styleList.includes(propName)) {
      styles[propName] = value;
    }
  }, {});

  return styles;
}

const STATES_REGEXP =
  /([&|!^])|([()])|([a-z][a-z0-9-]+=(?:"[^"]*"|'[^']*'|[^\s&|!^()]+))|([a-z][a-z0-9-]+)|(:[a-z][a-z0-9-]+\([^)]+\)|:[a-z][a-z0-9-]+)|(\.[a-z][a-z0-9-]+)|(\[[^\]]+])/gi;
export const STATE_OPERATORS = {
  NOT: '!',
  AND: '&',
  OR: '|',
  XOR: '^',
};

export const STATE_OPERATOR_LIST = ['!', '&', '|', '^'];

/**
 *
 */
function convertTokensToComputeUnits(tokens: any[]) {
  if (tokens.length === 1) {
    return tokens[0];
  }

  STATE_OPERATOR_LIST.forEach((operator) => {
    let i;

    while ((i = tokens.indexOf(operator)) !== -1) {
      const token = tokens[i];

      if (token === '!') {
        if (tokens[i + 1] && tokens[i + 1].length !== 1) {
          tokens.splice(i, 2, ['!', tokens[i + 1]]);
        } else {
          tokens.splice(i, 1);
        }
      } else {
        if (
          tokens[i - 1] &&
          tokens[i + 1] &&
          tokens[i - 1].length !== 1 &&
          tokens[i + 1].length !== 1
        ) {
          tokens.splice(i - 1, 3, [token, tokens[i - 1], tokens[i + 1]]);
        } else {
          tokens.splice(i, 1);
        }
      }
    }
  });

  return tokens.length === 1 ? tokens[0] : tokens;
}

/**
 * Parse state notation and return tokens, modifiers and compute model.
 */
function parseStateNotationInner(notation: string, value: any): StyleStateData {
  const tokens = notation.replace(/,/g, '|').match(STATES_REGEXP);

  if (!tokens || !tokens.length) {
    return {
      model: undefined,
      mods: [],
      notMods: [],
      tokens: [],
      value,
    };
  } else if (tokens.length === 1) {
    return {
      model: tokens[0],
      mods: tokens.slice(0),
      notMods: [],
      tokens,
      value,
    };
  }

  const mods: string[] = [];

  let operations: any[][] = [[]];
  let list = operations[0];
  let position = 0;
  let operation: any[];

  tokens.forEach((token) => {
    switch (token) {
      case '(':
        operation = [];
        position++;
        list = operations[position] = operation;
        break;
      case ')':
        position--;
        operations[position].push(convertTokensToComputeUnits(list));
        list = operations[position];
        break;
      default:
        if (token.length > 1) {
          if (!mods.includes(token)) {
            mods.push(token);
          }
        }
        list.push(token);
    }
  });

  while (position) {
    position--;
    operations[position].push(convertTokensToComputeUnits(list));
    list = operations[position];
  }

  return {
    tokens,
    mods,
    notMods: [],
    model: convertTokensToComputeUnits(operations[0]),
    value,
  };
}

export const parseStateNotation = cacheWrapper(parseStateNotationInner);

/**
 * Parse state notation and return tokens, modifiers and compute model.
 */
export function styleStateMapToStyleStateDataList(
  styleStateMap: StyleStateMap | ResponsiveStyleValue,
): { states: StyleStateDataList; mods: string[] } {
  if (typeof styleStateMap !== 'object' || !styleStateMap) {
    return {
      states: [
        {
          model: undefined,
          mods: [],
          notMods: [],
          value: styleStateMap,
        },
      ],
      mods: [],
    };
  }

  const stateDataList: StyleStateDataList = [];

  Object.keys(styleStateMap).forEach((stateNotation) => {
    const state = parseStateNotation(
      stateNotation,
      styleStateMap[stateNotation],
    );

    stateDataList.push(state);
  });

  stateDataList.reverse();

  let initialState;

  const allMods: string[] = stateDataList.reduce((all: string[], state) => {
    if (!state.mods.length) {
      initialState = state;
    } else {
      state.mods.forEach((mod) => {
        if (!all.includes(mod)) {
          all.push(mod);
        }
      });
    }

    return all;
  }, []);

  if (!initialState) {
    stateDataList.push({
      mods: [],
      notMods: allMods,
      value: true,
    });
  }

  return { states: stateDataList, mods: allMods };
}

export const COMPUTE_FUNC_MAP = {
  '!': (a) => !a, // NOT - boolean negation
  '^': (a, b) => (a && !b) || (!a && b), // XOR - true when exactly one is true
  '|': (a, b) => a || b, // OR - logical OR
  '&': (a, b) => a && b, // AND - logical AND
};

/**
 * Compute a result based on a model and incoming map.
 */
export function computeState(
  computeModel: ComputeModel,
  valueMap: (number | boolean)[] | { [key: string]: boolean } | Function,
) {
  if (!computeModel) return true;

  if (!Array.isArray(computeModel)) {
    if (typeof valueMap === 'function') {
      return !!valueMap(computeModel);
    } else {
      return !!valueMap[computeModel];
    }
  }

  const func = COMPUTE_FUNC_MAP[computeModel[0]];

  if (!func) {
    console.warn(
      'CubeUIKit: unexpected compute method in the model',
      computeModel,
    );
    // return false;
  }

  let a = computeModel[1];

  if (typeof a === 'object') {
    a = !!computeState(a, valueMap);
  } else if (typeof valueMap === 'function') {
    a = !!valueMap(a);
  } else {
    a = !!valueMap[a];
  }

  if (computeModel.length === 2) {
    return func(a);
  }

  let b = computeModel[2];

  if (typeof b === 'object') {
    b = !!computeState(b, valueMap);
  } else if (typeof valueMap === 'function') {
    b = !!valueMap(b);
  } else {
    b = !!valueMap[b];
  }

  return !!func(a, b);
}

const _innerCache = new WeakMap();

export function stringifyStyles(styles: any): string {
  if (styles == null || typeof styles !== 'object') return '';
  const keys = Object.keys(styles).sort();
  const parts: string[] = [];
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i],
      v = styles[k];
    if (v === undefined || typeof v === 'function' || typeof v === 'symbol')
      continue;

    const c0 = k.charCodeAt(0);
    const needsInnerSort =
      ((c0 >= 65 && c0 <= 90) || c0 === 38) &&
      v &&
      typeof v === 'object' &&
      !Array.isArray(v);

    let sv: string;
    if (needsInnerSort) {
      sv = _innerCache.get(v);
      if (sv === undefined) {
        const innerKeys = Object.keys(v).sort();
        const innerParts: string[] = [];
        for (let j = 0; j < innerKeys.length; j++) {
          const ik = innerKeys[j];
          const ivs = JSON.stringify(v[ik]);
          if (ivs !== undefined)
            innerParts.push(JSON.stringify(ik) + ':' + ivs);
        }
        sv = '{' + innerParts.join(',') + '}';
        _innerCache.set(v, sv);
      }
    } else {
      sv = JSON.stringify(v);
    }
    parts.push(JSON.stringify(k) + ':' + sv);
  }
  return '{' + parts.join(',') + '}';
}
