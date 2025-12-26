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
  const variant: SelectorVariant = emptyVariant();

  switch (state.type) {
    case 'modifier':
      variant.modifierSelectors.push(modifierToCSS(state));
      break;

    case 'pseudo':
      variant.modifierSelectors.push(pseudoToCSS(state));
      break;

    case 'media':
      variant.mediaRules.push(mediaToCSS(state));
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
 * Convert media condition to CSS at-rule
 */
function mediaToCSS(state: MediaCondition): string {
  let condition: string;

  if (state.subtype === 'type') {
    // @media:print → @media print
    condition = state.mediaType || 'all';
  } else if (state.subtype === 'feature') {
    // @media(prefers-contrast: high) → @media (prefers-contrast: high)
    if (state.featureValue) {
      condition = `(${state.feature}: ${state.featureValue})`;
    } else {
      condition = `(${state.feature})`;
    }
  } else {
    // Dimension query
    condition = dimensionToMediaCondition(
      state.dimension || 'width',
      state.lowerBound,
      state.upperBound,
    );
  }

  if (state.negated) {
    return `@media not ${condition}`;
  }
  return `@media ${condition}`;
}

/**
 * Convert container condition to CSS at-rule
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
    // Dimension query
    condition = dimensionToMediaCondition(
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
 * Convert dimension bounds to a media/container condition string
 */
function dimensionToMediaCondition(
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
): SelectorVariant {
  return {
    modifierSelectors: dedupeArray([
      ...a.modifierSelectors,
      ...b.modifierSelectors,
    ]),
    ownSelectors: dedupeArray([...a.ownSelectors, ...b.ownSelectors]),
    mediaRules: dedupeArray([...a.mediaRules, ...b.mediaRules]),
    containerRules: dedupeArray([...a.containerRules, ...b.containerRules]),
    rootPrefix: combineRootPrefixes(a.rootPrefix, b.rootPrefix),
    startingStyle: a.startingStyle || b.startingStyle,
  };
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
 * Deduplicate variants
 */
function dedupeVariants(variants: SelectorVariant[]): SelectorVariant[] {
  const seen = new Set<string>();
  const result: SelectorVariant[] = [];

  for (const v of variants) {
    const key = getVariantKey(v);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(v);
    }
  }

  return result;
}

/**
 * Combine AND conditions into CSS
 *
 * AND of conditions means cartesian product of variants:
 * (A1 | A2) & (B1 | B2) = A1&B1 | A1&B2 | A2&B1 | A2&B2
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
        newVariants.push(mergeVariants(current, childVariant));
      }
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
 */
function orToCSS(children: ConditionNode[]): CSSComponents {
  const allVariants: SelectorVariant[] = [];

  for (const child of children) {
    const childCSS = conditionToCSSInner(child);
    if (childCSS.isImpossible) continue;

    // Collect all variants from this OR branch
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
    // Combine media rules with 'and'
    const conditions = variant.mediaRules
      .map((r) => r.replace(/^@media\s*/, ''))
      .join(' and ');
    atRules.push(`@media ${conditions}`);
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
