import { StyleToken } from './ast';

export type CustomUnitMap = Record<string, string | ((key: string) => string)>;

export function renderCustomUnit(token: StyleToken, units?: CustomUnitMap) {
  units = units || {};

  const converter = token.unit ? units[token.unit] : undefined;

  if (!converter) {
    return token.value;
  }

  if (typeof converter === 'function') {
    return converter(token.value);
  }

  if (token.value === '1') {
    return converter;
  }

  return `calc(${token.amount} * ${converter})`;
}

const INSTANT_VALUES = [')', ','];

/**
 * Render a style tokens to a string.
 */
export function renderStyleTokens(
  tokens: StyleToken[],
  { units }: { units?: CustomUnitMap } = {},
) {
  let result = '';

  tokens.forEach((token) => {
    if (INSTANT_VALUES.includes(token.value)) {
      result += token.value;
    } else if (token.type === 'func') {
      result += token.children
        ? `${token.value}(${renderStyleTokens(token.children, units)})`
        : '';
    } else if (token.type === 'value') {
      result += renderCustomUnit(token, units);
    } else if (token.type === 'property') {
      result += `var(--${token.value.slice(1)})`;
    } else {
      result += token.value;
    }
  });

  return result;
}
