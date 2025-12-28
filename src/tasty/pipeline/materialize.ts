/**
 * CSS Materialization
 *
 * Converts condition trees into CSS selectors and at-rules.
 * This is the final stage that produces actual CSS output.
 */

import { Lru } from '../parser/lru';

import {
  ConditionNode,
  ContainerCondition,
  MediaCondition,
  ModifierCondition,
  OwnCondition,
  PseudoCondition,
  RootCondition,
  StartingCondition,
  StateCondition,
} from './conditions';

// ============================================================================
// Types
// ============================================================================

/**
 * A single selector variant (one term in a DNF expression)
 */
export interface SelectorVariant {
  /** Attribute/pseudo selectors to add to element selector (e.g., '[data-hovered]', ':not([data-disabled])') */
  modifierSelectors: string[];

  /** Selector suffixes for @own states (applied to sub-element) */
  ownSelectors: string[];

  /** Media at-rules (e.g., '@media (width < 768px)') */
  mediaRules: string[];

  /** Container at-rules (e.g., '@container layout (width < 600px)') */
  containerRules: string[];

  /** Root state prefix (e.g., ':root[data-theme="dark"]') */
  rootPrefix?: string;

  /** Whether to wrap in @starting-style */
  startingStyle: boolean;
}

/**
 * CSS output components extracted from a condition
 * Supports multiple variants for OR conditions (DNF form)
 */
export interface CSSComponents {
  /** Selector variants - OR means multiple variants, AND means single variant with combined selectors */
  variants: SelectorVariant[];

  /** Whether condition is impossible (should skip) */
  isImpossible: boolean;
}

/**
 * Final CSS rule output
 */
export interface CSSRule {
  /** Single selector or array of selector fragments (for OR conditions) */
  selector: string | string[];
  declarations: string;
  atRules?: string[];
  rootPrefix?: string;
}

// ============================================================================
// Caching
// ============================================================================

const conditionCache = new Lru<string, CSSComponents>(3000);

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Convert a condition tree to CSS components
 */
export function conditionToCSS(node: ConditionNode): CSSComponents {
  // Check cache
  const key = getConditionKey(node);
  const cached = conditionCache.get(key);
  if (cached) {
    return cached;
  }

  const result = conditionToCSSInner(node);

  // Cache result
  conditionCache.set(key, result);

  return result;
}

/**
 * Clear the condition cache (for testing)
 */
export function clearConditionCache(): void {
  conditionCache.clear();
}

// ============================================================================
// Inner Implementation
// ============================================================================

/**
 * Create an empty selector variant
 */
function emptyVariant(): SelectorVariant {
  return {
    modifierSelectors: [],
    ownSelectors: [],
    mediaRules: [],
    containerRules: [],
    startingStyle: false,
  };
}

function conditionToCSSInner(node: ConditionNode): CSSComponents {
  // Base case: TRUE condition - single empty variant (matches everything)
  if (node.kind === 'true') {
    return {
      variants: [emptyVariant()],
      isImpossible: false,
    };
  }

  // Base case: FALSE condition - no variants (matches nothing)
  if (node.kind === 'false') {
    return {
      variants: [],
      isImpossible: true,
    };
  }

  // State condition
  if (node.kind === 'state') {
    return stateToCSS(node);
  }

  // Compound condition
  if (node.kind === 'compound') {
    if (node.operator === 'AND') {
      return andToCSS(node.children);
    } else {
      return orToCSS(node.children);
    }
  }

  // Fallback - single empty variant
  return {
    variants: [emptyVariant()],
    isImpossible: false,
  };
}

/**
 * Convert a state condition to CSS
 */
function stateToCSS(state: StateCondition): CSSComponents {
  switch (state.type) {
    case 'media': {
      // Media rules can return multiple variants for negated ranges (OR branches)
      const mediaResults = mediaToCSS(state);
      const variants = mediaResults.map((mediaRule) => {
        const v = emptyVariant();
        v.mediaRules.push(mediaRule);
        return v;
      });
      return { variants, isImpossible: false };
    }

    default: {
      const variant: SelectorVariant = emptyVariant();

      switch (state.type) {
        case 'modifier':
          variant.modifierSelectors.push(modifierToCSS(state));
          break;

        case 'pseudo':
          variant.modifierSelectors.push(pseudoToCSS(state));
          break;

        case 'container':
          variant.containerRules.push(containerToCSS(state));
          break;

        case 'root':
          variant.rootPrefix = rootToCSS(state);
          break;

        case 'own':
          variant.ownSelectors.push(...ownToCSS(state));
          break;

        case 'starting':
          variant.startingStyle = !state.negated;
          break;
      }

      return {
        variants: [variant],
        isImpossible: false,
      };
    }
  }
}

