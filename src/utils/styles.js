const devMode = process.env.NODE_ENV !== 'production';
export const CUSTOM_UNITS = {
  'r': 'var(--radius)',
  'bw': 'var(--border-width)',
  'ow': 'var(--outline-width)',
  'x': 'var(--gap)',
  'fs': 'var(--font-size)',
  'lh': 'var(--line-height)',
  'rp': 'var(--rem-pixel)',
  // global setting
  'wh': 'var(--window-height)',
};
export const DIRECTIONS = [
  'top',
  'right',
  'bottom',
  'left',
];
const COLOR_FUNCS = ['rgb', 'rgba'];
const IGNORE_MODS = ['auto', 'max-content', 'min-content', 'none', 'subgrid', 'initial'];
const ATTR_REGEXP = /('[^'|]*')|([a-z]+\()|(#[a-z0-9.-]{2,}(?![a-f0-9\[-]))|(--[a-z0-9-]+|@[a-z0-9-]+)|([a-z][a-z0-9-]*)|(([0-9]+(?![0-9.])|[0-9-.]{2,}|[0-9-]{2,}|[0-9.-]{3,})([a-z%]{0,3}))|([*\/+-])|([()])|(,)/ig;
const ATTR_CACHE = new Map;
const ATTR_CACHE_AUTOCALC = new Map;
const ATTR_CACHE_REM = new Map;
const ATTR_CACHE_IGNORE_COLOR = new Map;
const MAX_CACHE = 10000;
const ATTR_CACHE_MODE_MAP = [
  ATTR_CACHE_AUTOCALC,
  ATTR_CACHE_REM,
  ATTR_CACHE,
  ATTR_CACHE_IGNORE_COLOR,
];
const PREPARE_REGEXP = /calc\((\d*)\)/ig;

export function createRule(prop, value, selector) {
  if (value == null) return '';

  if (selector) {
    return `${selector} { ${prop}: ${value}; }\n`;
  }

  return `${prop}: ${value};\n`;
}

/**
 *
 * @param {String} value
 * @param {Number} mode
 * @returns {Object<String,String|Array>}
 */
export function parseStyle(value, mode = 0) {
  const CACHE = ATTR_CACHE_MODE_MAP[mode];

  if (!CACHE.has(value)) {
    if (CACHE.size > MAX_CACHE) {
      CACHE.clear();
    }

    const mods = [];
    const all = [];
    const values = [];
    const insertRem = mode === 1;
    const autoCalc = mode !== 2;

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

    while (token = ATTR_REGEXP.exec(value)) {
      let [s, quoted, func, hashColor, prop, mod, unit, unitVal, unitMetric, operator, bracket, comma] = token;

      if (quoted) {
        currentValue += `${quoted} `;
      } else if (func) {
        currentFunc = func.slice(0, -1);
        currentValue += func;
        counter++;
      } else if (hashColor) {
        // currentValue += `${hashColor} `;
        if (mode === 3) {
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

              currentValue = `${currentValue.slice(0, index)}(calc(${currentValue.slice(index + 1)}`;

              calc = counter;
              counter++;
            }
          } else if (values.length) {
            parsedValue = parsedValue.slice(0, parsedValue.length - values[values.length - 1].length - 1);

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
        } else if (insertRem && !unitMetric && !counter) {
          currentValue += `${unit}rem `;
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
      let prepared = prepareParsedValue(`${currentValue.trim()}${')'.repeat(counter)}`);

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

    if (tmp.length > 0) {
      opacity = Number(tmp[1]);

      if (opacity !== opacity) {
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

    color = opacity !== 100
      ? rgbColorProp(name, Math.round(opacity) / 100)
      : colorProp(name, null, strToRgb(`#${name}`));

    return {
      color,
      name,
      opacity: opacity != null ? opacity : 100,
    };
  }

  console.log('!', val);

  let { values, mods, color } = parseStyle(val, 0);

  let name, opacity;

  if (color) {
    return { color: (!color.startsWith('var(') ? strToRgb(color) : color) || color };
  }

  values.forEach(token => {
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
      warn('incorrect color value:', val);
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
    }
  }

  return {
    color: rgbColorProp(name, Math.round(opacity) / 100),
    name,
    opacity,
  };
}

export function rgbColorProp(colorName, opacity, fallbackColorName, fallbackValue) {
  const fallbackValuePart = fallbackValue ? `, ${fallbackValue}` : '';

  return `rgba(var(--${colorName}-color-rgb${fallbackColorName ? `, var(--${fallbackColorName}-color-rgb, ${fallbackValuePart})` : fallbackValuePart}), ${opacity})`;
}

export function colorProp(colorName, fallbackColorName, fallbackValue) {
  const fallbackValuePart = fallbackValue ? `, ${fallbackValue}` : '';

  return `var(--${colorName}-color${fallbackColorName ? `, var(--${fallbackColorName}${fallbackValuePart})` : fallbackValuePart})`;
}

export function strToRgb(color, ignoreAlpha = false) {
  if (!color) return undefined;

  if (color.startsWith('rgb')) return color;

  return null;
}

export function transferMods(mods, from, to) {
  mods.forEach(mod => {
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
  return mods.filter(mod => allowedMods.includes(mod));
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
