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
  SupportsCondition,
} from './conditions';

// ============================================================================
// Types
// ============================================================================

/**
 * Parsed media condition for structured analysis and combination
 */
export interface ParsedMediaCondition {
  /** Subtype for structured analysis */
  subtype: 'dimension' | 'feature' | 'type';
  /** Whether this is a negated condition */
  negated: boolean;
  /** The condition part for CSS output (e.g., "(width < 600px)", "print") */
  condition: string;
  /** For dimension queries: dimension name */
  dimension?: 'width' | 'height' | 'inline-size' | 'block-size';
  /** For dimension queries: lower bound value */
  lowerBound?: {
    value: string;
    valueNumeric: number | null;
    inclusive: boolean;
  };
  /** For dimension queries: upper bound value */
  upperBound?: {
    value: string;
    valueNumeric: number | null;
    inclusive: boolean;
  };
  /** For feature queries: feature name */
  feature?: string;
  /** For feature queries: feature value */
  featureValue?: string;
  /** For type queries: media type */
  mediaType?: 'print' | 'screen' | 'all' | 'speech';
}

/**
 * Parsed container condition for structured analysis and combination
 */
export interface ParsedContainerCondition {
  /** Container name (undefined = unnamed/nearest container) */
  name?: string;
  /** The condition part (e.g., "(width < 600px)" or "style(--variant: danger)") */
  condition: string;
  /** Whether this is a negated condition */
  negated: boolean;
  /** Subtype for structured analysis */
  subtype: 'dimension' | 'style';
  /** For style queries: property name (without --) */
  property?: string;
  /** For style queries: property value (undefined = existence check) */
  propertyValue?: string;
}

/**
 * Parsed supports condition for structured analysis and combination
 */
export interface ParsedSupportsCondition {
  /** Subtype: 'feature' for property support, 'selector' for selector() support */
  subtype: 'feature' | 'selector';
  /** The condition string (e.g., "display: grid" or ":has(*)") */
  condition: string;
  /** Whether this is a negated condition */
  negated: boolean;
}

/**
 * Parsed modifier condition for structured analysis
 */
export interface ParsedModifierCondition {
  /** Attribute name (e.g., 'data-hovered', 'data-size') */
  attribute: string;
  /** Value if present (e.g., 'large', 'danger') */
  value?: string;
  /** Operator for value matching (default '=') */
  operator?: '=' | '^=' | '$=' | '*=';
  /** Whether this is negated (:not(...)) */
  negated: boolean;
}

/**
 * Parsed pseudo-class condition for structured analysis
 */
export interface ParsedPseudoCondition {
  /** The pseudo-class (e.g., ':hover', ':focus-visible', ':has(> Icon)') */
  pseudo: string;
  /** Whether this is negated (:not(...)) */
  negated: boolean;
}

/**
 * Parsed root condition for structured analysis
 */
export interface ParsedRootCondition {
  /** The selector part (e.g., '[data-theme="dark"]') */
  selector: string;
  /** Whether this is negated (:root:not(...)) */
  negated: boolean;
}

/**
 * A single selector variant (one term in a DNF expression)
 */
export interface SelectorVariant {
  /** Structured modifier conditions */
  modifierConditions: ParsedModifierCondition[];

  /** Structured pseudo conditions */
  pseudoConditions: ParsedPseudoCondition[];

  /** Structured own conditions (for sub-element states) */
  ownConditions: (ParsedModifierCondition | ParsedPseudoCondition)[];

  /** Parsed media conditions for structured combination */
  mediaConditions: ParsedMediaCondition[];

  /** Parsed container conditions for structured combination */
  containerConditions: ParsedContainerCondition[];

  /** Parsed supports conditions for @supports at-rules */
  supportsConditions: ParsedSupportsCondition[];