/**
 * Convert modifier condition to CSS selector
 */
function modifierToCSS(state: ModifierCondition): string {
  let selector: string;

  if (state.value !== undefined) {
    // Value attribute: [data-attr="value"]
    const op = state.operator || '=';
    selector = `[${state.attribute}${op}"${state.value}"]`;
  } else {
    // Boolean attribute: [data-attr]
    selector = `[${state.attribute}]`;
  }

  if (state.negated) {
    return `:not(${selector})`;
  }
  return selector;
}

/**
 * Convert pseudo condition to CSS selector
 */
function pseudoToCSS(state: PseudoCondition): string {
  if (state.negated) {
    // Wrap in :not() if not already
    if (state.pseudo.startsWith(':not(')) {
      // Double negation - remove :not()
      return state.pseudo.slice(5, -1);
    }
    return `:not(${state.pseudo})`;
  }
  return state.pseudo;
}

/**
 * Convert media condition to CSS at-rule(s)
 * Returns an array because negated ranges produce OR branches (two separate rules)
 */
function mediaToCSS(state: MediaCondition): string[] {
  if (state.subtype === 'type') {
    // @media:print → @media print (or @media not print)
    const mediaType = state.mediaType || 'all';
    if (state.negated) {
      return [`@media not ${mediaType}`];
    }
    return [`@media ${mediaType}`];
  } else if (state.subtype === 'feature') {
    // @media(prefers-contrast: high) → @media (prefers-contrast: high)
    let condition: string;
    if (state.featureValue) {
      condition = `(${state.feature}: ${state.featureValue})`;
    } else {
      condition = `(${state.feature})`;
    }
    // "not (condition)" is valid for feature queries like prefers-color-scheme
    if (state.negated) {
      return [`@media not ${condition}`];
    }
    return [`@media ${condition}`];
  } else {
    // Dimension query - negation is handled by inverting the condition
    // because "not (width < x)" doesn't work reliably in browsers
    const conditions = dimensionToMediaCondition(
      state.dimension || 'width',
      state.lowerBound,
      state.upperBound,
      state.negated,
    );
    // dimensionToMediaCondition returns array for negated ranges (OR branches)
    return conditions.map((c) => `@media ${c}`);
  }
}

/**
 * Convert container condition to CSS at-rule
 * Container queries support "not (condition)" syntax, so we can use it directly
 */
function containerToCSS(state: ContainerCondition): string {
  const name = state.containerName ? `${state.containerName} ` : '';
  let condition: string;

  if (state.subtype === 'style') {
    // Style query: @container style(--prop: value)
    if (state.propertyValue) {
      condition = `style(--${state.property}: ${state.propertyValue})`;
    } else {
      condition = `style(--${state.property})`;
    }
  } else {
    // Dimension query - container queries support "not (condition)"
    condition = dimensionToContainerCondition(
      state.dimension || 'width',
      state.lowerBound,
      state.upperBound,
    );
  }

  if (state.negated) {
    return `@container ${name}not ${condition}`;
  }
  return `@container ${name}${condition}`;
}

/**
 * Convert dimension bounds to container query condition (single string)
 * Container queries support "not (condition)", so no need to invert manually
 */
function dimensionToContainerCondition(
  dimension: string,
  lowerBound?: { value: string; inclusive: boolean },
  upperBound?: { value: string; inclusive: boolean },
): string {
  if (lowerBound && upperBound) {
    const lowerOp = lowerBound.inclusive ? '<=' : '<';
    const upperOp = upperBound.inclusive ? '<=' : '<';
    return `(${lowerBound.value} ${lowerOp} ${dimension} ${upperOp} ${upperBound.value})`;
  } else if (upperBound) {
    const op = upperBound.inclusive ? '<=' : '<';
    return `(${dimension} ${op} ${upperBound.value})`;
  } else if (lowerBound) {
    const op = lowerBound.inclusive ? '>=' : '>';
    return `(${dimension} ${op} ${lowerBound.value})`;
  }
  return '(width)'; // Fallback
}
/**
 * Convert dimension bounds to media condition(s)
 * Returns an array because negated ranges produce OR branches (two separate conditions)
 */
