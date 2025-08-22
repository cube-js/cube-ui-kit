/**
 * Fast 32-bit hash function (DJB2 variant)
 * Returns a stable hash for the same input
 */
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer
}

/**
 * Base52 encoding for compact class names
 * Uses: 0-9, a-z, A-Z (excluding confusing chars like 0, O, l, I)
 */
const BASE52_CHARS =
  '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

function toBase52(num: number): string {
  if (num === 0) return BASE52_CHARS[0];

  let result = '';
  while (num > 0) {
    result = BASE52_CHARS[num % 52] + result;
    num = Math.floor(num / 52);
  }
  return result;
}

/**
 * Generate a stable, compact class name from CSS text
 * Format: t-{base52hash}
 */
export function hashCssText(cssText: string): string {
  const hash = djb2Hash(cssText);
  const encoded = toBase52(hash);
  return `t-${encoded}`;
}

/**
 * Generate hash for atomic values with smart encoding
 */
export function hashAtomicValue(value: string): string {
  // Handle common tokens without hashing
  if (value.startsWith('#') && !value.includes('.') && value.length < 12) {
    return value.slice(1); // Remove # prefix for tokens like #surface
  }

  // Handle simple values
  if (/^[\w-]+$/.test(value) && value.length < 8) {
    return value;
  }

  // Hash complex values
  const hash = djb2Hash(value);
  return toBase52(hash);
}

/**
 * Generate hash for selectors with common abbreviations
 */
export function hashSelector(selector: string): string {
  // Handle common selectors
  const commonSelectors: Record<string, string> = {
    ':hover': 'h',
    ':focus': 'f',
    ':active': 'a',
    ':disabled': 'd',
    ':focus-visible': 'fv',
    '[disabled]': 'd',
    '[aria-selected="true"]': 'sel',
  };

  if (commonSelectors[selector]) {
    return commonSelectors[selector];
  }

  // Hash complex selectors
  const hash = djb2Hash(selector);
  return 'x' + toBase52(hash);
}
