export type RawStyleToken = {
  value: string;
  type: typeof TOKEN_MAP[number];
  negative?: boolean;
  amount?: number;
  unit?: string;
};

const CACHE = new Map<string, RawStyleToken[]>();
const MAX_CACHE = 1000;
const REGEXP =
  /((|-)([0-9]+|[0-9]+\.[0-9]+|\.[0-9]+)([a-z]+|%|))|([a-z][a-z0-9-]*(?=\())|([a-z][a-z0-9-]*)|(#[a-z][a-z0-9-]{2,}|#[a-f0-9]{3}|[a-f0-9]{6})|(@[a-z][a-z0-9-]*)|(--[a-z][a-z0-9-]*)|([+*/-])|([()])|("[^"]*"|'[^']*')|(,)|(\\|\|)|(\s+)/gi;
const TOKEN_MAP = [
  '',
  'value',
  'sign',
  'number',
  'unit',
  'func',
  'mod',
  'color',
  'property',
  'propertyName',
  'operator',
  'bracket',
  'text',
  'comma',
  'delimiter',
  'space',
];

/**
 * Tokenize a style value into a flat array of tokens.
 */
export function tokenize(value: string): RawStyleToken[] {
  value = value.trim();

  if (!value) {
    return [];
  }

  if (CACHE.size > MAX_CACHE) {
    CACHE.clear();
  }

  let tokens: RawStyleToken[] = [];

  if (!CACHE.has(value)) {
    REGEXP.lastIndex = 0;

    let rawToken;

    while ((rawToken = REGEXP.exec(value))) {
      const token: RawStyleToken = rawToken[1]
        ? {
            type: 'value',
            value: rawToken[1],
            negative: !!rawToken[2],
            amount: parseFloat(rawToken[3]),
            unit: rawToken[4],
          }
        : {
            type: TOKEN_MAP[rawToken.indexOf(rawToken[0], 1)],
            value: rawToken[0],
          };

      if (token.type != 'space') {
        tokens.push(token);
      }
    }

    CACHE.set(value, tokens);
  }

  const cachedTokens = CACHE.get(value);

  return cachedTokens ? cachedTokens : [];
}
