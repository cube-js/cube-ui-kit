export const VALUE_KEYWORDS = new Set([
  'auto',
  'max-content',
  'min-content',
  'fit-content',
  'stretch',
  'initial',
]);

export const COLOR_FUNCS = new Set([
  'rgb',
  'rgba',
  'hsl',
  'hsla',
  'hwb',
  'lab',
  'lch',
  'oklab',
  'oklch',
  'color',
  'device-cmyk',
  'gray',
  'color-mix',
  'color-contrast',
]);

export const RE_UNIT_NUM = /^[+-]?(?:\d*\.\d+|\d+)([a-z][a-z0-9]*)$/;
export const RE_NUMBER = /^[+-]?(?:\d*\.\d+|\d+)$/;
export const RE_HEX = /^(?:[0-9a-f]{3,4}|[0-9a-f]{6}(?:[0-9a-f]{2})?)$/;