  /** Structured root conditions */
  rootConditions: ParsedRootCondition[];

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
    modifierConditions: [],
    pseudoConditions: [],
    ownConditions: [],
    mediaConditions: [],
    containerConditions: [],
    supportsConditions: [],
    rootConditions: [],
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
      // Media conditions can return multiple variants for negated ranges (OR branches)
      const mediaResults = mediaToParsed(state);
      const variants = mediaResults.map((mediaCond) => {
        const v = emptyVariant();
        v.mediaConditions.push(mediaCond);
        return v;
      });
      return { variants, isImpossible: false };
    }

    default: {
      const variant: SelectorVariant = emptyVariant();

      switch (state.type) {
        case 'modifier':
          variant.modifierConditions.push(modifierToParsed(state));
          break;

        case 'pseudo':
          variant.pseudoConditions.push(pseudoToParsed(state));
          break;

        case 'container':
          variant.containerConditions.push(containerToParsed(state));
          break;

        case 'supports':
          variant.supportsConditions.push(supportsToParsed(state));
          break;

        case 'root':
          variant.rootConditions.push(rootToParsed(state));
          break;

        case 'own':
          variant.ownConditions.push(...ownToParsed(state));
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
 * Convert modifier condition to parsed structure
 */
function modifierToParsed(state: ModifierCondition): ParsedModifierCondition {
  return {
    attribute: state.attribute,
    value: state.value,
    operator: state.operator,
    negated: state.negated ?? false,
  };
}

/**
 * Convert parsed modifier to CSS selector string (for final output)
 */
export function modifierToCSS(mod: ParsedModifierCondition): string {
  let selector: string;

  if (mod.value !== undefined) {
    // Value attribute: [data-attr="value"]
    const op = mod.operator || '=';
    selector = `[${mod.attribute}${op}"${mod.value}"]`;
  } else {
    // Boolean attribute: [data-attr]
    selector = `[${mod.attribute}]`;
  }

  if (mod.negated) {
    return `:not(${selector})`;
  }
  return selector;
}

/**
 * Convert pseudo condition to parsed structure
 */
function pseudoToParsed(state: PseudoCondition): ParsedPseudoCondition {
  return {
    pseudo: state.pseudo,
    negated: state.negated ?? false,
  };
}

/**
 * Convert parsed pseudo to CSS selector string (for final output)
 */
export function pseudoToCSS(pseudo: ParsedPseudoCondition): string {
  if (pseudo.negated) {
    // Wrap in :not() if not already
    if (pseudo.pseudo.startsWith(':not(')) {
      // Double negation - remove :not()
      return pseudo.pseudo.slice(5, -1);
    }
    return `:not(${pseudo.pseudo})`;
  }
  return pseudo.pseudo;
}

/**
 * Convert media condition to parsed structure(s)
 * Returns an array because negated ranges produce OR branches (two separate conditions)
 */
function mediaToParsed(state: MediaCondition): ParsedMediaCondition[] {
  if (state.subtype === 'type') {
    // @media:print → @media print (or @media not print)
    const mediaType = state.mediaType || 'all';
    return [
      {
        subtype: 'type',
        negated: state.negated ?? false,
        condition: mediaType,
        mediaType: state.mediaType,
      },
    ];
  } else if (state.subtype === 'feature') {
    // @media(prefers-contrast: high) → @media (prefers-contrast: high)
    let condition: string;
    if (state.featureValue) {
      condition = `(${state.feature}: ${state.featureValue})`;
    } else {
      condition = `(${state.feature})`;
    }
    return [
      {
        subtype: 'feature',
        negated: state.negated ?? false,
        condition,
        feature: state.feature,
        featureValue: state.featureValue,
      },
    ];
  } else {
    // Dimension query - negation is handled by inverting the condition
    // because "not (width < x)" doesn't work reliably in browsers
    return dimensionToMediaParsed(
      state.dimension || 'width',
      state.lowerBound,
      state.upperBound,
      state.negated ?? false,
    );
  }
}

/**
 * Convert dimension bounds to parsed media condition(s)
 * Uses CSS Media Queries Level 4 `not (condition)` syntax for negation.
 */
function dimensionToMediaParsed(
  dimension: 'width' | 'height' | 'inline-size' | 'block-size',
  lowerBound?: {
    value: string;
    valueNumeric: number | null;
    inclusive: boolean;
  },
  upperBound?: {
    value: string;
    valueNumeric: number | null;
    inclusive: boolean;
  },
  negated?: boolean,
): ParsedMediaCondition[] {
  // Build the condition string
  let condition: string;
  if (lowerBound && upperBound) {
    const lowerOp = lowerBound.inclusive ? '<=' : '<';
    const upperOp = upperBound.inclusive ? '<=' : '<';
    condition = `(${lowerBound.value} ${lowerOp} ${dimension} ${upperOp} ${upperBound.value})`;
  } else if (upperBound) {
    const op = upperBound.inclusive ? '<=' : '<';
    condition = `(${dimension} ${op} ${upperBound.value})`;
  } else if (lowerBound) {
    const op = lowerBound.inclusive ? '>=' : '>';
    condition = `(${dimension} ${op} ${lowerBound.value})`;
  } else {
    condition = `(${dimension})`;
  }

  // For negation, we use CSS `not (condition)` syntax in buildAtRulesFromVariant
  return [
    {
      subtype: 'dimension',
      negated: negated ?? false,
      condition,
      dimension,
      lowerBound,
      upperBound,
    },
  ];
}

/**
 * Convert container condition to parsed structure
 * This enables structured analysis for contradiction detection and condition combining
 */
function containerToParsed(
  state: ContainerCondition,
): ParsedContainerCondition {
  let condition: string;

  if (state.subtype === 'style') {
    // Style query: style(--prop: value)
    if (state.propertyValue) {
      condition = `style(--${state.property}: ${state.propertyValue})`;
    } else {
      condition = `style(--${state.property})`;
    }
  } else {
    // Dimension query
    condition = dimensionToContainerCondition(
      state.dimension || 'width',
      state.lowerBound,
      state.upperBound,
    );
  }

  return {
    name: state.containerName,
    condition,
    negated: state.negated ?? false,
    subtype: state.subtype,
    property: state.property,
    propertyValue: state.propertyValue,
  };
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
 * Convert supports condition to parsed structure
 */
function supportsToParsed(state: SupportsCondition): ParsedSupportsCondition {
  return {
    subtype: state.subtype,
    condition: state.condition,
    negated: state.negated ?? false,
  };
}

/**
 * Convert root condition to parsed structure
 */
function rootToParsed(state: RootCondition): ParsedRootCondition {
  return {
    selector: state.selector,
    negated: state.negated ?? false,
  };
}

/**
 * Convert parsed root conditions to CSS selector prefix (for final output)
 */
export function rootConditionsToCSS(
  roots: ParsedRootCondition[],
): string | undefined {
  if (roots.length === 0) return undefined;

  // Combine all root conditions into a single :root prefix
  // e.g., :root[data-theme="dark"]:not([data-mode="light"])
  let prefix = ':root';
  for (const root of roots) {
    if (root.negated) {
      prefix += `:not(${root.selector})`;
    } else {
      prefix += root.selector;
    }
  }
  return prefix;
}

/**
 * Convert own condition to parsed structures for sub-element
 */
function ownToParsed(
  state: OwnCondition,
): (ParsedModifierCondition | ParsedPseudoCondition)[] {
  const innerCSS = conditionToCSS(state.innerCondition);

  if (innerCSS.isImpossible || innerCSS.variants.length === 0) {
    return [];
  }

  // Collect all modifier/pseudo conditions from all variants
  const allConditions: (ParsedModifierCondition | ParsedPseudoCondition)[] = [];
  for (const variant of innerCSS.variants) {
    for (const mod of variant.modifierConditions) {
      // Apply outer negation
      allConditions.push({
        ...mod,
        negated: state.negated ? !mod.negated : mod.negated,
      });
    }
    for (const pseudo of variant.pseudoConditions) {
      // Apply outer negation
      allConditions.push({
        ...pseudo,
        negated: state.negated ? !pseudo.negated : pseudo.negated,
      });
    }
  }

  return allConditions;
}

/**
 * Get unique key for a modifier condition
 */
function getModifierKey(mod: ParsedModifierCondition): string {
  const base = mod.value
    ? `${mod.attribute}${mod.operator || '='}${mod.value}`
    : mod.attribute;
  return mod.negated ? `!${base}` : base;
}

/**
 * Get unique key for a pseudo condition
 */
function getPseudoKey(pseudo: ParsedPseudoCondition): string {
  return pseudo.negated ? `!${pseudo.pseudo}` : pseudo.pseudo;
}

/**
 * Get unique key for a root condition
 */
function getRootKey(root: ParsedRootCondition): string {
  return root.negated ? `!${root.selector}` : root.selector;
}

/**
 * Deduplicate modifier conditions
 */
function dedupeModifierConditions(
  conditions: ParsedModifierCondition[],
): ParsedModifierCondition[] {
  const seen = new Set<string>();
  const result: ParsedModifierCondition[] = [];
  for (const c of conditions) {
    const key = getModifierKey(c);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(c);
    }
  }
  return result;
}

/**
 * Deduplicate pseudo conditions
 */
function dedupePseudoConditions(
  conditions: ParsedPseudoCondition[],
): ParsedPseudoCondition[] {
  const seen = new Set<string>();
  const result: ParsedPseudoCondition[] = [];
  for (const c of conditions) {
    const key = getPseudoKey(c);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(c);
    }
  }
  return result;
}

/**
 * Deduplicate root conditions
 */
function dedupeRootConditions(
  conditions: ParsedRootCondition[],
): ParsedRootCondition[] {
  const seen = new Set<string>();
  const result: ParsedRootCondition[] = [];
  for (const c of conditions) {
    const key = getRootKey(c);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(c);
    }
  }
  return result;
}

