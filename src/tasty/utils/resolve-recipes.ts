/**
 * Recipe resolution utility.
 *
 * Resolves `recipe` style properties by looking up predefined recipe styles
 * from global configuration and merging them with the component's own styles.
 *
 * Resolution order per level (top-level and each sub-element independently):
 * base_recipe_1 base_recipe_2 → component styles → post_recipe_1 post_recipe_2
 *
 * The `|` separator splits base recipes (before component styles)
 * from post recipes (after component styles). All merges use mergeStyles
 * semantics: primitives and state maps with '' key fully replace;
 * state maps without '' key extend the existing value.
 *
 * Returns the same object reference if no recipes are present (zero overhead).
 */

import { getGlobalRecipes } from '../config';
import { isSelector } from '../pipeline';
import { RecipeStyles, Styles } from '../styles/types';

import { isDevEnv } from './is-dev-env';
import { mergeStyles } from './merge-styles';

const devMode = isDevEnv();

interface ParsedRecipeGroups {
  base: string[] | null;
  post: string[] | null;
}

/**
 * Parse a recipe string into base and post recipe name groups.
 *
 * Syntax: `'base1 base2 | post1 post2'`
 * - Names are space-separated within each group
 * - `|` separates base (before component) from post (after component) groups
 * - `|` is optional; if absent, all names are base
 *
 * Returns `{ base: null, post: null }` if the string is empty or invalid.
 */
function parseRecipeNames(value: unknown): ParsedRecipeGroups {
  const empty: ParsedRecipeGroups = { base: null, post: null };

  if (typeof value !== 'string') return empty;
  const trimmed = value.trim();
  if (trimmed === '') return empty;

  const pipeIndex = trimmed.indexOf('|');

  if (pipeIndex === -1) {
    const names = splitNames(trimmed);
    return { base: names, post: null };
  }

  const basePart = trimmed.slice(0, pipeIndex);
  const postPart = trimmed.slice(pipeIndex + 1);

  return {
    base: splitNames(basePart),
    post: splitNames(postPart),
  };
}

function splitNames(s: string): string[] | null {
  const names = s.split(/\s+/).filter(Boolean);
  return names.length > 0 ? names : null;
}

/**
 * Collect merged styles for a list of recipe names.
 * Each recipe is flat-spread on top of the previous.
 */
function collectRecipeStyles(
  names: string[],
  recipes: Record<string, RecipeStyles>,
): Record<string, unknown> {
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

  return merged;
}

/**
 * Resolve recipe references in a flat styles object (no sub-elements).
 * Returns null if no `recipe` key is present.
 *
 * Resolution: base recipes → component styles → post recipes (all via mergeStyles)
 */
function resolveRecipesForLevel(
  styles: Record<string, unknown>,
  recipes: Record<string, RecipeStyles>,
): Record<string, unknown> | null {
  if (!('recipe' in styles)) return null;

  const { base, post } = parseRecipeNames(styles.recipe);

  // Separate selector keys (sub-elements) from flat style properties.
  // mergeStyles handles selectors with its own semantics (e.g. false = delete),
  // but at this level we only want recipe merging on flat properties.
  const { recipe: _recipe, ...allRest } = styles;
  const flatStyles: Record<string, unknown> = {};
  const selectorStyles: Record<string, unknown> = {};

  for (const key of Object.keys(allRest)) {
    if (isSelector(key)) {
      selectorStyles[key] = allRest[key];
    } else {
      flatStyles[key] = allRest[key];
    }
  }

  if (!base && !post) {
    return allRest;
  }

  // 1. Merge base recipes, then component styles on top (via mergeStyles)
  let result: Record<string, unknown>;

  if (base) {
    const baseStyles = collectRecipeStyles(base, recipes);
    result = mergeStyles(baseStyles as Styles, flatStyles as Styles) as Record<
      string,
      unknown
    >;
  } else {
    result = { ...flatStyles };
  }

  // 2. Apply post recipes via mergeStyles (state map extend semantics)
  if (post) {
    const postStyles = collectRecipeStyles(post, recipes);
    result = mergeStyles(result as Styles, postStyles as Styles) as Record<
      string,
      unknown
    >;
  }

  // Re-attach selector keys unchanged
  for (const key of Object.keys(selectorStyles)) {
    result[key] = selectorStyles[key];
  }

  return result;
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
    // Keep reference; a shallow copy is deferred until a sub-element actually changes
    result = styles as Record<string, unknown>;
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
