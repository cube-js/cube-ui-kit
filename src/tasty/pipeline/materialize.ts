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
 * CSS output components extracted from a condition
 */
export interface CSSComponents {
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

  /** Whether condition is impossible (should skip) */
  isImpossible: boolean;
}

/**
 * Final CSS rule output
 */
export interface CSSRule {
  selector: string;
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

function conditionToCSSInner(node: ConditionNode): CSSComponents {
  // Base case: TRUE condition
  if (node.kind === 'true') {
    return {
      modifierSelectors: [],
      ownSelectors: [],
      mediaRules: [],
      containerRules: [],
      startingStyle: false,
      isImpossible: false,
    };
  }

  // Base case: FALSE condition
  if (node.kind === 'false') {
    return {
      modifierSelectors: [],
      ownSelectors: [],
      mediaRules: [],
      containerRules: [],
      startingStyle: false,
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

  // Fallback
  return {
    modifierSelectors: [],
    ownSelectors: [],
    mediaRules: [],
    containerRules: [],
    startingStyle: false,
    isImpossible: false,
  };
}

/**
 * Convert a state condition to CSS
 */
function stateToCSS(state: StateCondition): CSSComponents {
  const result: CSSComponents = {
    modifierSelectors: [],
    ownSelectors: [],
    mediaRules: [],
    containerRules: [],
    startingStyle: false,
    isImpossible: false,
  };

  switch (state.type) {
    case 'modifier':
      result.modifierSelectors.push(modifierToCSS(state));
      break;

    case 'pseudo':
      result.modifierSelectors.push(pseudoToCSS(state));
      break;

    case 'media':
      result.mediaRules.push(mediaToCSS(state));
      break;

    case 'container':
      result.containerRules.push(containerToCSS(state));
      break;

    case 'root':
      result.rootPrefix = rootToCSS(state);
      break;

    case 'own':
      result.ownSelectors.push(...ownToCSS(state));
      break;

    case 'starting':
      result.startingStyle = !state.negated;
      break;
  }

  return result;
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

  // The own condition's inner modifiers become the sub-element's selectors
  const selectors = [...innerCSS.modifierSelectors];

  if (state.negated) {
    // Negate all selectors
    return selectors.map((s) => {
      if (s.startsWith(':not(')) {
        // Double negation - remove :not()
        return s.slice(5, -1);
      }
      return `:not(${s})`;
    });
  }

  return selectors;
}

/**
 * Combine AND conditions into CSS
 */
function andToCSS(children: ConditionNode[]): CSSComponents {
  const result: CSSComponents = {
    modifierSelectors: [],
    ownSelectors: [],
    mediaRules: [],
    containerRules: [],
    startingStyle: false,
    isImpossible: false,
  };

  for (const child of children) {
    const childCSS = conditionToCSSInner(child);

    if (childCSS.isImpossible) {
      result.isImpossible = true;
      return result;
    }

    // Merge modifiers (AND = concatenate selectors)
    result.modifierSelectors.push(...childCSS.modifierSelectors);

    // Merge own selectors
    result.ownSelectors.push(...childCSS.ownSelectors);

    // Merge media rules (AND = combine with 'and')
    // For now, just collect them - the injector will combine
    result.mediaRules.push(...childCSS.mediaRules);

    // Merge container rules (nested)
    result.containerRules.push(...childCSS.containerRules);

    // Merge root prefix
    if (childCSS.rootPrefix) {
      if (result.rootPrefix) {
        // Combine multiple root prefixes
        result.rootPrefix = `${result.rootPrefix}${childCSS.rootPrefix.replace(':root', '')}`;
      } else {
        result.rootPrefix = childCSS.rootPrefix;
      }
    }

    // Starting style
    if (childCSS.startingStyle) {
      result.startingStyle = true;
    }
  }

  return result;
}

/**
 * Combine OR conditions into CSS
 *
 * OR in CSS means selector lists separated by commas.
 * This is complex for at-rules, so we may need to expand.
 */
function orToCSS(children: ConditionNode[]): CSSComponents {
  // For OR, we can only easily handle modifier-only conditions
  // Complex OR with at-rules requires multiple rules

  const allModifierOnly = children.every((child) => {
    const css = conditionToCSSInner(child);
    return (
      css.mediaRules.length === 0 &&
      css.containerRules.length === 0 &&
      !css.rootPrefix &&
      !css.startingStyle
    );
  });

  if (allModifierOnly) {
    // Can combine with selector list
    const result: CSSComponents = {
      modifierSelectors: [],
      ownSelectors: [],
      mediaRules: [],
      containerRules: [],
      startingStyle: false,
      isImpossible: false,
    };

    // For OR of modifiers, we need to generate a selector list
    // This is handled differently at materialization time
    // For now, collect all selectors
    for (const child of children) {
      const childCSS = conditionToCSSInner(child);
      if (childCSS.isImpossible) continue;
      result.modifierSelectors.push(...childCSS.modifierSelectors);
    }

    return result;
  }

  // Complex OR - for now, just take the first non-impossible child
  // TODO: Handle complex OR by expanding to multiple rules
  for (const child of children) {
    const childCSS = conditionToCSSInner(child);
    if (!childCSS.isImpossible) {
      return childCSS;
    }
  }

  return {
    modifierSelectors: [],
    ownSelectors: [],
    mediaRules: [],
    containerRules: [],
    startingStyle: false,
    isImpossible: true,
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
 * Build a complete CSS selector from components
 */
export function buildCSSSelector(
  className: string,
  components: CSSComponents,
  selectorSuffix: string = '',
): string {
  // Start with base class (doubled for specificity)
  let selector = `.${className}.${className}`;

  // Add modifier selectors
  selector += components.modifierSelectors.join('');

  // Add selector suffix (e.g., ' [data-element="Label"]')
  selector += selectorSuffix;

  // Add own selectors (after sub-element)
  selector += components.ownSelectors.join('');

  // Add root prefix if present
  if (components.rootPrefix) {
    selector = `${components.rootPrefix} ${selector}`;
  }

  return selector;
}

/**
 * Build at-rules array from components
 */
export function buildAtRules(components: CSSComponents): string[] {
  const atRules: string[] = [];

  // Add media rules
  if (components.mediaRules.length > 0) {
    // Combine media rules with 'and'
    const conditions = components.mediaRules
      .map((r) => r.replace(/^@media\s*/, ''))
      .join(' and ');
    atRules.push(`@media ${conditions}`);
  }

  // Add container rules
  atRules.push(...components.containerRules);

  // Add starting-style
  if (components.startingStyle) {
    atRules.push('@starting-style');
  }

  return atRules;
}

/**
 * Materialize a computed rule into final CSS format
 */
export function materializeRule(
  condition: ConditionNode,
  declarations: Record<string, string>,
  selectorSuffix: string,
  className: string,
): CSSRule | null {
  const components = conditionToCSS(condition);

  if (components.isImpossible) {
    return null;
  }

  const selector = buildCSSSelector(className, components, selectorSuffix);
  const atRules = buildAtRules(components);

  const declarationsStr = Object.entries(declarations)
    .map(([prop, value]) => `${prop}: ${value};`)
    .join(' ');

  const rule: CSSRule = {
    selector,
    declarations: declarationsStr,
  };

  if (atRules.length > 0) {
    rule.atRules = atRules;
  }

  if (components.rootPrefix) {
    rule.rootPrefix = components.rootPrefix;
  }

  return rule;
}