/**
 * Deduplicate own conditions (modifiers or pseudos)
 */
function dedupeOwnConditions(
  conditions: (ParsedModifierCondition | ParsedPseudoCondition)[],
): (ParsedModifierCondition | ParsedPseudoCondition)[] {
  const seen = new Set<string>();
  const result: (ParsedModifierCondition | ParsedPseudoCondition)[] = [];
  for (const c of conditions) {
    const key =
      'attribute' in c
        ? `mod:${getModifierKey(c)}`
        : `pseudo:${getPseudoKey(c)}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(c);
    }
  }
  return result;
}

/**
 * Check for modifier contradiction: same attribute with opposite negation
 */
function hasModifierContradiction(
  conditions: ParsedModifierCondition[],
): boolean {
  const byKey = new Map<string, boolean>(); // base key -> isPositive

  for (const mod of conditions) {
    const baseKey = mod.value
      ? `${mod.attribute}${mod.operator || '='}${mod.value}`
      : mod.attribute;
    const existing = byKey.get(baseKey);
    if (existing !== undefined && existing !== !mod.negated) {
      return true; // Same attribute with opposite negation
    }
    byKey.set(baseKey, !mod.negated);
  }
  return false;
}

/**
 * Check for pseudo contradiction: same pseudo with opposite negation
 */
function hasPseudoContradiction(conditions: ParsedPseudoCondition[]): boolean {
  const byKey = new Map<string, boolean>(); // pseudo -> isPositive

  for (const pseudo of conditions) {
    const existing = byKey.get(pseudo.pseudo);
    if (existing !== undefined && existing !== !pseudo.negated) {
      return true; // Same pseudo with opposite negation
    }
    byKey.set(pseudo.pseudo, !pseudo.negated);
  }
  return false;
}

/**
 * Check for root condition contradiction: same selector with opposite negation
 */
function hasRootContradiction(conditions: ParsedRootCondition[]): boolean {
  const byKey = new Map<string, boolean>(); // selector -> isPositive

  for (const root of conditions) {
    const existing = byKey.get(root.selector);
    if (existing !== undefined && existing !== !root.negated) {
      return true; // Same selector with opposite negation
    }
    byKey.set(root.selector, !root.negated);
  }
  return false;
}

/**
 * Check for own condition contradiction
 */
function hasOwnConditionContradiction(
  conditions: (ParsedModifierCondition | ParsedPseudoCondition)[],
): boolean {
  const modifiers: ParsedModifierCondition[] = [];
  const pseudos: ParsedPseudoCondition[] = [];

  for (const c of conditions) {
    if ('attribute' in c) {
      modifiers.push(c);
    } else {
      pseudos.push(c);
    }
  }

  return hasModifierContradiction(modifiers) || hasPseudoContradiction(pseudos);
}

/**
 * Merge two selector variants (AND operation)
 * Deduplicates conditions and checks for contradictions
 */
function mergeVariants(
  a: SelectorVariant,
  b: SelectorVariant,
): SelectorVariant | null {
  // Merge media conditions and check for contradictions
  const mergedMedia = dedupeMediaConditions([
    ...a.mediaConditions,
    ...b.mediaConditions,
  ]);
  if (hasMediaContradiction(mergedMedia)) {
    return null; // Impossible variant
  }

  // Merge root conditions and check for contradictions
  const mergedRoots = dedupeRootConditions([
    ...a.rootConditions,
    ...b.rootConditions,
  ]);
  if (hasRootContradiction(mergedRoots)) {
    return null; // Impossible variant
  }

  // Merge modifier conditions and check for contradictions
  const mergedModifiers = dedupeModifierConditions([
    ...a.modifierConditions,
    ...b.modifierConditions,
  ]);
  if (hasModifierContradiction(mergedModifiers)) {
    return null; // Impossible variant
  }

  // Merge pseudo conditions and check for contradictions
  const mergedPseudos = dedupePseudoConditions([
    ...a.pseudoConditions,
    ...b.pseudoConditions,
  ]);
  if (hasPseudoContradiction(mergedPseudos)) {
    return null; // Impossible variant
  }

  // Merge own conditions and check for contradictions
  const mergedOwn = dedupeOwnConditions([
    ...a.ownConditions,
    ...b.ownConditions,
  ]);
  if (hasOwnConditionContradiction(mergedOwn)) {
    return null; // Impossible variant
  }

  // Merge container conditions and check for contradictions
  const mergedContainers = dedupeContainerConditions([
    ...a.containerConditions,
    ...b.containerConditions,
  ]);
  if (hasContainerStyleContradiction(mergedContainers)) {
    return null; // Impossible variant
  }

  // Merge supports conditions and check for contradictions
  const mergedSupports = dedupeSupportsConditions([
    ...a.supportsConditions,
    ...b.supportsConditions,
  ]);
  if (hasSupportsContradiction(mergedSupports)) {
    return null; // Impossible variant
  }

  return {
    modifierConditions: mergedModifiers,
    pseudoConditions: mergedPseudos,
    ownConditions: mergedOwn,
    mediaConditions: mergedMedia,
    containerConditions: mergedContainers,
    supportsConditions: mergedSupports,
    rootConditions: mergedRoots,
    startingStyle: a.startingStyle || b.startingStyle,
  };
}

/**
 * Deduplicate media conditions by their key (subtype + condition + negated)
 */
function dedupeMediaConditions(
  conditions: ParsedMediaCondition[],
): ParsedMediaCondition[] {
  const seen = new Set<string>();
  const result: ParsedMediaCondition[] = [];
  for (const c of conditions) {
    const key = `${c.subtype}|${c.condition}|${c.negated}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(c);
    }
  }
  return result;
}

