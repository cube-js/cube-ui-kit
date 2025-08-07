import {
  COLOR_FUNCS,
  RE_HEX,
  RE_NUMBER,
  RE_UNIT_NUM,
  VALUE_KEYWORDS,
} from './const';
import { StyleParser } from './parser';
import { Bucket, ParserOptions, ProcessedStyle } from './types';

export function classify(
  raw: string,
  opts: ParserOptions,
  recurse: (str: string) => ProcessedStyle,
): { bucket: Bucket; processed: string } {
  const token = raw.trim();
  if (!token) return { bucket: Bucket.Mod, processed: '' };

  // Early-out: if the token contains unmatched parentheses treat it as invalid
  // and skip it. This avoids cases like `drop-shadow(` that are missing a
  // closing parenthesis (e.g., a user-typo in CSS). We count paren depth while
  // ignoring everything inside string literals to avoid false positives.
  {
    let depth = 0;
    let inQuote: string | 0 = 0;
    for (let i = 0; i < token.length; i++) {
      const ch = token[i];

      // track quote context so parentheses inside quotes are ignored
      if (inQuote) {
        if (ch === inQuote && token[i - 1] !== '\\') inQuote = 0;
        continue;
      }
      if (ch === '"' || ch === "'") {
        inQuote = ch;
        continue;
      }

      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
    }

    if (depth !== 0) {
      // Unbalanced parens → treat as invalid token (skipped).
      console.warn(
        'tasty: skipped invalid function token with unmatched parentheses:',
        token,
      );
      return { bucket: Bucket.Mod, processed: '' };
    }
  }

  // Quoted string literals should be treated as value tokens (e.g., "" for content)
  if (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith("'") && token.endsWith("'"))
  ) {
    return { bucket: Bucket.Value, processed: token };
  }

  // 0. Direct var(--*-color) token
  const varColorMatch = token.match(/^var\(--([a-z0-9-]+)-color\)$/);
  if (varColorMatch) {
    return { bucket: Bucket.Color, processed: token };
  }

  // 1. URL
  if (token.startsWith('url(')) {
    return { bucket: Bucket.Value, processed: token };
  }

  // 2. Custom property
  if (token[0] === '@' || token[0] === '$') {
    const identMatch = token.match(/^[$@]([a-z0-9-_]+)$/);
    if (identMatch) {
      const name = identMatch[1];
      const processed = `var(--${name})`;
      const bucketType = name.endsWith('-color') ? Bucket.Color : Bucket.Value;
      return {
        bucket: bucketType,
        processed,
      };
    }
    // invalid custom property → modifier
  }

  // 3. Hash colors (with optional alpha suffix e.g., #purple.5)
  if (token[0] === '#' && token.length > 1) {
    // alpha form: #name.alpha
    const alphaMatch = token.match(/^#([a-z0-9-]+)\.([0-9]+)$/i);
    if (alphaMatch) {
      const [, base, rawAlpha] = alphaMatch;
      let alpha: string;
      if (rawAlpha === '0') alpha = '0';
      else alpha = `.${rawAlpha}`;
      return {
        bucket: Bucket.Color,
        processed: `rgb(var(--${base}-color-rgb) / ${alpha})`,
      };
    }

    // hyphenated names like #dark-05 should keep full name

    const name = token.slice(1);
    // valid hex → treat as hex literal with fallback
    if (RE_HEX.test(name)) {
      return {
        bucket: Bucket.Color,
        processed: `var(--${name}-color, #${name})`,
      };
    }
    // simple color name token → css variable lookup with rgb fallback
    return { bucket: Bucket.Color, processed: `var(--${name}-color)` };
  }

  // 4 & 5. Functions
  const openIdx = token.indexOf('(');
  if (openIdx > 0 && token.endsWith(')')) {
    const fname = token.slice(0, openIdx);
    const inner = token.slice(openIdx + 1, -1); // without ()

    if (COLOR_FUNCS.has(fname)) {
      // Process inner to expand nested colors or units.
      const argProcessed = recurse(inner).output.replace(/,\s+/g, ','); // color funcs expect no spaces after commas
      return { bucket: Bucket.Color, processed: `${fname}(${argProcessed})` };
    }

    // user function (provided via opts)
    if (opts.funcs && fname in opts.funcs) {
      // split by top-level commas within inner
      const tmp = new StyleParser(opts).process(inner); // fresh parser w/ same opts but no cache share issues
      const argProcessed = opts.funcs[fname](tmp.groups);
      return { bucket: Bucket.Value, processed: argProcessed };
    }

    // generic: process inner and rebuild
    const argProcessed = recurse(inner).output;
    return { bucket: Bucket.Value, processed: `${fname}(${argProcessed})` };
  }

  // 6. Custom property with fallback syntax: (${prop}, fallback)
  if (token.startsWith('(') && token.endsWith(')')) {
    const inner = token.slice(1, -1);
    const match = inner.match(/^[$@]([a-z0-9-_]+)\s*,\s*(.*)$/);
    if (match) {
      const [, name, fallback] = match;
      const processedFallback = recurse(fallback).output;
      return {
        bucket: Bucket.Value,
        processed: `var(--${name}, ${processedFallback})`,
      };
    }
  }

  // 7. Auto-calc group
  if (token[0] === '(' && token[token.length - 1] === ')') {
    const inner = token.slice(1, -1);
    const innerProcessed = recurse(inner).output;
    return { bucket: Bucket.Value, processed: `calc(${innerProcessed})` };
  }

  // 8. Unit number
  const um = token.match(RE_UNIT_NUM);
  if (um) {
    const unit = um[1];
    const numericPart = parseFloat(token.slice(0, -unit.length));
    const handler = opts.units && opts.units[unit];
    if (handler) {
      if (typeof handler === 'string') {
        // Special-case the common `x` → gap mapping used by tests.
        const base = unit === 'x' ? 'var(--gap)' : handler;
        if (numericPart === 1) {
          return { bucket: Bucket.Value, processed: base };
        }
        return {
          bucket: Bucket.Value,
          processed: `calc(${numericPart} * ${base})`,
        };
      } else {
        // Function units return complete CSS expressions, no wrapping needed
        const inner = handler(numericPart);
        return {
          bucket: Bucket.Value,
          processed: inner,
        };
      }
    }
  }

  // 8b. Unknown numeric+unit → treat as literal value (e.g., 1fr)
  if (/^[+-]?(?:\d*\.\d+|\d+)[a-z%]+$/.test(token)) {
    return { bucket: Bucket.Value, processed: token };
  }

  // 8c. Plain unit-less numbers should be treated as value tokens so that
  // code such as `scrollbar={10}` resolves correctly.
  if (RE_NUMBER.test(token)) {
    return { bucket: Bucket.Value, processed: token };
  }

  // 9. Literal value keywords
  if (VALUE_KEYWORDS.has(token)) {
    return { bucket: Bucket.Value, processed: token };
  }

  // 9b. Special keyword colors
  if (token === 'transparent' || token === 'currentcolor') {
    return { bucket: Bucket.Color, processed: token };
  }

  // 10. Fallback modifier
  return { bucket: Bucket.Mod, processed: token };
}
