import { isSelector } from '../pipeline';
import { Styles, StylesWithoutSelectors } from '../styles/types';

import { isDevEnv } from './is-dev-env';

import type { StyleValueStateMap } from './styles';

const devMode = isDevEnv();

const EXTEND_KEY = '@extend';
const INHERIT_VALUE = '@inherit';

/**
 * Check if a value is a state map (object, not array).
 */
function isStateMap(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Strip `@inherit` values from a state map that was used without `@extend: true`.
 * Returns a new object if any values were stripped, otherwise the original.
 */
function stripInheritValues(
  map: Record<string, unknown>,
): Record<string, unknown> {
  let hasInherit = false;
  for (const key of Object.keys(map)) {
    if (map[key] === INHERIT_VALUE) {
      hasInherit = true;
      break;
    }
  }
  if (!hasInherit) return map;

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(map)) {
    if (map[key] !== INHERIT_VALUE) {
      result[key] = map[key];
    }
  }
  return result;
}

/**
 * Check if a value is a state map object with `@extend: true`.
 */
function isExtendMap(
  value: unknown,
): value is StyleValueStateMap & { '@extend': true } {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (value as any)[EXTEND_KEY] === true
  );
}

/**
 * Resolve a state map with `@extend: true` against a parent value.
 *
 * - Shared keys: parent's position, child's value (override in place)
 * - Parent-only keys: kept in original position and value
 * - Child-only keys: appended at end (highest CSS priority)
 * - `@inherit` value: reposition parent's value to this position in child order
 * - `null` value: remove this state from the result
 */
function resolveExtendMap(
  parentValue: unknown,
  childMap: Record<string, unknown>,
): Record<string, unknown> {
  const { [EXTEND_KEY]: _, ...childEntries } = childMap;

  // Normalize parent to state map
  let parentMap: Record<string, unknown>;
  if (
    typeof parentValue === 'object' &&
    parentValue !== null &&
    !Array.isArray(parentValue)
  ) {
    parentMap = parentValue as Record<string, unknown>;
  } else if (parentValue != null && parentValue !== false) {
    parentMap = { '': parentValue };
  } else {
    // No parent to extend from — strip nulls and @inherit, return child entries
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(childEntries)) {
      const val = childEntries[key];
      if (val === null || val === INHERIT_VALUE) continue;
      result[key] = val;
    }
    return result;
  }

  // Classify child entries
  const inheritKeys = new Set<string>();
  const removeKeys = new Set<string>();
  const overrideKeys = new Map<string, unknown>();

  for (const key of Object.keys(childEntries)) {
    const val = childEntries[key];
    if (val === INHERIT_VALUE) {
      if (key in parentMap) {
        inheritKeys.add(key);
      } else if (devMode) {
        console.warn(
          `[Tasty] @inherit used for state '${key}' that does not exist in the parent style map. Entry skipped.`,
        );
      }
    } else if (val === null) {
      removeKeys.add(key);
    } else if (key in parentMap) {
      overrideKeys.set(key, val);
    }
  }

  // Build result:
  // 1. Parent entries in order (skip removed, skip repositioned, apply overrides)
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(parentMap)) {
    if (removeKeys.has(key)) continue;
    if (inheritKeys.has(key)) continue;
    if (overrideKeys.has(key)) {
      result[key] = overrideKeys.get(key);
    } else {
      result[key] = parentMap[key];
    }
  }

  // 2. Append new + repositioned entries in child declaration order
  for (const key of Object.keys(childEntries)) {
    if (inheritKeys.has(key)) {
      result[key] = parentMap[key];
    } else if (
      !removeKeys.has(key) &&
      !overrideKeys.has(key) &&
      childEntries[key] !== INHERIT_VALUE
    ) {
      result[key] = childEntries[key];
    }
  }

  return result;
}

/**
 * Merge sub-element properties with @extend / null / undefined support.
 */
function mergeSubElementStyles(
  parentSub: StylesWithoutSelectors | undefined,
  childSub: StylesWithoutSelectors,
): StylesWithoutSelectors {
  const parent = parentSub as Record<string, unknown> | undefined;
  const child = childSub as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...parent, ...child };

  for (const key of Object.keys(child)) {
    const val = child[key];

    if (val === undefined) {
      if (parent && key in parent) {
        merged[key] = parent[key];
      }
    } else if (val === null) {
      delete merged[key];
    } else if (isExtendMap(val)) {
      merged[key] = resolveExtendMap(
        parent ? parent[key] : undefined,
        val as Record<string, unknown>,
      );
    } else if (isStateMap(val)) {
      merged[key] = stripInheritValues(val as Record<string, unknown>);
    }
  }

  return merged as StylesWithoutSelectors;
}

export function mergeStyles(...objects: (Styles | undefined | null)[]): Styles {
  let styles: Styles = objects[0] ? { ...objects[0] } : {};
  let pos = 1;

  while (pos in objects) {
    const selectorKeys = Object.keys(styles).filter(
      (key) => isSelector(key) && styles[key],
    );
    const newStyles = objects[pos];

    if (newStyles) {
      const resultStyles = { ...styles, ...newStyles };

      // Collect all selector keys from both parent and child
      const newSelectorKeys = Object.keys(newStyles).filter(isSelector);
      const allSelectorKeys = new Set([...selectorKeys, ...newSelectorKeys]);

      for (const key of allSelectorKeys) {
        const newValue = newStyles?.[key];

        if (newValue === false || newValue === null) {
          delete resultStyles[key];
        } else if (newValue === undefined) {
          // Not provided — keep parent's value
          resultStyles[key] = styles[key];
        } else if (newValue) {
          resultStyles[key] = mergeSubElementStyles(
            styles[key] as StylesWithoutSelectors,
            newValue as StylesWithoutSelectors,
          );
        }
      }

      // Handle non-selector properties: @extend, null, undefined
      for (const key of Object.keys(newStyles)) {
        if (isSelector(key)) continue;

        const newValue = newStyles[key];

        if (newValue === undefined) {
          // Not provided — keep parent's value
          if (key in styles) {
            resultStyles[key] = styles[key];
          } else {
            delete resultStyles[key];
          }
        } else if (newValue === null) {
          // Intentional unset — remove property, recipe fills in
          delete resultStyles[key];
        } else if (isExtendMap(newValue)) {
          (resultStyles as Record<string, unknown>)[key] = resolveExtendMap(
            styles[key],
            newValue as Record<string, unknown>,
          );
        } else if (isStateMap(newValue)) {
          (resultStyles as Record<string, unknown>)[key] = stripInheritValues(
            newValue as Record<string, unknown>,
          );
        }
      }

      styles = resultStyles;
    }

    pos++;
  }

  return styles;
}