/**
 * Deduplicate container conditions by their key (name + condition + negated)
 */
function dedupeContainerConditions(
  conditions: ParsedContainerCondition[],
): ParsedContainerCondition[] {
  const seen = new Set<string>();
  const result: ParsedContainerCondition[] = [];
  for (const c of conditions) {
    const key = `${c.name ?? ''}|${c.condition}|${c.negated}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(c);
    }
  }
  return result;
}

/**
 * Deduplicate supports conditions by their key (subtype + condition + negated)
 */
function dedupeSupportsConditions(
  conditions: ParsedSupportsCondition[],
): ParsedSupportsCondition[] {
  const seen = new Set<string>();
  const result: ParsedSupportsCondition[] = [];
  for (const c of conditions) {
    const key = `${c.subtype}|${c.condition}|${c.negated}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(c);
    }
  }
  return result;
}

/**
 * Check if supports conditions contain contradictions
 * e.g., @supports(display: grid) AND NOT @supports(display: grid)
 */
function hasSupportsContradiction(
  conditions: ParsedSupportsCondition[],
): boolean {
  const conditionMap = new Map<string, boolean>(); // key -> isPositive

  for (const cond of conditions) {
    const key = `${cond.subtype}|${cond.condition}`;
    const existing = conditionMap.get(key);
    if (existing !== undefined && existing !== !cond.negated) {
      return true; // Contradiction: positive AND negated
    }
    conditionMap.set(key, !cond.negated);
  }

  return false;
}

