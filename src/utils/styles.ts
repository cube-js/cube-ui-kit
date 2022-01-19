import { Styles } from '../styles/types';

import { getModCombinations } from './index';

export type StyleValue<T = string> = T | boolean | number | null;

export type StyleValueStateMap<T = string> = {
  [key: string]: StyleValue<T>;
};

export type ResponsiveStyleValue<T = string> =
  | StyleValue<T>
  | StyleValue<T>[]
  | StyleValueStateMap<T>
  | StyleValueStateMap<T>[];

export type ComputeModel = string | number;

export type CSSMap = { $?: string } & { [key: string]: string | string[] };

export type RawStyleHandler = (
  value: StyleValueStateMap,
  suffix?: string,
) => CSSMap | CSSMap[] | void;

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

export type StyleStateDataList = StyleStateData[];

export type StyleStateDataListMap = { [key: string]: StyleStateDataList };

/** An object that describes a relation between specific modifiers and style value. **/
export interface StyleState {
  /** The list of mods to apply */
  mods: string[];
  /** The list of **not** mods to apply (e.g. `:not(:hover)`) */
  notMods: string[];
  /** The value to apply */
  value: StyleMap;
}

export type ComputeUnit = string | (string | string[])[];

export type StyleStateList = StyleState[];

export type StyleMap = { [key: string]: ResponsiveStyleValue };

export type StyleStateMap = { [key: string]: StyleState };

export type StyleStateMapList = StyleStateMap[];

export type StyleStateListMap = { [key: string]: StyleStateList };

const devMode = process.env.NODE_ENV !== 'production';

export const CUSTOM_UNITS = {
  r: 'var(--radius)',
  bw: 'var(--border-width)',
  ow: 'var(--outline-width)',
  x: 'var(--gap)',
  fs: 'var(--font-size)',
  lh: 'var(--line-height)',
  rp: 'var(--rem-pixel)',
  gp: 'var(--column-gap)',
  // global setting
  wh: function wh(num) {
    return `calc(var(--cube-visual-viewport-height) / 100 * ${num})`;
  },
  // span unit for GridProvider
  sp: function spanWidth(num) {
    return `((${num} * var(--column-width)) + (${
      num - 1
    } * var(--column-gap)))`;
  },
};

export const DIRECTIONS = ['top', 'right', 'bottom', 'left'];

const COLOR_FUNCS = ['rgb', 'rgba'];
const IGNORE_MODS = [
  'auto',
  'max-content',
  'min-content',
  'none',
  'subgrid',
  'initial',
];

const ATTR_REGEXP
  = /("[^"]*")|('[^']*')|([a-z-]+\()|(#[a-z0-9.-]{2,}(?![a-f0-9[-]))|(--[a-z0-9-]+|@[a-z0-9-]+)|([a-z][a-z0-9-]*)|(([0-9]+(?![0-9.])|[0-9-.]{2,}|[0-9-]{2,}|[0-9.-]{3,})([a-z%]{0,3}))|([*/+-])|([()])|(,)/gi;
const ATTR_CACHE = new Map();
const ATTR_CACHE_AUTOCALC = new Map();
const ATTR_CACHE_IGNORE_COLOR = new Map();
const MAX_CACHE = 10000;
const ATTR_CACHE_MODE_MAP = [
  ATTR_CACHE_AUTOCALC,
  ATTR_CACHE,
  ATTR_CACHE_IGNORE_COLOR,
];
const PREPARE_REGEXP = /calc\((\d*)\)/gi;

export function createRule(prop, value, selector) {
  if (value == null) return '';

  if (selector) {
    return `${selector} { ${prop}: ${value}; }\n`;
  }

  return `${prop}: ${value};\n`;
}

function getModSelector(modName) {
  return modName.match(/^[a-z]/) ? `[data-is-${modName}]` : modName;
}

/**
 *
 * @param {String} value
 * @param {Number} mode
 * @returns {Object<String,String|Array>}
 */