function dimensionToMediaCondition(
  dimension: string,
  lowerBound?: { value: string; inclusive: boolean },
  upperBound?: { value: string; inclusive: boolean },
  negated?: boolean,
): string[] {
  if (negated) {
    // Invert the condition manually since "not (width < x)" doesn't work in browsers
    // Single bounds: flip the operator → returns single condition
    // Range: NOT (a <= x < b) = (x < a) OR (x >= b) → returns two conditions (OR branches)

    if (lowerBound && upperBound) {
      // Range query: (lower <= dim < upper) negated is (dim < lower) OR (dim >= upper)
      // Return two separate conditions - these become separate variants
      const lowerOp = lowerBound.inclusive ? '<' : '<=';
      const upperOp = upperBound.inclusive ? '>' : '>=';
      return [
        `(${dimension} ${lowerOp} ${lowerBound.value})`,
        `(${dimension} ${upperOp} ${upperBound.value})`,
      ];
    } else if (upperBound) {
      // (dim < upper) negated is (dim >= upper)
      // (dim <= upper) negated is (dim > upper)
      const op = upperBound.inclusive ? '>' : '>=';
      return [`(${dimension} ${op} ${upperBound.value})`];
    } else if (lowerBound) {
      // (dim >= lower) negated is (dim < lower)
      // (dim > lower) negated is (dim <= lower)
      const op = lowerBound.inclusive ? '<' : '<=';
      return [`(${dimension} ${op} ${lowerBound.value})`];
    }
    // Fallback - should not happen
    return ['(width < 0px)'];
  }

  // Positive condition - always returns single condition
  if (lowerBound && upperBound) {
    const lowerOp = lowerBound.inclusive ? '<=' : '<';
    const upperOp = upperBound.inclusive ? '<=' : '<';
    return [
      `(${lowerBound.value} ${lowerOp} ${dimension} ${upperOp} ${upperBound.value})`,
    ];
  } else if (upperBound) {
    const op = upperBound.inclusive ? '<=' : '<';
    return [`(${dimension} ${op} ${upperBound.value})`];
  } else if (lowerBound) {
    const op = lowerBound.inclusive ? '>=' : '>';
    return [`(${dimension} ${op} ${lowerBound.value})`];
  }
  return ['(width)']; // Fallback
}

/**
 * Convert root condition to CSS selector prefix
 */
function rootToCSS(state: RootCondition): string {
  if (state.negated) {
    return `:root:not(${state.selector})`;
  }
  return `:root${state.selector}`;
}

/**
 * Convert own condition to CSS selectors for sub-element
 */
function ownToCSS(state: OwnCondition): string[] {
  const innerCSS = conditionToCSS(state.innerCondition);

  if (innerCSS.isImpossible || innerCSS.variants.length === 0) {
    return [];
  }

  // Collect all modifier selectors from all variants
  // (For @own, we typically expect simple conditions, so usually just one variant)
  const allSelectors: string[] = [];
  for (const variant of innerCSS.variants) {
    allSelectors.push(...variant.modifierSelectors);
  }

  if (state.negated) {
    // Negate all selectors
    return allSelectors.map((s) => {
      if (s.startsWith(':not(')) {
        // Double negation - remove :not()
        return s.slice(5, -1);
      }
      return `:not(${s})`;
    });
  }

  return allSelectors;
}

/**
 * Deduplicate an array while preserving order
 */
function dedupeArray(arr: string[]): string[] {
  return [...new Set(arr)];
}

/**
 * Merge two selector variants (AND operation)
 * Deduplicates selectors to avoid `.foo:not([x]):not([x])` repetition
 */