/**
 * Check if a set of media conditions contains contradictions
 * e.g., (prefers-color-scheme: light) AND NOT (prefers-color-scheme: light)
 * or (width >= 900px) AND (width < 600px)
 *
 * Uses parsed media conditions for efficient analysis without regex parsing.
 */
function hasMediaContradiction(conditions: ParsedMediaCondition[]): boolean {
  // Track conditions by their key (condition string) to detect A and NOT A
  const featureConditions = new Map<string, boolean>(); // key -> isPositive
  const typeConditions = new Map<string, boolean>(); // mediaType -> isPositive
  const dimensionConditions = new Map<string, boolean>(); // condition -> isPositive

  // Track dimension conditions for range contradiction detection (non-negated only)
  const dimensionsByDim = new Map<
    string,
    { lowerBound: number | null; upperBound: number | null }
  >();

  for (const cond of conditions) {
    if (cond.subtype === 'type') {
      // Type query: check for direct contradiction (print AND NOT print)
      const key = cond.mediaType || 'all';
      const existing = typeConditions.get(key);
      if (existing !== undefined && existing !== !cond.negated) {
        return true; // Contradiction: positive AND negated
      }
      typeConditions.set(key, !cond.negated);
    } else if (cond.subtype === 'feature') {
      // Feature query: check for direct contradiction
      const key = cond.condition;
      const existing = featureConditions.get(key);
      if (existing !== undefined && existing !== !cond.negated) {
        return true; // Contradiction: positive AND negated
      }
      featureConditions.set(key, !cond.negated);
    } else if (cond.subtype === 'dimension') {
      // First, check for direct contradiction: (width < 600px) AND NOT (width < 600px)
      const condKey = cond.condition;
      const existing = dimensionConditions.get(condKey);
      if (existing !== undefined && existing !== !cond.negated) {
        return true; // Contradiction: positive AND negated
      }
      dimensionConditions.set(condKey, !cond.negated);

      // For range analysis, only consider non-negated conditions
      // Negated conditions are handled via the direct contradiction check above
      if (!cond.negated) {
        const dim = cond.dimension || 'width';
        let bounds = dimensionsByDim.get(dim);
        if (!bounds) {
          bounds = { lowerBound: null, upperBound: null };
          dimensionsByDim.set(dim, bounds);
        }

        // Track the effective bounds
        if (cond.lowerBound?.valueNumeric != null) {
          const value = cond.lowerBound.valueNumeric;
          if (bounds.lowerBound === null || value > bounds.lowerBound) {
            bounds.lowerBound = value;
          }
        }
        if (cond.upperBound?.valueNumeric != null) {
          const value = cond.upperBound.valueNumeric;
          if (bounds.upperBound === null || value < bounds.upperBound) {
            bounds.upperBound = value;
          }
        }

        // Check for impossible range
        if (
          bounds.lowerBound !== null &&
          bounds.upperBound !== null &&
          bounds.lowerBound >= bounds.upperBound
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Check if container conditions contain contradictions in style queries
 * e.g., style(--variant: danger) and style(--variant: success) together
 * Same property with different values = always false
 *
 * Uses parsed container conditions for efficient analysis without regex parsing.
 */
function hasContainerStyleContradiction(
  conditions: ParsedContainerCondition[],
): boolean {
  // Track style queries by property name
  // key: property name, value: { hasExistence: boolean, values: Set<string>, hasNegatedExistence: boolean }
  const styleQueries = new Map<
    string,
    { hasExistence: boolean; values: Set<string>; hasNegatedExistence: boolean }
  >();

  for (const cond of conditions) {
    // Only analyze style queries
    if (cond.subtype !== 'style' || !cond.property) {
      continue;
    }

    const property = cond.property;
    const value = cond.propertyValue;

    if (!styleQueries.has(property)) {
      styleQueries.set(property, {
        hasExistence: false,
        values: new Set(),
        hasNegatedExistence: false,
      });
    }

    const entry = styleQueries.get(property)!;

    if (cond.negated) {
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
 * Get a unique key for a variant (for deduplication)
 */
function getVariantKey(v: SelectorVariant): string {
  const modifierKey = v.modifierConditions.map(getModifierKey).sort().join('|');
  const pseudoKey = v.pseudoConditions.map(getPseudoKey).sort().join('|');
  const ownKey = v.ownConditions
    .map((c) =>
      'attribute' in c
        ? `mod:${getModifierKey(c)}`
        : `pseudo:${getPseudoKey(c)}`,
    )
    .sort()
    .join('|');
  const containerKey = v.containerConditions
    .map((c) => `${c.name ?? ''}:${c.negated ? '!' : ''}${c.condition}`)
    .sort()
    .join('|');
  const mediaKey = v.mediaConditions
    .map((c) => `${c.subtype}:${c.negated ? '!' : ''}${c.condition}`)
    .sort()
    .join('|');
  const supportsKey = v.supportsConditions
    .map((c) => `${c.subtype}:${c.negated ? '!' : ''}${c.condition}`)
    .sort()
    .join('|');
  const rootKey = v.rootConditions.map(getRootKey).sort().join('|');
  return [
    modifierKey,
    pseudoKey,
    ownKey,
    mediaKey,
    containerKey,
    supportsKey,
    rootKey,
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
  // Must have same context
  if (a.startingStyle !== b.startingStyle) return false;

  // Check if a.rootConditions is superset of b.rootConditions
  if (!isRootConditionsSuperset(a.rootConditions, b.rootConditions))
    return false;

  // Check if a.mediaConditions is superset of b.mediaConditions
  if (!isMediaConditionsSuperset(a.mediaConditions, b.mediaConditions))
    return false;

  // Check if a.containerConditions is superset of b.containerConditions
  if (
    !isContainerConditionsSuperset(a.containerConditions, b.containerConditions)
  )
    return false;

  // Check if a.supportsConditions is superset of b.supportsConditions
  if (!isSupportsConditionsSuperset(a.supportsConditions, b.supportsConditions))
    return false;

  // Check if a.modifierConditions is superset of b.modifierConditions
  if (!isModifierConditionsSuperset(a.modifierConditions, b.modifierConditions))
    return false;

  // Check if a.pseudoConditions is superset of b.pseudoConditions
  if (!isPseudoConditionsSuperset(a.pseudoConditions, b.pseudoConditions))
    return false;

  // Check if a.ownConditions is superset of b.ownConditions
  if (!isOwnConditionsSuperset(a.ownConditions, b.ownConditions)) return false;

  // A is a superset if it has all of B's items (possibly more)
  // and at least one category has strictly more items
  const aTotal =
    a.mediaConditions.length +
    a.containerConditions.length +
    a.supportsConditions.length +
    a.modifierConditions.length +
    a.pseudoConditions.length +
    a.rootConditions.length +
    a.ownConditions.length;
  const bTotal =
    b.mediaConditions.length +
    b.containerConditions.length +
    b.supportsConditions.length +
    b.modifierConditions.length +
    b.pseudoConditions.length +
    b.rootConditions.length +
    b.ownConditions.length;

  return aTotal > bTotal;
}

/**
 * Check if media conditions A is a superset of B
 */
function isMediaConditionsSuperset(
  a: ParsedMediaCondition[],
  b: ParsedMediaCondition[],
): boolean {
  const aKeys = new Set(
    a.map((c) => `${c.subtype}|${c.condition}|${c.negated}`),
  );
  for (const c of b) {
    const key = `${c.subtype}|${c.condition}|${c.negated}`;
    if (!aKeys.has(key)) return false;
  }
  return true;
}

/**
 * Check if container conditions A is a superset of B
 */
function isContainerConditionsSuperset(
  a: ParsedContainerCondition[],
  b: ParsedContainerCondition[],
): boolean {
  const aKeys = new Set(
    a.map((c) => `${c.name ?? ''}|${c.condition}|${c.negated}`),
  );
  for (const c of b) {
    const key = `${c.name ?? ''}|${c.condition}|${c.negated}`;
    if (!aKeys.has(key)) return false;
  }
  return true;
}

/**
 * Check if supports conditions A is a superset of B
 */
function isSupportsConditionsSuperset(
  a: ParsedSupportsCondition[],
  b: ParsedSupportsCondition[],
): boolean {
  const aKeys = new Set(
    a.map((c) => `${c.subtype}|${c.condition}|${c.negated}`),
  );
  for (const c of b) {
    const key = `${c.subtype}|${c.condition}|${c.negated}`;
    if (!aKeys.has(key)) return false;
  }
  return true;
}

/**
 * Check if modifier conditions A is a superset of B
 */
function isModifierConditionsSuperset(
  a: ParsedModifierCondition[],
  b: ParsedModifierCondition[],
): boolean {
  const aKeys = new Set(a.map(getModifierKey));
  for (const c of b) {
    if (!aKeys.has(getModifierKey(c))) return false;
  }
  return true;
}

/**
 * Check if pseudo conditions A is a superset of B
 */
function isPseudoConditionsSuperset(
  a: ParsedPseudoCondition[],
  b: ParsedPseudoCondition[],
): boolean {
  const aKeys = new Set(a.map(getPseudoKey));
  for (const c of b) {
    if (!aKeys.has(getPseudoKey(c))) return false;
  }
  return true;
}

/**
 * Check if root conditions A is a superset of B
 */
function isRootConditionsSuperset(
  a: ParsedRootCondition[],
  b: ParsedRootCondition[],
): boolean {
  const aKeys = new Set(a.map(getRootKey));
  for (const c of b) {
    if (!aKeys.has(getRootKey(c))) return false;
  }
  return true;
}

/**
 * Check if own conditions A is a superset of B
 */
function isOwnConditionsSuperset(
  a: (ParsedModifierCondition | ParsedPseudoCondition)[],
  b: (ParsedModifierCondition | ParsedPseudoCondition)[],
): boolean {
  const aKeys = new Set(
    a.map((c) =>
      'attribute' in c
        ? `mod:${getModifierKey(c)}`
        : `pseudo:${getPseudoKey(c)}`,
    ),
  );
  for (const c of b) {
    const key =
      'attribute' in c
        ? `mod:${getModifierKey(c)}`
        : `pseudo:${getPseudoKey(c)}`;
    if (!aKeys.has(key)) return false;
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
  // Sort by total condition count (fewer conditions = less restrictive = keep)
  result.sort((a, b) => {
    const aCount =
      a.modifierConditions.length +
      a.pseudoConditions.length +
      a.ownConditions.length +
      a.mediaConditions.length +
      a.containerConditions.length +
      a.supportsConditions.length +
      a.rootConditions.length;
    const bCount =
      b.modifierConditions.length +
      b.pseudoConditions.length +
      b.ownConditions.length +
      b.mediaConditions.length +
      b.containerConditions.length +
      b.supportsConditions.length +
      b.rootConditions.length;
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
function buildCSSSelectorFromVariant(
  className: string,
  variant: SelectorVariant,
  selectorSuffix: string = '',
): string {
  // Start with base class (doubled for specificity)
  let selector = `.${className}.${className}`;

  // Add modifier selectors
  for (const mod of variant.modifierConditions) {
    selector += modifierToCSS(mod);
  }

  // Add pseudo selectors
  for (const pseudo of variant.pseudoConditions) {
    selector += pseudoToCSS(pseudo);
  }

  // Add selector suffix (e.g., ' [data-element="Label"]')
  selector += selectorSuffix;

  // Add own selectors (after sub-element)
  for (const own of variant.ownConditions) {
    if ('attribute' in own) {
      selector += modifierToCSS(own);
    } else {
      selector += pseudoToCSS(own);
    }
  }

  // Add root prefix if present
  const rootPrefix = rootConditionsToCSS(variant.rootConditions);
  if (rootPrefix) {
    selector = `${rootPrefix} ${selector}`;
  }

  return selector;
}

/**
 * Build at-rules array from a variant
 */
export function buildAtRulesFromVariant(variant: SelectorVariant): string[] {
  const atRules: string[] = [];

  // Add media rules - combine all conditions with "and"
  if (variant.mediaConditions.length > 0) {
    const conditionParts = variant.mediaConditions.map((c) => {
      if (c.subtype === 'type') {
        // Media type: print, screen, etc.
        return c.negated ? `not ${c.condition}` : c.condition;
      } else {
        // Feature or dimension: use not (condition) syntax for negation
        // MQ Level 4 requires parentheses around the condition for negation
        return c.negated ? `(not ${c.condition})` : c.condition;
      }
    });
    atRules.push(`@media ${conditionParts.join(' and ')}`);
  }

  // Add container rules - group by container name and combine with "and"
  if (variant.containerConditions.length > 0) {
    // Group conditions by container name (undefined = unnamed/nearest)
    const byName = new Map<string | undefined, ParsedContainerCondition[]>();
    for (const cond of variant.containerConditions) {
      const group = byName.get(cond.name) || [];
      group.push(cond);
      byName.set(cond.name, group);
    }

    // Build one @container rule per container name
    for (const [name, conditions] of byName) {
      // CSS Container Query syntax requires parentheses around negated conditions:
      // @container (not style(--x)) and style(--y) - NOT @container not style(--x) and style(--y)
      const conditionParts = conditions.map((c) =>
        c.negated ? `(not ${c.condition})` : c.condition,
      );
      const namePrefix = name ? `${name} ` : '';
      atRules.push(`@container ${namePrefix}${conditionParts.join(' and ')}`);
    }
  }

  // Add supports rules - combine all conditions with "and"
  if (variant.supportsConditions.length > 0) {
    const conditionParts = variant.supportsConditions.map((c) => {
      // Build the condition based on subtype
      // feature: (display: grid) or (not (display: grid))
      // selector: selector(:has(*)) or (not selector(:has(*)))
      if (c.subtype === 'selector') {
        const selectorCond = `selector(${c.condition})`;
        return c.negated ? `(not ${selectorCond})` : selectorCond;
      } else {
        const featureCond = `(${c.condition})`;
        return c.negated ? `(not ${featureCond})` : featureCond;
      }
    });
    atRules.push(`@supports ${conditionParts.join(' and ')}`);
  }

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
function materializeRule(
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

    const rootPrefix = rootConditionsToCSS(variants[0].rootConditions);
    if (rootPrefix) {
      rule.rootPrefix = rootPrefix;
    }

    rules.push(rule);
  }

  return rules;
}
