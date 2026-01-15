import { getGlobalPredefinedTokens } from '../utils/styles';

import {
  COLOR_FUNCS,
  RE_HEX,
  RE_NUMBER,
  RE_RAW_UNIT,
  RE_UNIT_NUM,
  VALUE_KEYWORDS,
} from './const';
import { StyleParser } from './parser';
import { Bucket, ParserOptions, ProcessedStyle } from './types';

/**
 * Re-parses a value through the parser until it stabilizes (no changes)
 * or max iterations reached. This allows units to reference other units.
 * Example: { x: '8px', y: '2x' } -> '1y' resolves to '16px'
 */
function resolveUntilStable(
  value: string,
  opts: ParserOptions,
  recurse: (str: string) => ProcessedStyle,
  maxIterations = 10,
): string {
  let current = value;
  for (let i = 0; i < maxIterations; i++) {
    // Check if the current value contains a custom unit that needs resolution
    const unitMatch = current.match(RE_UNIT_NUM);
    if (!unitMatch) break; // Not a unit number, no resolution needed

    const unitName = unitMatch[1];
    // Only recurse if the unit is a custom unit we know about
    // Any unit not in opts.units is assumed to be a native CSS unit
    if (!opts.units || !(unitName in opts.units)) break;

    const result = recurse(current);
    if (result.output === current) break; // Stable
    current = result.output;
  }
  return current;
}

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

  // 0a. Check for predefined tokens (configured via configure({ tokens: {...} }))
  // Must happen before default $ and # handling to allow overriding
  if (token[0] === '$' || token[0] === '#') {
    const predefinedTokens = getGlobalPredefinedTokens();
    if (predefinedTokens) {
      // Exact match
      if (token in predefinedTokens) {
        const tokenValue = predefinedTokens[token];
        // Lowercase the token value to match parser behavior (parser lowercases input)
        return classify(tokenValue.toLowerCase(), opts, recurse);
      }
      // Check for color token with alpha suffix: #token.alpha
      if (token[0] === '#') {
        const alphaMatch = token.match(/^(#[a-z0-9-]+)\.([0-9]+)$/i);
        if (alphaMatch) {
          const [, baseToken, rawAlpha] = alphaMatch;
          if (baseToken in predefinedTokens) {
            const resolvedValue = predefinedTokens[baseToken];

            // If resolved value starts with # (color token), use standard alpha syntax
            if (resolvedValue.startsWith('#')) {
              // Lowercase to match parser behavior
              return classify(
                `${resolvedValue.toLowerCase()}.${rawAlpha}`,
                opts,
                recurse,
              );
            }

            // For color functions like rgb(), rgba(), hsl(), hwb(), etc., inject alpha
            // Includes all standard CSS color functions plus okhsl (plugin)
            const funcMatch = resolvedValue.match(
              /^(rgba?|hsla?|hwb|oklab|oklch|lab|lch|color|okhsl|device-cmyk|gray|color-mix|color-contrast)\((.+)\)$/i,
            );
            if (funcMatch) {
              const [, funcName, args] = funcMatch;
              const alpha = rawAlpha === '0' ? '0' : `.${rawAlpha}`;
              // Normalize function name: rgba->rgb, hsla->hsl (modern syntax doesn't need 'a' suffix)
              const normalizedFunc = funcName.replace(/a$/i, '').toLowerCase();
              // Normalize to modern syntax: replace top-level commas with spaces
              // Preserves commas inside nested functions like min(), max(), clamp()
              const normalizeArgs = (a: string) => {
                let result = '';
                let depth = 0;
                for (let i = 0; i < a.length; i++) {
                  const c = a[i];
                  if (c === '(') {
                    depth++;
                    result += c;
                  } else if (c === ')') {
                    depth = Math.max(0, depth - 1);
                    result += c;
                  } else if (c === ',' && depth === 0) {
                    // Skip comma and any following whitespace at top level
                    while (i + 1 < a.length && /\s/.test(a[i + 1])) i++;
                    result += ' ';
                  } else {
                    result += c;
                  }
                }
                return result;
              };
              // Helper: find last top-level occurrence of a character (ignores parentheses)
              const findLastTopLevel = (str: string, ch: string) => {
                let depth = 0;
                for (let i = str.length - 1; i >= 0; i--) {
                  const c = str[i];
                  if (c === ')') depth++;
                  else if (c === '(') depth = Math.max(0, depth - 1);
                  else if (c === ch && depth === 0) return i;
                }
                return -1;
              };

              // Check if already has alpha:
              // - Modern syntax: has `/` separator at top level (works with dynamic alpha like var()/calc())
              // - Legacy syntax: function ends with 'a' (rgba, hsla) and has exactly 4 top-level comma-separated values
              const slashIdx = findLastTopLevel(args, '/');
              const hasModernAlpha = slashIdx !== -1;

              // Count top-level commas to avoid commas inside nested functions
              let topLevelCommaCount = 0;
              let lastTopLevelComma = -1;
              {
                let depth = 0;
                for (let i = 0; i < args.length; i++) {
                  const c = args[i];
                  if (c === '(') depth++;
                  else if (c === ')') depth = Math.max(0, depth - 1);
                  else if (c === ',' && depth === 0) {
                    topLevelCommaCount++;
                    lastTopLevelComma = i;
                  }
                }
              }

              const hasLegacyAlpha =
                !hasModernAlpha &&
                /a$/i.test(funcName) &&
                topLevelCommaCount === 3;

              if (hasModernAlpha || hasLegacyAlpha) {
                // Strip existing alpha (numeric or dynamic) before applying suffix
                const withoutAlpha = hasModernAlpha
                  ? args.slice(0, slashIdx).trim()
                  : args.slice(0, lastTopLevelComma).trim();
                return {
                  bucket: Bucket.Color,
                  processed: `${normalizedFunc}(${normalizeArgs(withoutAlpha)} / ${alpha})`,
                };
              }
              // Add alpha using modern syntax
              return {
                bucket: Bucket.Color,
                processed: `${normalizedFunc}(${normalizeArgs(args)} / ${alpha})`,
              };
            }

            // Fallback: try appending .alpha (may not work for all cases)
            return classify(`${resolvedValue}.${rawAlpha}`, opts, recurse);
          }
        }
      }
    }
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
  if (token[0] === '$') {
    const identMatch = token.match(/^\$([a-z_][a-z0-9-_]*)$/);
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
      const funcResult = opts.funcs[fname](tmp.groups);
      // Re-classify the result to determine proper bucket (e.g., if it returns a color)
      // Pass funcs: undefined to prevent infinite recursion if result matches a function pattern
      return classify(funcResult, { ...opts, funcs: undefined }, recurse);
    }

    // generic: process inner and rebuild
    const argProcessed = recurse(inner).output;
    return { bucket: Bucket.Value, processed: `${fname}(${argProcessed})` };
  }

  // 6. Color fallback syntax: (#name, fallback)
  if (token.startsWith('(') && token.endsWith(')')) {
    const inner = token.slice(1, -1);
    const colorMatch = inner.match(/^#([a-z0-9-]+)\s*,\s*(.*)$/i);
    if (colorMatch) {
      const [, name, fallback] = colorMatch;
      const processedFallback = recurse(fallback).output;
      return {
        bucket: Bucket.Color,
        processed: `var(--${name}-color, ${processedFallback})`,
      };
    }
  }

  // 7. Custom property with fallback syntax: ($prop, fallback)
  if (token.startsWith('(') && token.endsWith(')')) {
    const inner = token.slice(1, -1);
    const match = inner.match(/^\$([a-z_][a-z0-9-_]*)\s*,\s*(.*)$/);
    if (match) {
      const [, name, fallback] = match;
      const processedFallback = recurse(fallback).output;
      const bucketType = name.endsWith('-color') ? Bucket.Color : Bucket.Value;
      return {
        bucket: bucketType,
        processed: `var(--${name}, ${processedFallback})`,
      };
    }
  }

  // 8. Auto-calc group
  if (token[0] === '(' && token[token.length - 1] === ')') {
    const inner = token.slice(1, -1);
    const innerProcessed = recurse(inner).output;
    return { bucket: Bucket.Value, processed: `calc(${innerProcessed})` };
  }

  // 9. Unit number
  const um = token.match(RE_UNIT_NUM);
  if (um) {
    const unit = um[1];
    const numericPart = parseFloat(token.slice(0, -unit.length));
    const handler = opts.units && opts.units[unit];
    if (handler) {
      if (typeof handler === 'string') {
        // Check if this is a raw CSS unit (e.g., "8px", "1rem")
        const rawMatch = handler.match(RE_RAW_UNIT);
        if (rawMatch) {
          // Raw unit: calculate directly instead of using calc()
          const [, baseNum, cssUnit] = rawMatch;
          const result = numericPart * parseFloat(baseNum);
          const processed = `${result}${cssUnit}`;
          // Re-parse to resolve any nested units (e.g., units referencing other units)
          const resolved = resolveUntilStable(processed, opts, recurse);
          return { bucket: Bucket.Value, processed: resolved };
        }

        // Non-raw handler (e.g., "var(--gap)", "calc(...)"): use calc() wrapping
        const base = handler;
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

  // 9b. Unknown numeric+unit → treat as literal value (e.g., 1fr)
  if (/^[+-]?(?:\d*\.\d+|\d+)[a-z%]+$/.test(token)) {
    return { bucket: Bucket.Value, processed: token };
  }

  // 9c. Plain unit-less numbers should be treated as value tokens so that
  // code such as `scrollbar={10}` resolves correctly.
  if (RE_NUMBER.test(token)) {
    return { bucket: Bucket.Value, processed: token };
  }

  // 10. Literal value keywords
  if (VALUE_KEYWORDS.has(token)) {
    return { bucket: Bucket.Value, processed: token };
  }

  // 10b. Special keyword colors
  if (token === 'transparent' || token === 'currentcolor') {
    return { bucket: Bucket.Color, processed: token };
  }

  // 11. Fallback modifier
  return { bucket: Bucket.Mod, processed: token };
}
