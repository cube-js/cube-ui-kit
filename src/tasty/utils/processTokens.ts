import { CSSProperties } from 'react';

import { Tokens, TokenValue } from '../types';

import { getRgbValuesFromRgbaString, hexToRgb, parseStyle } from './styles';

const devMode = process.env.NODE_ENV !== 'production';

/**
 * Extract RGB triplet from a color value.
 * Returns the RGB values as a space-separated string (e.g., "255 128 0")
 * or a CSS variable reference for token colors.
 */
function extractRgbValue(colorValue: string, parsedOutput: string): string {
  // If the parsed output references a color variable, use the -rgb variant
  const varMatch = parsedOutput.match(/var\(--([a-z0-9-]+)-color\)/);
  if (varMatch) {
    return `var(--${varMatch[1]}-color-rgb)`;
  }

  // For rgb(...) values, extract the triplet
  if (parsedOutput.startsWith('rgb(')) {
    const rgbValues = getRgbValuesFromRgbaString(parsedOutput);
    if (rgbValues && rgbValues.length >= 3) {
      return rgbValues.join(' ');
    }
  }

  // For hex values, convert to RGB triplet
  if (colorValue.startsWith('#') && /^#[0-9a-fA-F]{3,8}$/.test(colorValue)) {
    const rgbResult = hexToRgb(colorValue);
    if (rgbResult) {
      const rgbValues = getRgbValuesFromRgbaString(rgbResult);
      if (rgbValues && rgbValues.length >= 3) {
        return rgbValues.join(' ');
      }
    }
  }

  // Fallback: return the parsed output (may not be ideal but covers edge cases)
  return parsedOutput;
}

/**
 * Check if a value is a valid token value (string or number, not object).
 */
function isValidTokenValue(
  value: unknown,
): value is Exclude<TokenValue, undefined | null> {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'object') {
    if (devMode) {
      console.warn(
        'CubeUIKit: Object values are not allowed in tokens prop. ' +
          'Tokens do not support state-based styling. Use a primitive value instead.',
      );
    }
    return false;
  }

  return typeof value === 'string' || typeof value === 'number';
}

/**
 * Process a single token value through the tasty parser.
 * Numbers are converted to strings; 0 stays as "0".
 */
function processTokenValue(value: string | number): string {
  if (typeof value === 'number') {
    // 0 should remain as "0", not converted to any unit
    if (value === 0) {
      return '0';
    }
    return parseStyle(String(value)).output;
  }
  return parseStyle(value).output;
}

/**
 * Process tokens object into inline style properties.
 * - $name -> --name with parsed value
 * - #name -> --name-color AND --name-color-rgb with parsed values
 *
 * @param tokens - The tokens object to process
 * @returns CSSProperties object or undefined if no tokens to process
 */
export function processTokens(
  tokens: Tokens | undefined,
): CSSProperties | undefined {
  if (!tokens) {
    return undefined;
  }

  const keys = Object.keys(tokens);
  if (keys.length === 0) {
    return undefined;
  }

  let result: Record<string, string> | undefined;

  for (const key of keys) {
    const value = tokens[key as keyof Tokens];

    // Skip undefined/null values
    if (!isValidTokenValue(value)) {
      continue;
    }

    if (key.startsWith('$')) {
      // Custom property token: $name -> --name
      const propName = `--${key.slice(1)}`;
      const processedValue = processTokenValue(value);

      if (!result) result = {};
      result[propName] = processedValue;
    } else if (key.startsWith('#')) {
      // Color token: #name -> --name-color and --name-color-rgb
      const colorName = key.slice(1);
      const originalValue = typeof value === 'number' ? String(value) : value;
      const processedValue = processTokenValue(value);

      if (!result) result = {};
      result[`--${colorName}-color`] = processedValue;
      result[`--${colorName}-color-rgb`] = extractRgbValue(
        originalValue,
        processedValue,
      );
    }
  }

  return result as CSSProperties | undefined;
}

/**
 * Stringify tokens for memoization key.
 */
export function stringifyTokens(tokens: Tokens | undefined): string {
  if (!tokens) return '';
  return JSON.stringify(tokens);
}