function mergeVariants(
  a: SelectorVariant,
  b: SelectorVariant,
): SelectorVariant | null {
  const mergedMedia = dedupeArray([...a.mediaRules, ...b.mediaRules]);

  // Check for contradictory media rules
  if (hasMediaContradiction(mergedMedia)) {
    return null; // Impossible variant
  }

  // Combine root prefixes and check for contradictions
  const combinedRoot = combineRootPrefixes(a.rootPrefix, b.rootPrefix);
  if (combinedRoot && hasRootPrefixContradiction(combinedRoot)) {
    return null; // Impossible variant
  }

  // Merge modifier selectors and check for contradictions
  const mergedModifiers = dedupeArray([
    ...a.modifierSelectors,
    ...b.modifierSelectors,
  ]);
  if (hasModifierContradiction(mergedModifiers)) {
    return null; // Impossible variant
  }

  // Merge container rules and check for contradictions
  const mergedContainers = dedupeArray([
    ...a.containerRules,
    ...b.containerRules,
  ]);
  if (hasContainerStyleContradiction(mergedContainers)) {
    return null; // Impossible variant
  }

  return {
    modifierSelectors: mergedModifiers,
    ownSelectors: dedupeArray([...a.ownSelectors, ...b.ownSelectors]),
    mediaRules: mergedMedia,
    containerRules: mergedContainers,
    rootPrefix: combinedRoot,
    startingStyle: a.startingStyle || b.startingStyle,
  };
}

/**
 * Parsed dimension condition - can be single-bound or range
 */
interface ParsedDimension {
  dimension: string;
  lowerBound?: { value: number; unit: string; inclusive: boolean };
  upperBound?: { value: number; unit: string; inclusive: boolean };
}

function parseValue(str: string): { value: number; unit: string } | null {
  const match = str.match(/^(\d+(?:\.\d+)?)(px|em|rem|vh|vw|%)$/i);
  if (match) {
    return { value: parseFloat(match[1]), unit: match[2].toLowerCase() };
  }
  return null;
}

function parseDimensionCondition(condition: string): ParsedDimension | null {
  // Try range syntax first: (600px <= width < 900px)
  const rangeMatch = condition.match(
    /\(\s*(\d+(?:\.\d+)?(?:px|em|rem|vh|vw|%))\s*(<=?)\s*(width|height)\s*(<=?)\s*(\d+(?:\.\d+)?(?:px|em|rem|vh|vw|%))\s*\)/i,
  );
  if (rangeMatch) {
    const lowerVal = parseValue(rangeMatch[1]);
    const upperVal = parseValue(rangeMatch[5]);
    if (lowerVal && upperVal && lowerVal.unit === upperVal.unit) {
      return {
        dimension: rangeMatch[3].toLowerCase(),
        lowerBound: {
          value: lowerVal.value,
          unit: lowerVal.unit,
          inclusive: rangeMatch[2] === '<=',
        },
        upperBound: {
          value: upperVal.value,
          unit: upperVal.unit,
          inclusive: rangeMatch[4] === '<=',
        },
      };
    }
  }

  // Try single bound: (width < 600px) or (width >= 900px)
  const singleMatch = condition.match(
    /\(\s*(width|height)\s*(<=?|>=?)\s*(\d+(?:\.\d+)?(?:px|em|rem|vh|vw|%))\s*\)/i,
  );
  if (singleMatch) {
    const val = parseValue(singleMatch[3]);
    if (val) {
      const op = singleMatch[2];
      if (op === '<' || op === '<=') {
        return {
          dimension: singleMatch[1].toLowerCase(),
          upperBound: {
            value: val.value,
            unit: val.unit,
            inclusive: op === '<=',
          },
        };
      } else {
        return {
          dimension: singleMatch[1].toLowerCase(),
          lowerBound: {
            value: val.value,
            unit: val.unit,
            inclusive: op === '>=',
          },
        };
      }
    }
  }

  return null;
}

/**
 * Check if two dimension conditions are contradictory
 * e.g., "width >= 900px" and "width < 900px" are contradictory
 * Also handles ranges: "(600px <= width < 900px)" and "(width < 600px)" are contradictory
 */