export function parseStyle(value, mode = 0) {
  if (typeof value === 'number') {
    value = String(value);
  }

  if (typeof value !== 'string') {
    return {
      values: [],
      mods: [],
      all: [],
      value: '',
    };
  }

  const CACHE = ATTR_CACHE_MODE_MAP[mode];

  if (!CACHE.has(value)) {
    if (CACHE.size > MAX_CACHE) {
      CACHE.clear();
    }

    const mods: string[] = [];
    const all: string[] = [];
    const values: string[] = [];
    const autoCalc = mode !== 1;

    let currentValue = '';
    let calc = -1;
    let counter = 0;
    let parsedValue = '';
    let color = '';
    let currentFunc = '';
    let usedFunc = '';
    let token;

    ATTR_REGEXP.lastIndex = 0;

    value = value.replace(/@\(/g, 'var(--');

    while ((token = ATTR_REGEXP.exec(value))) {
      let [
        ,
        quotedDouble,
        quotedSingle,
        func,
        hashColor,
        prop,
        mod,
        unit,
        unitVal,
        unitMetric,
        operator,
        bracket,
        comma,
      ] = token;

      if (quotedSingle || quotedDouble) {
        currentValue += `${quotedSingle || quotedDouble} `;
      } else if (func) {
        currentFunc = func.slice(0, -1);
        currentValue += func;
        counter++;
      } else if (hashColor) {
        // currentValue += `${hashColor} `;
        if (mode === 2) {
          color = hashColor;
        } else {
          color = parseColor(hashColor, false).color;
        }
      } else if (mod) {
        // ignore mods inside brackets
        if (counter || IGNORE_MODS.includes(mod)) {
          currentValue += `${mod} `;
        } else {
          mods.push(mod);
          all.push(mod);
          parsedValue += `${mod} `;
        }
      } else if (bracket) {
        if (bracket === '(') {
          if (!~calc) {
            calc = counter;
            currentValue += 'calc';
          }

          counter++;
        }

        if (bracket === ')' && counter) {
          currentValue = currentValue.trim();

          if (counter > 0) {
            counter--;
          }

          if (counter === calc) {
            calc = -1;
          }
        }

        if (bracket === ')' && !counter) {
          usedFunc = currentFunc;
          currentFunc = '';
        }

        currentValue += `${bracket}${bracket === ')' ? ' ' : ''}`;
      } else if (operator) {
        if (!~calc && autoCalc) {
          if (currentValue) {
            if (currentValue.includes('(')) {
              const index = currentValue.lastIndexOf('(');

              currentValue = `${currentValue.slice(
                0,
                index,
              )}(calc(${currentValue.slice(index + 1)}`;

              calc = counter;
              counter++;
            }
          } else if (values.length) {
            parsedValue = parsedValue.slice(
              0,
              parsedValue.length - values[values.length - 1].length - 1,
            );

            let tmp = values.splice(values.length - 1, 1)[0];

            all.splice(values.length - 1, 1);

            if (tmp) {
              if (tmp.startsWith('calc(')) {
                tmp = tmp.slice(4);
              }

              calc = counter;
              counter++;
              currentValue = `calc((${tmp}) `;
            }
          }
        }

        currentValue += `${operator} `;
      } else if (unit) {
        if (unitMetric && CUSTOM_UNITS[unitMetric]) {
          let add = customUnit(unitVal, unitMetric);

          if (!~calc && add.startsWith('(')) {
            currentValue += 'calc';
          }

          currentValue += `${add} `;
        } else {
          currentValue += `${unit} `;
        }
      } else if (prop) {
        prop = prop.replace('@', '--');
        if (currentFunc !== 'var') {
          currentValue += `var(${prop}) `;
        } else {
          currentValue += `${prop} `;
        }
      } else if (comma) {
        if (~calc) {
          calc = -1;
          counter--;
          currentValue = `${currentValue.trim()}), `;
        } else {
          currentValue = `${currentValue.trim()}, `;
        }

        if (!counter) {
          all.push(',');
        }
      }

      if (currentValue && !counter) {
        let prepared = prepareParsedValue(currentValue);

        if (COLOR_FUNCS.includes(usedFunc)) {
          color = prepared;
        } else if (prepared.startsWith('color(')) {
          prepared = prepared.slice(6, -1);

          color = parseColor(prepared).color;
        } else {
          if (prepared !== ',') {
            values.push(prepared);
            all.push(prepared);
          }

          parsedValue += `${prepared} `;
        }

        currentValue = '';
      }
    }

    if (counter) {
      let prepared = prepareParsedValue(
        `${currentValue.trim()}${')'.repeat(counter)}`,
      );

      if (prepared.startsWith('color(')) {
        prepared = prepared.slice(6, -1);

        color = parseColor(prepared).color;
      } else {
        if (prepared !== ',') {
          values.push(prepared);
          all.push(prepared);
        }

        parsedValue += prepared;
      }
    }

    CACHE.set(value, {
      values,
      mods,
      all,
      value: `${parsedValue} ${color}`.trim(),
      color,
    });
  }

  return CACHE.get(value);
}

/**
 *
 * @param {String} val
 * @param {Boolean} ignoreError
 * @return {{color}|{color: string, name: *, opacity: *}|{}|{color: string, name: string, opacity: (number|number)}|{color: string, name: *}}
 */
export function parseColor(val, ignoreError = false) {
  val = val.trim();

  if (!val) return {};

  if (val.startsWith('#')) {
    val = val.slice(1);

    const tmp = val.split('.');

    let opacity = 100;

    if (tmp.length > 1) {
      if (tmp[1].length === 1) {
        opacity = Number(tmp[1]) * 10;
      } else {
        opacity = Number(tmp[1]);
      }

      if (Number.isNaN(opacity)) {
        opacity = 100;
      }
    }

    const name = tmp[0];

    let color;

    if (name === 'current') {
      color = 'currentColor';
    } else {
      if (opacity > 100) {
        opacity = 100;
      } else if (opacity < 0) {
        opacity = 0;
      }
    }

    color
      = opacity !== 100
        ? rgbColorProp(name, Math.round(opacity) / 100)
        : colorProp(name, null, strToRgb(`#${name}`));

    return {
      color,
      name,
      opacity: opacity != null ? opacity : 100,
    };
  }

  let { values, mods, color } = parseStyle(val);

  let name, opacity;

  if (color) {
    return {
      color: (!color.startsWith('var(') ? strToRgb(color) : color) || color,
    };
  }

  values.forEach((token) => {
    if (token.match(/^((var|rgb|rgba|hsl|hsla)\(|#[0-9a-f]{3,6})/)) {
      color = !token.startsWith('var') ? strToRgb(token) : token;
    } else if (token.endsWith('%')) {
      opacity = parseInt(token);
    }
  });

  if (color) {
    return { color };
  }

  name = name || mods[0];

  if (!name) {
    if (!ignoreError && devMode) {
      console.warn('CubeUIKit: incorrect color value:', val);
    }

    return {};
  }

  if (!opacity) {
    let color;

    if (name === 'current') {
      color = 'currentColor';
    } else if (name === 'inherit') {
      color = 'inherit';
    } else {
      color = `var(--${name}-color)`;
    }

    return {
      name,
      color,
    };
  }

  return {
    color: rgbColorProp(name, Math.round(opacity) / 100),
    name,
    opacity,
  };
}

export function rgbColorProp(
  colorName: string,
  opacity: number,
  fallbackColorName?: Function,
  fallbackValue?: Function,
) {
  const fallbackValuePart = fallbackValue ? `, ${fallbackValue}` : '';

  return `rgba(var(--${colorName}-color-rgb${
    fallbackColorName
      ? `, var(--${fallbackColorName}-color-rgb, ${fallbackValuePart})`
      : fallbackValuePart
  }), ${opacity})`;
}

export function colorProp(colorName, fallbackColorName, fallbackValue) {
  const fallbackValuePart = fallbackValue ? `, ${fallbackValue}` : '';

  return `var(--${colorName}-color${
    fallbackColorName
      ? `, var(--${fallbackColorName}${fallbackValuePart})`
      : fallbackValuePart
  })`;
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

  if (Number.isNaN(rgba[0])) {
    return 'rgba(0, 0, 0, 1)';
  }

  if (rgba.length === 3) {
    return `rgb(${rgba.join(', ')})`;
  } else if (rgba.length === 4) {
    return `rgba(${rgba.join(', ')})`;
  }

  return null;
}

export function transferMods(mods, from, to) {
  mods.forEach((mod) => {
    if (from.includes(mod)) {
      to.push(mod);
      from.splice(from.indexOf(mod), 1);
    }
  });
}

function prepareParsedValue(val) {
  return val.trim().replace(PREPARE_REGEXP, (s, inner) => inner);
}

export function filterMods(mods, allowedMods) {
  return mods.filter((mod) => allowedMods.includes(mod));
}

export function customUnit(value, unit) {
  const converter = CUSTOM_UNITS[unit];

  if (typeof converter === 'function') {
    return converter(value);
  }

  if (value === '1' || value === 1) {
    return converter;
  }

  return `(${value} * ${converter})`;
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
    ...props.styles,
  };

  Object.keys(props).forEach((prop) => {
    const propName = propMap ? propMap[prop] || prop : prop;
    const value = props[prop];

    if (ignoreList && ignoreList.includes(prop)) {
      // do nothing
    } else if (styleList.includes(propName)) {
      // If value is not nullish then map it to the styles
      if (value != null && value !== false) {
        styles[propName] = value;
        // If value is nullish then erase the default value of the style
      } else if (propName in styles) {
        delete styles[propName];
      }
    }
  }, {});

  return styles;
}

/**
 * Render CSSMap to Styled Components CSS
 * @param styles
 * @param [selector]
 */
export function renderStylesToSC(styles: CSSMap | CSSMap[], selector = '') {
  if (!styles) return '';

  if (Array.isArray(styles)) {
    return styles.reduce((css, stls) => {
      return css + renderStylesToSC(stls, selector);
    }, '');
  }

  const { $, css, ...styleProps } = styles;
  let renderedStyles = Object.keys(styleProps).reduce(
    (styleList, styleName) => {
      const value = styleProps[styleName];

      if (Array.isArray(value)) {
        return (
          styleList
          + value.reduce((css, val) => {
            if (val) {
              return css + `${styleName}:${val};\n`;
            }

            return css;
          }, '')
        );
      }

      if (value) {
        return `${styleList}${styleName}:${value};\n`;
      }

      return styleList;
    },
    '',
  );

  if (css) {
    renderedStyles = css + '\n' + renderedStyles;
  }

  if (!renderedStyles) {
    return '';
  }

  if (Array.isArray($)) {
    return `${selector ? `${selector}{\n` : ''}${$.reduce((rend, suffix) => {
      return (
        rend
        + `${suffix ? `&${suffix}{\n` : ''}${renderedStyles}${
          suffix ? '}\n' : ''
        }`
      );
    }, '')}${selector ? '}\n' : ''}`;
  }

  return `${selector ? `${selector}{\n` : ''}${
    $ ? `&${$}{\n` : ''
  }${renderedStyles}${$ ? '}\n' : ''}${selector ? '}\n' : ''}`;
}

/**
 * Compile states to finite CSS with selectors.
 * State values should contain a string value with CSS style list.
 * @param {string} selector
 * @param {StyleStateList|StyleStateMapList} states
 * @param {string} suffix
 */
export function applyStates(selector: string, states, suffix: string = '') {
  return states.reduce((css, state) => {
    if (!state.value) return css;

    const modifiers = `${(state.mods || []).map(getModSelector).join('')}${(
      state.notMods || []
    )
      .map((mod) => `:not(${getModSelector(mod)})`)
      .join('')}`;

    return `${css}${selector}${modifiers}${suffix}{\n${state.value}}\n`;
  }, '');
}

export function styleHandlerCacheWrapper(styleHandler, limit = 1000) {
  const wrappedStyleHandler = cacheWrapper((styleMap) => {
    return renderStylesToSC(styleHandler(styleMap));
  }, limit);

  const wrappedMapHandler = cacheWrapper((styleMap, suffix = '') => {
    if (styleMap == null || styleMap === false) return null;

    const stateMapList = styleMapToStyleMapStateList(styleMap);

    replaceStateValues(stateMapList, wrappedStyleHandler);

    return applyStates('&', stateMapList, suffix);
  }, limit);

  return Object.assign(wrappedMapHandler, {
    __lookupStyles: styleHandler.__lookupStyles,
  });
}

/**
 * Replace state values with new ones.
 * For example, if you want to replace initial values with finite CSS code.
 * @param {StyleStateList|StyleStateMapList} states
 * @param {Function} replaceFn
 */
export function replaceStateValues(states, replaceFn) {
  const cache = new Map();

  states.forEach((state) => {
    if (!cache.get(state.value)) {
      cache.set(state.value, replaceFn(state.value));
    }

    state.value = cache.get(state.value);
  });

  return states;
}

/**
 * Get all presented modes from style state list.
 * @param {StyleStateList} stateList
 */
export function getModesFromStyleStateList(stateList) {
  return stateList.reduce((list, state) => {
    state.mods.forEach((mod) => {
      if (!list.includes(mod)) {
        list.push(mod);
      }
    });

    return list;
  }, []);
}

/**
 * Get all presented modes from style state list map.
 * @param {StyleStateMapList} stateListMap
 * @return {string[]}
 */
export function getModesFromStyleStateListMap(stateListMap) {
  return Object.keys(stateListMap).reduce((list: string[], style) => {
    const stateList = stateListMap[style];

    getModesFromStyleStateList(stateList).forEach((mod) => {
      if (!list.includes(mod)) {
        list.push(mod);
      }
    });

    return list;
  }, []);
}

/**
 * Convert style map to the normalized style map state list.
 * @param styleMap
 * @param filterKeys
 */
export function styleMapToStyleMapStateList(
  styleMap: StyleMap,
  filterKeys?: string[],
) {
  const keys = filterKeys || Object.keys(styleMap);

  if (!keys.length) return [];

  /**
   * //@type {StyleStateListMap}
   */
  const stateDataListMap = {};

  let allModsSet: Set<string> = new Set();

  keys.forEach((style) => {
    stateDataListMap[style] = styleStateMapToStyleStateDataList(
      styleMap[style],
    );
    stateDataListMap[style].mods.forEach(allModsSet.add, allModsSet);
  });

  const allModsArr: string[] = Array.from(allModsSet);

  const styleStateMapList: StyleStateList = [];

  getModCombinations(allModsArr, true).forEach((combination) => {
    styleStateMapList.push({
      mods: combination,
      notMods: allModsArr.filter((mod) => !combination.includes(mod)),
      value: keys.reduce((map, key) => {
        map[key] = stateDataListMap[key].states.find((state) => {
          return computeState(state.model, (mod) => combination.includes(mod));
        }).value;

        return map;
      }, {}),
    });
  });

  return styleStateMapList;
}

const STATES_REGEXP
  = /([&|!^])|([()])|([a-z0-6-]+)|(:[a-z0-6-]+)|(\.[a-z0-6-]+)|(\[[^\]]+])/gi;
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
          tokens[i - 1]
          && tokens[i + 1]
          && tokens[i - 1].length !== 1
          && tokens[i + 1].length !== 1
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
function parseStateNotationInner<T>(notation: string, value: T) {
  const tokens = notation.replace(/,/g, '|').match(STATES_REGEXP);

  if (!tokens || !tokens.length) {
    return {
      model: null,
      mods: [],
      tokens,
      value,
    };
  } else if (tokens.length === 1) {
    return {
      model: tokens[0],
      mods: tokens.slice(0),
      tokens,
      value,
    };
  }

  const mods: string[] = [];

  let operations: any[][] = [[]];
  let list = operations[0];
  let position = 0;

  tokens.forEach((token) => {
    switch (token) {
      case '(':
        const operation = [];
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
    model: convertTokensToComputeUnits(operations[0]),
    value,
  };
}

export const parseStateNotation = cacheWrapper(parseStateNotationInner);

/**
 *
 * @param {StyleStateMap|string|number|boolean|null|undefined} styleStateMap
 * @return {{ states: StyleStateDataList, mods: string[] }}
 */
export function styleStateMapToStyleStateDataList(
  styleStateMap: StyleStateMap | ResponsiveStyleValue,
) {
  if (typeof styleStateMap !== 'object' || !styleStateMap) {
    return {
      states: [
        {
          model: null,
          mods: [],
          value: styleStateMap,
        },
      ],
      mods: [],
    };
  }

  const stateDataList: StyleStateDataList = [];

  Object.keys(styleStateMap).forEach((stateNotation) => {
    const state = parseStateNotation(stateNotation);

    state.value = styleStateMap[stateNotation];

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
  '!': (a) => !a,
  '^': (a, b) => a ^ b,
  '|': (a, b) => a | b,
  '&': (a, b) => a & b,
};

/**
 * Compute a result based on model and incoming map.
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

export function cacheWrapper(handler: Function, limit = 1000) {
  let cache = {};
  let count = 0;

  return (map: any, suffix?: string) => {
    const args = [map, suffix];
    const key
      = typeof args[0] === 'string' && !suffix ? args[0] : JSON.stringify(args);

    if (!cache[key]) {
      if (count > limit) {
        cache = {};
        count = 0;
      }

      count++;

      cache[key] = !suffix ? handler(map) : handler(map, suffix);
    }

    return cache[key];
  };
}
