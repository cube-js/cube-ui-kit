/**
 * Recipe resolution utility.
 *
 * Resolves `recipe` style properties by looking up predefined recipe styles
 * from global configuration and merging them with the component's own styles.
 *
 * Resolution order per level (top-level and each sub-element independently):
 * recipe_1 → recipe_2 → ... → component styles (without recipe key)
 *
 * Returns the same object reference if no recipes are present (zero overhead).
 */

import { getGlobalRecipes } from '../config';
import { isSelector } from '../pipeline';
import { Styles, StylesWithoutSelectors } from '../styles/types';

import { isDevEnv } from './is-dev-env';

const devMode = isDevEnv();

/**
 * Parse a recipe string into an array of trimmed recipe names.
 * Returns null if the string is empty or only whitespace.
 */
function parseRecipeNames(value: unknown): string[] | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;

  const names = trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return names.length > 0 ? names : null;
}

/**
 * Resolve recipe references in a flat styles object (no sub-elements).
 * Returns the original object if no `recipe` key is present.
 */
function resolveRecipesForLevel(
  styles: Record<string, unknown>,
  recipes: Record<string, StylesWithoutSelectors>,
): Record<string, unknown> | null {
  if (!('recipe' in styles)) return null;

  const names = parseRecipeNames(styles.recipe);

  // Remove recipe key from the rest of styles
  const { recipe: _recipe, ...restStyles } = styles;

  if (!names) {
    // recipe: '' or invalid value -- just remove the recipe key
    return restStyles;
  }

  // Merge recipes in order, then component styles on top
  let merged: Record<string, unknown> = {};

  for (const name of names) {
    const recipeStyles = recipes[name];

    if (!recipeStyles) {
      if (devMode) {
        console.warn(
          `[Tasty] Recipe "${name}" not found. ` +
            `Make sure it is defined in configure({ recipes: { ... } }).`,
        );
      }
      continue;
    }

    merged = { ...merged, ...(recipeStyles as Record<string, unknown>) };
  }

  // Component styles override recipe values
  return { ...merged, ...restStyles };
}

/**
 * Resolve all `recipe` style properties in a styles object.
 *
 * Handles both top-level and sub-element recipe references.
 * Returns the same object reference if no recipes are present anywhere
 * (zero overhead for the common case).
 *
 * @param styles - The styles object potentially containing `recipe` keys
 * @returns Resolved styles with recipe values merged in, or the original object if unchanged
 */
export function resolveRecipes(styles: Styles): Styles {
  const recipes = getGlobalRecipes();

  // Fast path: no recipes configured globally
  if (!recipes) return styles;

  let changed = false;
  let result: Record<string, unknown> = {};

  // Resolve top-level recipe
  const topResolved = resolveRecipesForLevel(
    styles as Record<string, unknown>,
    recipes,
  );

  if (topResolved) {
    changed = true;
    result = topResolved;
  } else {
    // Copy reference for potential sub-element changes
    result = { ...(styles as Record<string, unknown>) };
  }

  // Resolve sub-element recipes
  const keys = Object.keys(result);

  for (const key of keys) {
    if (!isSelector(key)) continue;

    const subStyles = result[key];

    if (
      !subStyles ||
      typeof subStyles !== 'object' ||
      Array.isArray(subStyles)
    ) {
      continue;
    }

    const subRecord = subStyles as Record<string, unknown>;

    if (!('recipe' in subRecord)) continue;

    const subResolved = resolveRecipesForLevel(subRecord, recipes);

    if (subResolved) {
      if (!changed) {
        // First change in sub-elements -- need to shallow-copy the top level
        changed = true;
        result = { ...(styles as Record<string, unknown>) };
      }
      result[key] = subResolved;
    }
  }

  return changed ? (result as Styles) : styles;
}
