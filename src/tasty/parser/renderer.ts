import { StyleToken } from './ast';

export const CUSTOM_UNITS: Record<string, string | ((key: string) => string)> =
  {
    r: 'var(--radius)',
    bw: 'var(--border-width)',
    ow: 'var(--outline-width)',
    x: 'var(--gap)',
    fs: 'var(--font-size)',
    lh: 'var(--line-height)',
    rp: 'var(--rem-pixel)',
    gp: 'var(--column-gap)',
  };

export function renderCustomUnit(token: StyleToken) {
  const converter =
    CUSTOM_UNITS[token.unit as unknown as keyof typeof CUSTOM_UNITS];

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

export function renderStyleTokens(tokens: StyleToken[]) {
  let result = '';

  tokens.forEach((token) => {
    if (INSTANT_VALUES.includes(token.value)) {
      result += token.value;
    } else if (token.type === 'func') {
      result += token.children
        ? `${token.value}(${renderStyleTokens(token.children)})`
        : '';
    } else if (token.type === 'value') {
      result += renderCustomUnit(token);
    } else if (token.type === 'property') {
      result += `var(--${token.value.slice(1)})`;
    } else {
      result += token.value;
    }
  });

  return result;
}