function areDimensionContradictions(
  a: ParsedDimension,
  b: ParsedDimension,
): boolean {
  if (a.dimension !== b.dimension) return false;

  // Get effective bounds - considering both single-bound and ranges
  const aLower = a.lowerBound;
  const aUpper = a.upperBound;
  const bLower = b.lowerBound;
  const bUpper = b.upperBound;

  // Check if units are compatible (only compare if same unit)
  const getUnit = (bound?: { unit: string }) => bound?.unit;
  const units = [aLower, aUpper, bLower, bUpper]
    .filter(Boolean)
    .map((b) => b!.unit);
  if (units.length > 0 && !units.every((u) => u === units[0])) {
    return false; // Different units, can't determine
  }

  // Two conditions contradict if their valid ranges don't overlap
  // A range is [aLowerVal, aUpperVal) or similar
  // Default: -Infinity to +Infinity
  const aLowerVal = aLower?.value ?? -Infinity;
  const aUpperVal = aUpper?.value ?? Infinity;
  const bLowerVal = bLower?.value ?? -Infinity;
  const bUpperVal = bUpper?.value ?? Infinity;

  // For non-inclusive bounds, adjust slightly for comparison
  // But for simplicity, we'll use strict non-overlap check
  // Two ranges [aL, aU) and [bL, bU) don't overlap if:
  // aU <= bL or bU <= aL (considering inclusivity)

  // Check if a's upper bound is at or below b's lower bound
  if (aUpper && bLower && aUpper.value === bLower.value) {
    // Same value - check inclusivity
    // If a.upper is exclusive (<) and b.lower is inclusive (>=), they don't overlap at this point
    // If a.upper is inclusive (<=) and b.lower is exclusive (>), they don't overlap
    if (!aUpper.inclusive && bLower.inclusive) {
      return true; // a < X and X <= b → no overlap at X
    }
    if (aUpper.inclusive && !bLower.inclusive) {
      return true; // a <= X and X > b → no overlap at X
    }
  }
  if (aUpperVal < bLowerVal) return true;

  // Check if b's upper bound is at or below a's lower bound
  if (bUpper && aLower && bUpper.value === aLower.value) {
    if (!bUpper.inclusive && aLower.inclusive) {
      return true;
    }
    if (bUpper.inclusive && !aLower.inclusive) {
      return true;
    }
  }
  if (bUpperVal < aLowerVal) return true;

  return false;
}

/**
 * Check if a set of media rules contains contradictions
 * e.g., "@media (prefers-color-scheme: light)" and "@media not (prefers-color-scheme: light)"
 * or "@media (width >= 900px)" and "@media (width < 900px)"
 */
function hasMediaContradiction(mediaRules: string[]): boolean {
  const conditions = new Map<string, { positive: boolean; rule: string }>();
  const dimensionConditions: ParsedDimension[] = [];

  for (const rule of mediaRules) {
    // Check for negated media rule: @media not (...)
    const notMatch = rule.match(/@media\s+not\s+(\([^)]+\))/i);
    // Check for positive media rule: @media (...)
    const posMatch = rule.match(/@media\s+(\([^)]+\))/i);

    if (notMatch) {
      // Normalize the condition (remove extra whitespace)
      const key = notMatch[1].replace(/\s+/g, ' ').trim();
      const existing = conditions.get(key);
      if (existing && existing.positive) {
        return true; // Found: (condition) AND not (condition)
      }
      conditions.set(key, { positive: false, rule });
    } else if (posMatch) {
      // Normalize the condition (remove extra whitespace)
      const key = posMatch[1].replace(/\s+/g, ' ').trim();
      const existing = conditions.get(key);
      if (existing && !existing.positive) {
        return true; // Found: not (condition) AND (condition)
      }
      conditions.set(key, { positive: true, rule });

      // Also check for dimension contradictions
      const dimCond = parseDimensionCondition(posMatch[1]);
      if (dimCond) {
        for (const existing of dimensionConditions) {
          if (areDimensionContradictions(dimCond, existing)) {
            return true;
          }
        }
        dimensionConditions.push(dimCond);
      }
    }
  }

  return false;
}

/**
 * Check if a root prefix contains contradictions
 * e.g., ":root:not([data-x="y"])[data-x="y"]" is a contradiction
 */
function hasRootPrefixContradiction(rootPrefix: string): boolean {
  return hasSelectorStringContradiction(rootPrefix);
}

/**
 * Check if modifier selectors contain contradictions
 * e.g., "[data-selected]" and ":not([data-selected])" together
 */
function hasModifierContradiction(modifiers: string[]): boolean {
  const combined = modifiers.join('');
  return hasSelectorStringContradiction(combined);
}

/**
 * Check if a selector string contains contradictions
 * e.g., "[data-x]:not([data-x])" or "[data-x="y"]:not([data-x="y"])"
 */
