import { isSelector } from '../pipeline';
import { Styles, StylesWithoutSelectors } from '../styles/types';

import { isDevEnv } from './is-dev-env';

const devMode = isDevEnv();

const INHERIT_VALUE = '@inherit';

/**
 * Check if a value is a state map (object, not array).
 */
function isStateMap(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Normalize a parent value to a state map.
 * - Already a state map → return as-is
 * - Non-null, non-false primitive → wrap as `{ '': value }`
 * - null / undefined / false → return null (no parent to merge with)
 */
function normalizeToStateMap(value: unknown): Record<string, unknown> | null {
  if (isStateMap(value)) return value as Record<string, unknown>;
  if (value != null && value !== false) return { '': value };
  return null;
}

/**
 * Resolve a child state map against a parent value.
 *
 * Mode is determined by whether the child contains a `''` (default) key:
 * - No `''` → extend mode: parent entries preserved, child adds/overrides/repositions
 * - Has `''` → replace mode: child defines everything, `@inherit` cherry-picks from parent
 *
 * In both modes:
 * - `@inherit` value → resolve from parent state map
 * - `null` value → remove this state from the result
 */
function resolveStateMap(
  parentValue: unknown,
  childMap: Record<string, unknown>,
): Record<string, unknown> {
  const isExtend = !('' in childMap);
  const parentMap = normalizeToStateMap(parentValue);

  if (!parentMap) {
    // No parent to merge with — strip nulls and @inherit, return child entries
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(childMap)) {
      const val = childMap[key];
      if (val === null || val === INHERIT_VALUE) continue;
      result[key] = val;
    }
    return result;
  }

  if (isExtend) {
    return resolveExtendMode(parentMap, childMap);
  }

  return resolveReplaceMode(parentMap, childMap);
}

/**
 * Extend mode: parent entries are preserved, child entries add/override/reposition.
 */
function resolveExtendMode(
  parentMap: Record<string, unknown>,
  childMap: Record<string, unknown>,
): Record<string, unknown> {
  const inheritKeys = new Set<string>();
  const removeKeys = new Set<string>();
  const overrideKeys = new Map<string, unknown>();

  for (const key of Object.keys(childMap)) {
    const val = childMap[key];
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
  for (const key of Object.keys(childMap)) {
    if (inheritKeys.has(key)) {
      result[key] = parentMap[key];
    } else if (
      !removeKeys.has(key) &&
      !overrideKeys.has(key) &&
      childMap[key] !== INHERIT_VALUE
    ) {
      result[key] = childMap[key];
    }
  }

  return result;
}

/**
 * Replace mode: child entries define the result, `@inherit` pulls from parent.
 */
function resolveReplaceMode(
  parentMap: Record<string, unknown>,
  childMap: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(childMap)) {
    const val = childMap[key];
    if (val === INHERIT_VALUE) {
      if (key in parentMap) {
        result[key] = parentMap[key];
      } else if (devMode) {
        console.warn(
          `[Tasty] @inherit used for state '${key}' that does not exist in the parent style map. Entry skipped.`,
        );
      }
    } else if (val !== null) {
      result[key] = val;
    }
  }

  return result;
}

/**
 * Merge sub-element properties with state map / null / undefined support.
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
    } else if (isStateMap(val)) {
      merged[key] = resolveStateMap(
        parent ? parent[key] : undefined,
        val as Record<string, unknown>,
      );
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
          resultStyles[key] = styles[key];
        } else if (newValue) {
          resultStyles[key] = mergeSubElementStyles(
            styles[key] as StylesWithoutSelectors,
            newValue as StylesWithoutSelectors,
          );
        }
      }

      // Handle non-selector properties: state maps, null, undefined
      for (const key of Object.keys(newStyles)) {
        if (isSelector(key)) continue;

        const newValue = newStyles[key];

        if (newValue === undefined) {
          if (key in styles) {
            resultStyles[key] = styles[key];
          } else {
            delete resultStyles[key];
          }
        } else if (newValue === null) {
          delete resultStyles[key];
        } else if (isStateMap(newValue)) {
          (resultStyles as Record<string, unknown>)[key] = resolveStateMap(
            styles[key],
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
