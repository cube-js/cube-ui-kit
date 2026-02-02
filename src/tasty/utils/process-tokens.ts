import { CSSProperties } from 'react';

import { Tokens, TokenValue } from '../types';

import { okhslToRgb } from './okhsl-to-rgb';
import { getRgbValuesFromRgbaString, hexToRgb, parseStyle } from './styles';

const devMode = process.env.NODE_ENV !== 'production';

/**
 * Parse HSL values from an hsl()/hsla() string.
 * Supports both comma-separated (legacy) and space-separated (modern) syntax:
 *   hsl(200, 40%, 50%)
 *   hsl(200 40% 50%)
 *   hsl(200 40% 50% / 0.5)
 *
 * Returns [h, s, l] where h is 0-360, s and l are 0-1, or null if parsing fails.
 */
function parseHslValues(str: string): [number, number, number] | null {
  const match = str.match(/hsla?\(([^)]+)\)/i);
  if (!match) return null;

  const inner = match[1].trim();
  // Split by slash first (for alpha), then handle color components
  const [colorPart] = inner.split('/');
  // Split by comma or whitespace
  const parts = colorPart
    .trim()
    .split(/[,\s]+/)
    .filter(Boolean);

  if (parts.length < 3) return null;

  // Parse hue (can be unitless degrees, deg, turn, rad, or grad)
  let h = parseFloat(parts[0]);
  const hueStr = parts[0].toLowerCase();
  if (hueStr.endsWith('turn')) {
    h = parseFloat(hueStr) * 360;
  } else if (hueStr.endsWith('rad')) {
    h = (parseFloat(hueStr) * 180) / Math.PI;
  } else if (hueStr.endsWith('grad')) {
    h = parseFloat(hueStr) * 0.9; // 400 grad = 360 deg
  }
  // deg or unitless are already in degrees

  // Normalize hue to 0-360 range
  h = h % 360;
  if (h < 0) h += 360;

  // Parse saturation and lightness (percentages)
  const parsePercent = (val: string): number => {
    const num = parseFloat(val);
    return val.includes('%') ? num / 100 : num;
  };

  const s = Math.max(0, Math.min(1, parsePercent(parts[1])));
  const l = Math.max(0, Math.min(1, parsePercent(parts[2])));

  return [h, s, l];
}

/**
 * Convert HSL to RGB (sRGB).
 * Algorithm from: https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative
 * Same as used in CSS Color 4 spec.
 *
 * @param h - Hue in degrees (0-360)
 * @param s - Saturation (0-1)
 * @param l - Lightness (0-1)
 * @returns RGB values in 0-255 range (may have fractional values)
 */
export function hslToRgbValues(
  h: number,
  s: number,
  l: number,
): [number, number, number] {
  const a = s * Math.min(l, 1 - l);

  const f = (n: number): number => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };

  // Convert 0-1 range to 0-255
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

/**
 * Format a number to a string with up to 1 decimal place, removing trailing zeros.
 */
function formatRgbComponent(n: number): string {
  return parseFloat(n.toFixed(1)).toString();
}

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

  // For hsl(...) values, convert to RGB triplet
  if (
    parsedOutput.startsWith('hsl(') ||
    parsedOutput.startsWith('hsla(') ||
    colorValue.startsWith('hsl(') ||
    colorValue.startsWith('hsla(')
  ) {
    // Try parsedOutput first, then original colorValue
    const hslValues =
      parseHslValues(parsedOutput) || parseHslValues(colorValue);
    if (hslValues) {
      const [r, g, b] = hslToRgbValues(
        hslValues[0],
        hslValues[1],
        hslValues[2],
      );
      return `${formatRgbComponent(r)} ${formatRgbComponent(g)} ${formatRgbComponent(b)}`;
    }
  }

  // For okhsl(...) values, convert to RGB triplet
  if (parsedOutput.startsWith('okhsl(') || colorValue.startsWith('okhsl(')) {
    // Try parsedOutput first, then original colorValue
    const rgbResult = okhslToRgb(parsedOutput) || okhslToRgb(colorValue);
    if (rgbResult) {
      const rgbValues = getRgbValuesFromRgbaString(rgbResult);
      if (rgbValues && rgbValues.length >= 3) {
        return rgbValues.join(' ');
      }
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
 * Check if a value is a valid token value (string, number, or boolean - not object).
 * Returns false for `false` values (they mean "skip this token").
 */
function isValidTokenValue(
  value: unknown,
): value is Exclude<TokenValue, undefined | null | false> {
  if (value === undefined || value === null || value === false) {
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

  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
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
      // Boolean true for custom properties converts to empty string (valid CSS value)
      const effectiveValue = value === true ? '' : value;
      const processedValue = processTokenValue(effectiveValue);

      if (!result) result = {};
      result[propName] = processedValue;
    } else if (key.startsWith('#')) {
      // Color token: #name -> --name-color and --name-color-rgb
      const colorName = key.slice(1);

      // For color tokens, boolean true means 'transparent'
      const effectiveValue = value === true ? 'transparent' : value;

      const originalValue =
        typeof effectiveValue === 'number'
          ? String(effectiveValue)
          : effectiveValue;
      const lowerValue = originalValue.toLowerCase();
      const processedValue = processTokenValue(effectiveValue);

      if (!result) result = {};
      result[`--${colorName}-color`] = processedValue;

      // Skip RGB generation for #current values (currentcolor is dynamic, cannot extract RGB)
      // Match only #current or #current.opacity, not #current-theme or #currently-used
      if (/^#current(?:\.|$)/i.test(lowerValue)) {
        continue;
      }

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