function hasSelectorStringContradiction(selector: string): boolean {
  const positiveAttrs: string[] = [];
  const negativeAttrs: string[] = [];

  // Match :not([attr]) or :not([attr="value"])
  const notPattern = /:not\(\[([^\]]+)\]\)/g;
  let match;
  while ((match = notPattern.exec(selector)) !== null) {
    negativeAttrs.push(match[1]);
  }

  // Match [attr] or [attr="value"] (not inside :not())
  // The lookbehind (?<!...) ensures we don't match attributes inside :not()
  const attrPattern = /(?<!:not\()\[([^\]]+)\]/g;
  while ((match = attrPattern.exec(selector)) !== null) {
    positiveAttrs.push(match[1]);
  }

  // Check for contradictions
  for (const neg of negativeAttrs) {
    if (positiveAttrs.includes(neg)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if container rules contain contradictions in style queries
 * e.g., "style(--variant: danger)" and "style(--variant: success)" together
 * Same property with different values = always false
 */
function hasContainerStyleContradiction(containerRules: string[]): boolean {
  // Track style queries by property name
  // key: property name, value: { hasExistence: boolean, values: Set<string> }
  const styleQueries = new Map<
    string,
    { hasExistence: boolean; values: Set<string>; hasNegatedExistence: boolean }
  >();

  for (const rule of containerRules) {
    // Match style queries: @container [name] style(--prop) or style(--prop: value)
    // Also handle negated: @container [name] not style(...)
    const isNegated = /not\s+style\(/i.test(rule);
    const styleMatch = rule.match(/style\(--([^:)\s]+)(?::\s*([^)]+))?\)/i);

    if (styleMatch) {
      const property = styleMatch[1];
      const value = styleMatch[2]?.trim();

      if (!styleQueries.has(property)) {
        styleQueries.set(property, {
          hasExistence: false,
          values: new Set(),
          hasNegatedExistence: false,
        });
      }

      const entry = styleQueries.get(property)!;

      if (isNegated) {
        if (value === undefined) {
          // not style(--prop) - negated existence check
          entry.hasNegatedExistence = true;
        }
        // Negated value checks don't contradict positive value checks directly
        // They just mean "not this value"
      } else {
        if (value === undefined) {
          // style(--prop) - existence check
          entry.hasExistence = true;
        } else {
          // style(--prop: value) - value check
          entry.values.add(value);
        }
      }
    }
  }

  // Check for contradictions
  for (const [, entry] of styleQueries) {
    // Contradiction: existence check + negated existence check
    if (entry.hasExistence && entry.hasNegatedExistence) {
      return true;
    }

    // Contradiction: multiple different values for same property
    // style(--variant: danger) AND style(--variant: success) is impossible
    if (entry.values.size > 1) {
      return true;
    }

    // Contradiction: negated existence + value check
    // not style(--variant) AND style(--variant: danger) is impossible
    if (entry.hasNegatedExistence && entry.values.size > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Combine two root prefixes
 */
function combineRootPrefixes(
  a: string | undefined,
  b: string | undefined,
): string | undefined {
  if (!a) return b;
  if (!b) return a;
  // Combine: :root[x] + :root[y] → :root[x][y]
  return `${a}${b.replace(':root', '')}`;
}

/**
 * Get a unique key for a variant (for deduplication)
 */
function getVariantKey(v: SelectorVariant): string {
  return [
    v.modifierSelectors.slice().sort().join('|'),
    v.ownSelectors.slice().sort().join('|'),
    v.mediaRules.slice().sort().join('|'),
    v.containerRules.slice().sort().join('|'),
    v.rootPrefix || '',
    v.startingStyle ? '1' : '0',
  ].join('###');
}

/**
 * Check if variant A is a superset of variant B (A is more restrictive)
 *
 * If A has all of B's conditions plus more, then A is redundant
 * because B already covers the same cases (and more).
 *
 * Example:
 *   A: :not([size=large]):not([size=medium]):not([size=small])
 *   B: :not([size=large])
 *   A is a superset of B, so A is redundant when B exists.
 */
function isVariantSuperset(a: SelectorVariant, b: SelectorVariant): boolean {
  // Must have same context (root prefix, at-rules, etc.)
  if (a.rootPrefix !== b.rootPrefix) return false;
  if (a.startingStyle !== b.startingStyle) return false;

  // Check if a.mediaRules is superset of b.mediaRules
  if (!isArraySuperset(a.mediaRules, b.mediaRules)) return false;

  // Check if a.containerRules is superset of b.containerRules
  if (!isArraySuperset(a.containerRules, b.containerRules)) return false;

  // Check if a.modifierSelectors is superset of b.modifierSelectors
  if (!isArraySuperset(a.modifierSelectors, b.modifierSelectors)) return false;

  // Check if a.ownSelectors is superset of b.ownSelectors
  if (!isArraySuperset(a.ownSelectors, b.ownSelectors)) return false;

  // A is a superset if it has all of B's items (possibly more)
  // and at least one category has strictly more items
  const aTotal =
    a.mediaRules.length +
    a.containerRules.length +
    a.modifierSelectors.length +
    a.ownSelectors.length;
  const bTotal =
    b.mediaRules.length +
    b.containerRules.length +
    b.modifierSelectors.length +
    b.ownSelectors.length;

  return aTotal > bTotal;
}

/**
 * Check if array A contains all elements of array B (superset)
 */
function isArraySuperset(a: string[], b: string[]): boolean {
  const setA = new Set(a);
  for (const item of b) {
    if (!setA.has(item)) return false;
  }
  return true;
}

/**
 * Deduplicate variants
 *
 * Removes:
 * 1. Exact duplicates (same key)
 * 2. Superset variants (more restrictive selectors that are redundant)
 */
function dedupeVariants(variants: SelectorVariant[]): SelectorVariant[] {
  // First pass: exact deduplication
  const seen = new Set<string>();
  let result: SelectorVariant[] = [];

  for (const v of variants) {
    const key = getVariantKey(v);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(v);
    }
  }

  // Second pass: remove supersets (more restrictive variants)
  // Sort by total selector count (fewer selectors = less restrictive = keep)
  result.sort((a, b) => {
    const aCount =
      a.modifierSelectors.length +
      a.ownSelectors.length +
      a.mediaRules.length +
      a.containerRules.length;
    const bCount =
      b.modifierSelectors.length +
      b.ownSelectors.length +
      b.mediaRules.length +
      b.containerRules.length;
    return aCount - bCount;
  });

  // Remove variants that are supersets of earlier (less restrictive) variants
  const filtered: SelectorVariant[] = [];
  for (const candidate of result) {
    let isRedundant = false;
    for (const kept of filtered) {
      if (isVariantSuperset(candidate, kept)) {
        isRedundant = true;
        break;
      }
    }
    if (!isRedundant) {
      filtered.push(candidate);
    }
  }

  return filtered;
}

/**
 * Combine AND conditions into CSS
 *
 * AND of conditions means cartesian product of variants:
 * (A1 | A2) & (B1 | B2) = A1&B1 | A1&B2 | A2&B1 | A2&B2
 *
 * Variants that result in contradictions (e.g., conflicting media rules)
 * are filtered out.
 */
function andToCSS(children: ConditionNode[]): CSSComponents {
  // Start with a single empty variant
  let currentVariants: SelectorVariant[] = [emptyVariant()];

  for (const child of children) {
    const childCSS = conditionToCSSInner(child);

    if (childCSS.isImpossible || childCSS.variants.length === 0) {
      return { variants: [], isImpossible: true };
    }

    // Cartesian product: each current variant × each child variant
    const newVariants: SelectorVariant[] = [];
    for (const current of currentVariants) {
      for (const childVariant of childCSS.variants) {
        const merged = mergeVariants(current, childVariant);
        // Skip impossible variants (contradictions detected during merge)
        if (merged !== null) {
          newVariants.push(merged);
        }
      }
    }

    if (newVariants.length === 0) {
      return { variants: [], isImpossible: true };
    }

    // Deduplicate after each step to prevent exponential blowup
    currentVariants = dedupeVariants(newVariants);
  }

  return {
    variants: currentVariants,
    isImpossible: false,
  };
}

/**
 * Combine OR conditions into CSS
 *
 * OR in CSS means multiple selector variants (DNF).
 * Each variant becomes a separate selector in the comma-separated list,
 * or multiple CSS rules if they have different at-rules.
 *
 * Note: OR exclusivity is handled at the pipeline level (expandOrConditions),
 * so here we just collect all variants. Any remaining ORs in the condition
 * tree (e.g., from De Morgan expansion) are handled as simple alternatives.
 */
function orToCSS(children: ConditionNode[]): CSSComponents {
  const allVariants: SelectorVariant[] = [];

  for (const child of children) {
    const childCSS = conditionToCSSInner(child);
    if (childCSS.isImpossible) continue;

    allVariants.push(...childCSS.variants);
  }

  if (allVariants.length === 0) {
    return { variants: [], isImpossible: true };
  }

  // Deduplicate variants
  return {
    variants: dedupeVariants(allVariants),
    isImpossible: false,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get a cache key for a condition
 */
function getConditionKey(node: ConditionNode): string {
  if (node.kind === 'true') return 'TRUE';
  if (node.kind === 'false') return 'FALSE';
  if (node.kind === 'state') return node.uniqueId;
  if (node.kind === 'compound') {
    const childKeys = node.children.map(getConditionKey).sort();
    return `${node.operator}(${childKeys.join(',')})`;
  }
  return 'UNKNOWN';
}

/**
 * Build a complete CSS selector from a single variant
 */
export function buildCSSSelectorFromVariant(
  className: string,
  variant: SelectorVariant,
  selectorSuffix: string = '',
): string {
  // Start with base class (doubled for specificity)
  let selector = `.${className}.${className}`;

  // Add modifier selectors
  selector += variant.modifierSelectors.join('');

  // Add selector suffix (e.g., ' [data-element="Label"]')
  selector += selectorSuffix;

  // Add own selectors (after sub-element)
  selector += variant.ownSelectors.join('');

  // Add root prefix if present
  if (variant.rootPrefix) {
    selector = `${variant.rootPrefix} ${selector}`;
  }

  return selector;
}

/**
 * Build at-rules array from a variant
 */
export function buildAtRulesFromVariant(variant: SelectorVariant): string[] {
  const atRules: string[] = [];

  // Add media rules
  if (variant.mediaRules.length > 0) {
    // Each rule is either:
    // - "@media (condition)" for positive conditions
    // - "@media not (condition)" for negated conditions
    // - "@media not print" for negated media types
    // - "@media (inverted-condition)" for negated dimension queries (already inverted)
    //
    // We strip "@media " and join with " and "
    // This produces valid CSS like:
    // @media not (prefers-color-scheme: dark) and (width > 800px)
    // which means: NOT(dark) AND (width > 800px)
    const conditions = variant.mediaRules.map((r) =>
      r.replace(/^@media\s*/, ''),
    );
    atRules.push(`@media ${conditions.join(' and ')}`);
  }

  // Add container rules
  atRules.push(...variant.containerRules);

  // Add starting-style
  if (variant.startingStyle) {
    atRules.push('@starting-style');
  }

  return atRules;
}

/**
 * Get a string key for a variant's at-rules (for grouping)
 */
function getAtRulesKey(variant: SelectorVariant): string {
  const atRules = buildAtRulesFromVariant(variant);
  return atRules.sort().join('|||');
}

/**
 * Materialize a computed rule into final CSS format
 *
 * Returns an array of CSSRules because OR conditions may require multiple rules
 * (when different branches have different at-rules)
 */
export function materializeRule(
  condition: ConditionNode,
  declarations: Record<string, string>,
  selectorSuffix: string,
  className: string,
): CSSRule[] {
  const components = conditionToCSS(condition);

  if (components.isImpossible || components.variants.length === 0) {
    return [];
  }

  const declarationsStr = Object.entries(declarations)
    .map(([prop, value]) => `${prop}: ${value};`)
    .join(' ');

  // Group variants by their at-rules (variants with same at-rules can be combined with commas)
  const byAtRules = new Map<string, SelectorVariant[]>();
  for (const variant of components.variants) {
    const key = getAtRulesKey(variant);
    const group = byAtRules.get(key) || [];
    group.push(variant);
    byAtRules.set(key, group);
  }

  // Generate one CSSRule per at-rules group
  const rules: CSSRule[] = [];
  for (const [, variants] of byAtRules) {
    // All variants in this group have the same at-rules, so combine selectors with commas
    const selectors = variants.map((v) =>
      buildCSSSelectorFromVariant(className, v, selectorSuffix),
    );
    const selector = selectors.join(', ');
    const atRules = buildAtRulesFromVariant(variants[0]);

    const rule: CSSRule = {
      selector,
      declarations: declarationsStr,
    };

    if (atRules.length > 0) {
      rule.atRules = atRules;
    }

    if (variants[0].rootPrefix) {
      rule.rootPrefix = variants[0].rootPrefix;
    }

    rules.push(rule);
  }

  return rules;
}
