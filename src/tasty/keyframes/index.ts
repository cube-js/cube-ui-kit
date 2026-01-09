/**
 * Keyframes Utilities
 *
 * Optimized utilities for extracting and processing keyframes in styles.
 * Designed for zero overhead when no keyframes are used.
 */

import { getGlobalKeyframes, hasGlobalKeyframes } from '../config';
import { KeyframesSteps } from '../injector/types';
import { Styles } from '../styles/types';

// ============================================================================
// Constants
// ============================================================================

const KEYFRAMES_KEY = '@keyframes';

/**
 * Pattern to extract animation names from CSS animation property values.
 * Animation name is typically the first identifier in the shorthand.
 * Handles: "fadeIn 300ms ease-in", "pulse 1s infinite", etc.
 *
 * CSS animation shorthand order (all optional except name):
 * animation: name | duration | timing | delay | iteration | direction | fill-mode | play-state
 *
 * Animation names must:
 * - Start with a letter, underscore, or hyphen (but not a digit or CSS keyword)
 * - Not be CSS keywords: none, initial, inherit, unset, revert
 */
const CSS_KEYWORDS = new Set([
  'none',
  'initial',
  'inherit',
  'unset',
  'revert',
  'auto',
  'normal',
  'running',
  'paused',
]);

/**
 * Pattern to match animation name at the start of an animation value.
 * Must start with letter, underscore, or hyphen (not digit).
 */
const ANIMATION_NAME_PATTERN = /^([a-zA-Z_-][a-zA-Z0-9_-]*)/;

// ============================================================================
// Extraction Functions
// ============================================================================

/**
 * Check if styles object has local @keyframes definition.
 * Fast path: single property lookup.
 */
export function hasLocalKeyframes(styles: Styles): boolean {
  return KEYFRAMES_KEY in styles;
}

/**
 * Extract local @keyframes from styles object.
 * Returns null if no local keyframes (fast path).
 */
export function extractLocalKeyframes(
  styles: Styles,
): Record<string, KeyframesSteps> | null {
  const keyframes = styles[KEYFRAMES_KEY];
  if (!keyframes || typeof keyframes !== 'object') {
    return null;
  }
  return keyframes as Record<string, KeyframesSteps>;
}

/**
 * Merge local and global keyframes.
 * Local keyframes take priority over global.
 * Returns null if no keyframes exist (fast path).
 */
export function mergeKeyframes(
  local: Record<string, KeyframesSteps> | null,
  global: Record<string, KeyframesSteps> | null,
): Record<string, KeyframesSteps> | null {
  if (!local && !global) return null;
  if (!local) return global;
  if (!global) return local;
  // Local overrides global
  return { ...global, ...local };
}

/**
 * Get merged keyframes for styles (local + global).
 * Returns null if no keyframes defined anywhere (fast path).
 */
export function getKeyframesForStyles(
  styles: Styles,
): Record<string, KeyframesSteps> | null {
  const local = extractLocalKeyframes(styles);
  const global = hasGlobalKeyframes() ? getGlobalKeyframes() : null;
  return mergeKeyframes(local, global);
}

// ============================================================================
// Animation Name Extraction
// ============================================================================

/**
 * Extract animation name from a single animation value.
 * Returns null if no valid name found.
 *
 * Examples:
 * - "fadeIn 300ms ease-in" → "fadeIn"
 * - "1s pulse infinite" → "pulse" (name can be anywhere)
 * - "none" → null (CSS keyword)
 * - "300ms ease-in" → null (no name, just duration/timing)
 */
function extractAnimationNameFromValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Split by whitespace and find the first valid animation name
  const parts = trimmed.split(/\s+/);

  for (const part of parts) {
    // Skip CSS keywords
    if (CSS_KEYWORDS.has(part.toLowerCase())) continue;

    // Skip time values (e.g., 300ms, 1s, 0.5s)
    if (/^-?[\d.]+m?s$/i.test(part)) continue;

    // Skip iteration counts (e.g., infinite, 3)
    if (part === 'infinite' || /^\d+$/.test(part)) continue;

    // Skip direction values
    if (
      ['normal', 'reverse', 'alternate', 'alternate-reverse'].includes(
        part.toLowerCase(),
      )
    )
      continue;

    // Skip fill-mode values
    if (['forwards', 'backwards', 'both'].includes(part.toLowerCase()))
      continue;

    // Skip play-state values
    if (['running', 'paused'].includes(part.toLowerCase())) continue;

    // Skip timing functions (ease, linear, ease-in, etc., or cubic-bezier/steps)
    if (
      /^(ease|linear|ease-in|ease-out|ease-in-out|step-start|step-end)$/i.test(
        part,
      )
    )
      continue;
    if (/^(cubic-bezier|steps)\(/i.test(part)) continue;

    // Check if it looks like a valid animation name
    const match = ANIMATION_NAME_PATTERN.exec(part);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract all animation names from an animation property value.
 * Handles multiple animations separated by commas.
 *
 * Example: "fadeIn 300ms, slideIn 500ms ease-out" → ["fadeIn", "slideIn"]
 */
function extractAnimationNamesFromAnimationValue(value: string): string[] {
  const names: string[] = [];

  // Split by comma for multiple animations
  const animations = value.split(',');

  for (const animation of animations) {
    const name = extractAnimationNameFromValue(animation);
    if (name && !names.includes(name)) {
      names.push(name);
    }
  }

  return names;
}

/**
 * Extract animation names from a style value (handles mappings and arrays).
 */
function extractAnimationNamesFromStyleValue(
  value: unknown,
  names: Set<string>,
): void {
  if (typeof value === 'string') {
    for (const name of extractAnimationNamesFromAnimationValue(value)) {
      names.add(name);
    }
  } else if (Array.isArray(value)) {
    // Responsive array
    for (const v of value) {
      extractAnimationNamesFromStyleValue(v, names);
    }
  } else if (value && typeof value === 'object') {
    // State mapping
    for (const v of Object.values(value)) {
      extractAnimationNamesFromStyleValue(v, names);
    }
  }
}

/**
 * Extract all animation names referenced in styles.
 * Scans 'animation' and 'animationName' properties including in state mappings.
 * Returns empty set if no animation properties found (fast path).
 */
export function extractAnimationNamesFromStyles(styles: Styles): Set<string> {
  const names = new Set<string>();

  // Check animation property
  if ('animation' in styles) {
    extractAnimationNamesFromStyleValue(styles.animation, names);
  }

  // Check animationName property
  if ('animationName' in styles) {
    extractAnimationNamesFromStyleValue(styles.animationName, names);
  }

  // Check nested selectors (sub-elements)
  for (const [key, value] of Object.entries(styles)) {
    // Skip non-selector keys and special keys
    if (key === '$' || key === KEYFRAMES_KEY) continue;

    // Check if it's a selector (starts with &, ., or uppercase)
    if (
      (key.startsWith('&') || key.startsWith('.') || /^[A-Z]/.test(key)) &&
      value &&
      typeof value === 'object'
    ) {
      // Recursively extract from nested styles
      const nestedNames = extractAnimationNamesFromStyles(value as Styles);
      for (const name of nestedNames) {
        names.add(name);
      }
    }
  }

  return names;
}

// ============================================================================
// Name Replacement
// ============================================================================

/**
 * Replace animation names in CSS declarations with injected names.
 * Optimized to avoid regex creation - uses simple string replacement.
 *
 * @param declarations CSS declarations string
 * @param nameMap Map from original name to injected name (only contains names that differ)
 * @returns Updated declarations string
 */
export function replaceAnimationNames(
  declarations: string,
  nameMap: Map<string, string>,
): string {
  // Fast path: no animation properties
  if (!declarations.includes('animation')) return declarations;

  // Parse and replace
  const parts = declarations.split(';');
  let modified = false;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) continue;

    const prop = part.slice(0, colonIdx).trim().toLowerCase();

    if (prop === 'animation' || prop === 'animation-name') {
      const prefix = part.slice(0, colonIdx + 1);
      let value = part.slice(colonIdx + 1);

      // Replace each animation name using simple word replacement
      for (const [original, injected] of nameMap) {
        // Simple word boundary replacement without regex
        const newValue = replaceWord(value, original, injected);
        if (newValue !== value) {
          value = newValue;
          modified = true;
        }
      }

      parts[i] = prefix + value;
    }
  }

  return modified ? parts.join(';') : declarations;
}

/**
 * Replace a word in a string (word boundary aware, no regex).
 */
function replaceWord(str: string, word: string, replacement: string): string {
  let result = str;
  let idx = 0;

  while ((idx = result.indexOf(word, idx)) !== -1) {
    // Check word boundaries
    const before = idx === 0 ? ' ' : result[idx - 1];
    const after =
      idx + word.length >= result.length ? ' ' : result[idx + word.length];

    const isWordBoundaryBefore = !/[a-zA-Z0-9_-]/.test(before);
    const isWordBoundaryAfter = !/[a-zA-Z0-9_-]/.test(after);

    if (isWordBoundaryBefore && isWordBoundaryAfter) {
      result =
        result.slice(0, idx) + replacement + result.slice(idx + word.length);
      idx += replacement.length;
    } else {
      idx += word.length;
    }
  }

  return result;
}

// ============================================================================
// Filter Functions
// ============================================================================

/**
 * Filter keyframes to only those that are actually used.
 * Returns null if no keyframes are used (fast path).
 */
export function filterUsedKeyframes(
  keyframes: Record<string, KeyframesSteps> | null,
  usedNames: Set<string>,
): Record<string, KeyframesSteps> | null {
  if (!keyframes || usedNames.size === 0) return null;

  const used: Record<string, KeyframesSteps> = {};
  let hasAny = false;

  for (const name of usedNames) {
    if (keyframes[name]) {
      used[name] = keyframes[name];
      hasAny = true;
    }
  }

  return hasAny ? used : null;
}
