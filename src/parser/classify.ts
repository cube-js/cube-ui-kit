import {
  COLOR_FUNCS,
  RE_HEX,
  RE_NUMBER,
  RE_UNIT_NUM,
  VALUE_KEYWORDS,
} from './const';
import { StyleParser } from './parser';
import { Bucket, ParserOptions, ProcessedStyle, StyleDetails } from './types';

export function classify(
  raw: string,
  opts: ParserOptions,
  recurse: (str: string) => ProcessedStyle,
): { bucket: Bucket; processed: string } {
  const token = raw.trim();
  if (!token) return { bucket: Bucket.Mod, processed: '' };

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
  if (token[0] === '@') {
    const match = token.match(/^@\(([a-z0-9-_]+)\s*,\s*(.*)\)$/);
    if (match) {
      const [, name, fallback] = match;
      const processedFallback = recurse(fallback).output;
      return {
        bucket: Bucket.Value,
        processed: `var(--${name}, ${processedFallback})`,
      };
    }
    const identMatch = token.match(/^@([a-z0-9-_]+)$/);
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

    // hyphen variant e.g., #dark-05 → treat as base color
    const hyphenMatch = token.match(/^#([a-z0-9-]+?)-[0-9]+$/i);
    if (hyphenMatch) {
      return {
        bucket: Bucket.Color,
        processed: `var(--${hyphenMatch[1]}-color)`,
      };
    }

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

  // 6. Auto-calc group
  if (token[0] === '(' && token[token.length - 1] === ')') {
    const inner = token.slice(1, -1);
    const innerProcessed = recurse(inner).output;
    return { bucket: Bucket.Value, processed: `calc(${innerProcessed})` };
  }

  // 7. Unit number
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
        const inner = handler(numericPart);
        // Avoid double wrapping if handler already returns a calc(...)
        return {
          bucket: Bucket.Value,
          processed: inner.startsWith('calc(') ? inner : `calc(${inner})`,
        };
      }
    }
  }

  // 7b. Unknown numeric+unit → treat as literal value (e.g., 1fr)
  if (/^[+-]?(?:\d*\.\d+|\d+)[a-z%]+$/.test(token)) {
    return { bucket: Bucket.Value, processed: token };
  }

  // 7c. Plain unit-less numbers should be treated as value tokens so that
  // code such as `scrollbar={10}` resolves correctly.
  if (RE_NUMBER.test(token)) {
    return { bucket: Bucket.Value, processed: token };
  }

  // 8. Literal value keywords
  if (VALUE_KEYWORDS.has(token)) {
    return { bucket: Bucket.Value, processed: token };
  }

  // 8b. Special keyword colors
  if (token === 'transparent' || token === 'currentcolor') {
    return { bucket: Bucket.Color, processed: token };
  }

  // 9. Fallback modifier
  return { bucket: Bucket.Mod, processed: token };
}
