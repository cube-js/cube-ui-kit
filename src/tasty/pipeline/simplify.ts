/**
 * Condition Simplification Engine
 *
 * Simplifies condition trees by applying boolean algebra rules,
 * detecting contradictions, merging ranges, and deduplicating terms.
 *
 * This is critical for:
 * 1. Detecting invalid combinations (A & !A → FALSE)
 * 2. Reducing CSS output size
 * 3. Producing cleaner selectors
 */

import { Lru } from '../parser/lru';

import {
  and,
  ConditionNode,
  ContainerCondition,
  falseCondition,
  getConditionUniqueId,
  MediaCondition,
  ModifierCondition,
  not,
  NumericBound,
  or,
  StateCondition,
  trueCondition,
} from './conditions';

// ============================================================================
// Caching
// ============================================================================

const simplifyCache = new Lru<string, ConditionNode>(5000);

// ============================================================================
// Main Simplify Function
// ============================================================================

/**
 * Simplify a condition tree aggressively.
 *
 * This applies all possible simplification rules:
 * - Boolean algebra (identity, annihilator, idempotent, absorption)
 * - Contradiction detection (A & !A → FALSE)
 * - Tautology detection (A | !A → TRUE)
 * - Range intersection for numeric queries
 * - Attribute value conflict detection
 * - Deduplication and sorting
 */
export function simplifyCondition(node: ConditionNode): ConditionNode {
  // Check cache
  const key = getConditionUniqueId(node);
  const cached = simplifyCache.get(key);
  if (cached) {
    return cached;
  }

  const result = simplifyInner(node);

  // Cache result
  simplifyCache.set(key, result);

  return result;
}

/**
 * Clear the simplify cache (for testing)
 */
export function clearSimplifyCache(): void {
  simplifyCache.clear();
}

// ============================================================================
// Inner Simplification
// ============================================================================

function simplifyInner(node: ConditionNode): ConditionNode {
  // Base cases
  if (node.kind === 'true' || node.kind === 'false') {
    return node;
  }

  // State conditions - return as-is (they're already leaf nodes)
  if (node.kind === 'state') {
    return node;
  }

  // Compound conditions - recursively simplify
  if (node.kind === 'compound') {
    // First, recursively simplify all children
    const simplifiedChildren = node.children.map((c) => simplifyInner(c));

    // Then apply compound-specific simplifications
    if (node.operator === 'AND') {
      return simplifyAnd(simplifiedChildren);
    } else {
      return simplifyOr(simplifiedChildren);
    }
  }

  return node;
}

// ============================================================================
// AND Simplification
// ============================================================================

function simplifyAnd(children: ConditionNode[]): ConditionNode {
  let terms: ConditionNode[] = [];

  // Flatten nested ANDs and handle TRUE/FALSE
  for (const child of children) {
    if (child.kind === 'false') {
      // AND with FALSE → FALSE
      return falseCondition();
    }
    if (child.kind === 'true') {
      // AND with TRUE → skip (identity)
      continue;
    }
    if (child.kind === 'compound' && child.operator === 'AND') {
      // Flatten nested AND
      terms.push(...child.children);
    } else {
      terms.push(child);
    }
  }

  // Empty → TRUE
  if (terms.length === 0) {
    return trueCondition();
  }

  // Single term → return it
  if (terms.length === 1) {
    return terms[0];
  }

  // Check for contradictions
  if (hasContradiction(terms)) {
    return falseCondition();
  }

  // Check for range contradictions in media/container queries
  if (hasRangeContradiction(terms)) {
    return falseCondition();
  }

  // Check for attribute value conflicts
  if (hasAttributeConflict(terms)) {
    return falseCondition();
  }

  // Check for container style query conflicts
  if (hasContainerStyleConflict(terms)) {
    return falseCondition();
  }

  // Remove redundant negations implied by positive terms
  // e.g., style(--variant: danger) implies NOT style(--variant: success)
  // and style(--variant: danger) implies style(--variant) (existence)
  terms = removeImpliedNegations(terms);

  // Deduplicate (by uniqueId)
  terms = deduplicateTerms(terms);

  // Try to merge numeric ranges
  terms = mergeRanges(terms);

  // Sort for canonical form
  terms = sortTerms(terms);

  // Apply absorption: A & (A | B) → A
  terms = applyAbsorptionAnd(terms);

  if (terms.length === 0) {
    return trueCondition();
  }
  if (terms.length === 1) {
    return terms[0];
  }

  return {
    kind: 'compound',
    operator: 'AND',
    children: terms,
  };
}

// ============================================================================
// OR Simplification
// ============================================================================

function simplifyOr(children: ConditionNode[]): ConditionNode {
  let terms: ConditionNode[] = [];

  // Flatten nested ORs and handle TRUE/FALSE
  for (const child of children) {
    if (child.kind === 'true') {
      // OR with TRUE → TRUE
      return trueCondition();
    }
    if (child.kind === 'false') {
      // OR with FALSE → skip (identity)
      continue;
    }
    if (child.kind === 'compound' && child.operator === 'OR') {
      // Flatten nested OR
      terms.push(...child.children);
    } else {
      terms.push(child);
    }
  }

  // Empty → FALSE
  if (terms.length === 0) {
    return falseCondition();
  }

  // Single term → return it
  if (terms.length === 1) {
    return terms[0];
  }

  // Check for tautologies (A | !A)
  if (hasTautology(terms)) {
    return trueCondition();
  }

  // Deduplicate
  terms = deduplicateTerms(terms);

  // Sort for canonical form
  terms = sortTerms(terms);

  // Apply absorption: A | (A & B) → A
  terms = applyAbsorptionOr(terms);

  if (terms.length === 0) {
    return falseCondition();
  }
  if (terms.length === 1) {
    return terms[0];
  }

  return {
    kind: 'compound',
    operator: 'OR',
    children: terms,
  };
}

// ============================================================================
// Contradiction Detection
// ============================================================================

/**
 * Check if any term contradicts another (A & !A)
 */
function hasContradiction(terms: ConditionNode[]): boolean {
  const uniqueIds = new Set<string>();

  for (const term of terms) {
    if (term.kind !== 'state') continue;

    const id = term.uniqueId;
    // Check if negation exists
    const negatedId = term.negated ? id.slice(1) : `!${id}`;

    if (uniqueIds.has(negatedId)) {
      return true;
    }
    uniqueIds.add(id);
  }

  return false;
}

/**
 * Check for tautologies (A | !A)
 */
function hasTautology(terms: ConditionNode[]): boolean {
  const uniqueIds = new Set<string>();

  for (const term of terms) {
    if (term.kind !== 'state') continue;

    const id = term.uniqueId;
    const negatedId = term.negated ? id.slice(1) : `!${id}`;

    if (uniqueIds.has(negatedId)) {
      return true;
    }
    uniqueIds.add(id);
  }

  return false;
}

// ============================================================================
// Range Contradiction Detection
// ============================================================================

/**
 * Effective bounds computed from conditions (including negated single-bound conditions)
 */
interface EffectiveBounds {
  lowerBound: number | null;
  lowerInclusive: boolean;
  upperBound: number | null;
  upperInclusive: boolean;
}

/**
 * Excluded range from a negated range condition
 */
interface ExcludedRange {
  lower: number;
  lowerInclusive: boolean;
  upper: number;
  upperInclusive: boolean;
}

/**
 * Check for range contradictions in media/container queries
 * e.g., @media(w < 400px) & @media(w > 800px) → FALSE
 *
 * Also handles negated conditions:
 * - Single-bound negations are inverted (not (w < 600px) → w >= 600px)
 * - Range negations create excluded ranges that are checked against positive bounds
 */
function hasRangeContradiction(terms: ConditionNode[]): boolean {
  // Group by dimension, separating positive and negated conditions
  const mediaByDim = new Map<
    string,
    { positive: MediaCondition[]; negated: MediaCondition[] }
  >();
  const containerByDim = new Map<
    string,
    { positive: ContainerCondition[]; negated: ContainerCondition[] }
  >();

  for (const term of terms) {
    if (term.kind !== 'state') continue;

    if (term.type === 'media' && term.subtype === 'dimension') {
      const key = term.dimension || 'width';
      if (!mediaByDim.has(key)) {
        mediaByDim.set(key, { positive: [], negated: [] });
      }
      const group = mediaByDim.get(key)!;
      if (term.negated) {
        group.negated.push(term);
      } else {
        group.positive.push(term);
      }
    }

    if (term.type === 'container' && term.subtype === 'dimension') {
      const key = `${term.containerName || '_'}:${term.dimension || 'width'}`;
      if (!containerByDim.has(key)) {
        containerByDim.set(key, { positive: [], negated: [] });
      }
      const group = containerByDim.get(key)!;
      if (term.negated) {
        group.negated.push(term);
      } else {
        group.positive.push(term);
      }
    }
  }

  // Check each dimension group for impossible ranges
  for (const group of mediaByDim.values()) {
    if (rangesAreImpossibleWithNegations(group.positive, group.negated)) {
      return true;
    }
  }

  for (const group of containerByDim.values()) {
    if (rangesAreImpossibleWithNegations(group.positive, group.negated)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if conditions are impossible, including negated conditions.
 *
 * For negated single-bound conditions:
 *   not (w < 600px) → w >= 600px (inverted to lower bound)
 *   not (w >= 800px) → w < 800px (inverted to upper bound)
 *
 * For negated range conditions:
 *   not (400px <= w < 800px) → excludes [400, 800)
 *   If the effective bounds fall entirely within an excluded range, it's impossible.
 */
function rangesAreImpossibleWithNegations(
  positive: (MediaCondition | ContainerCondition)[],
  negated: (MediaCondition | ContainerCondition)[],
): boolean {
  // Start with bounds from positive conditions
  const bounds = computeEffectiveBounds(positive);

  // Apply inverted bounds from single-bound negated conditions
  // and collect excluded ranges from range negated conditions
  const excludedRanges: ExcludedRange[] = [];

  for (const cond of negated) {
    const hasLower = cond.lowerBound?.valueNumeric != null;
    const hasUpper = cond.upperBound?.valueNumeric != null;

    if (hasLower && hasUpper) {
      // Range negation: not (lower <= w < upper) excludes [lower, upper)
      excludedRanges.push({
        lower: cond.lowerBound!.valueNumeric!,
        lowerInclusive: cond.lowerBound!.inclusive,
        upper: cond.upperBound!.valueNumeric!,
        upperInclusive: cond.upperBound!.inclusive,
      });
    } else if (hasUpper) {
      // not (w < upper) → w >= upper (becomes lower bound)
      // not (w <= upper) → w > upper (becomes lower bound, exclusive)
      const value = cond.upperBound!.valueNumeric!;
      const inclusive = !cond.upperBound!.inclusive; // flip inclusivity

      if (bounds.lowerBound === null || value > bounds.lowerBound) {
        bounds.lowerBound = value;
        bounds.lowerInclusive = inclusive;
      } else if (value === bounds.lowerBound && !inclusive) {
        bounds.lowerInclusive = false;
      }
    } else if (hasLower) {
      // not (w >= lower) → w < lower (becomes upper bound)
      // not (w > lower) → w <= lower (becomes upper bound, inclusive)
      const value = cond.lowerBound!.valueNumeric!;
      const inclusive = !cond.lowerBound!.inclusive; // flip inclusivity

      if (bounds.upperBound === null || value < bounds.upperBound) {
        bounds.upperBound = value;
        bounds.upperInclusive = inclusive;
      } else if (value === bounds.upperBound && !inclusive) {
        bounds.upperInclusive = false;
      }
    }
  }

  // Check if effective bounds are impossible on their own
  if (bounds.lowerBound !== null && bounds.upperBound !== null) {
    if (bounds.lowerBound > bounds.upperBound) {
      return true;
    }
    if (
      bounds.lowerBound === bounds.upperBound &&
      (!bounds.lowerInclusive || !bounds.upperInclusive)
    ) {
      return true;
    }
  }

  // Check if effective bounds fall entirely within any excluded range
  if (
    bounds.lowerBound !== null &&
    bounds.upperBound !== null &&
    excludedRanges.length > 0
  ) {
    for (const excluded of excludedRanges) {
      if (boundsWithinExcludedRange(bounds, excluded)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Compute effective bounds from positive (non-negated) conditions
 */
function computeEffectiveBounds(
  conditions: (MediaCondition | ContainerCondition)[],
): EffectiveBounds {
  let lowerBound: number | null = null;
  let lowerInclusive = false;
  let upperBound: number | null = null;
  let upperInclusive = false;

  for (const cond of conditions) {
    if (cond.lowerBound?.valueNumeric != null) {
      const value = cond.lowerBound.valueNumeric;
      const inclusive = cond.lowerBound.inclusive;

      if (lowerBound === null || value > lowerBound) {
        lowerBound = value;
        lowerInclusive = inclusive;
      } else if (value === lowerBound && !inclusive) {
        lowerInclusive = false;
      }
    }

    if (cond.upperBound?.valueNumeric != null) {
      const value = cond.upperBound.valueNumeric;
      const inclusive = cond.upperBound.inclusive;

      if (upperBound === null || value < upperBound) {
        upperBound = value;
        upperInclusive = inclusive;
      } else if (value === upperBound && !inclusive) {
        upperInclusive = false;
      }
    }
  }

  return { lowerBound, lowerInclusive, upperBound, upperInclusive };
}

/**
 * Check if effective bounds fall entirely within an excluded range.
 *
 * For example:
 *   Effective: [400, 800)
 *   Excluded:  [400, 800)
 *   → bounds fall entirely within excluded range → impossible
 */
function boundsWithinExcludedRange(
  bounds: EffectiveBounds,
  excluded: ExcludedRange,
): boolean {
  if (bounds.lowerBound === null || bounds.upperBound === null) {
    return false;
  }

  // Check if bounds.lower >= excluded.lower
  let lowerOk = false;
  if (bounds.lowerBound > excluded.lower) {
    lowerOk = true;
  } else if (bounds.lowerBound === excluded.lower) {
    // If excluded includes lower, and bounds includes or excludes lower, it's within
    // If excluded excludes lower, bounds must also exclude it to be within
    lowerOk = excluded.lowerInclusive || !bounds.lowerInclusive;
  }

  // Check if bounds.upper <= excluded.upper
  let upperOk = false;
  if (bounds.upperBound < excluded.upper) {
    upperOk = true;
  } else if (bounds.upperBound === excluded.upper) {
    // If excluded includes upper, and bounds includes or excludes upper, it's within
    // If excluded excludes upper, bounds must also exclude it to be within
    upperOk = excluded.upperInclusive || !bounds.upperInclusive;
  }

  return lowerOk && upperOk;
}

// ============================================================================
// Attribute Conflict Detection
// ============================================================================

/**
 * Check for attribute value conflicts
 * e.g., [data-theme="dark"] & [data-theme="light"] → FALSE
 * e.g., [data-theme="dark"] & ![data-theme] → FALSE
 */
function hasAttributeConflict(terms: ConditionNode[]): boolean {
  // Group modifiers by attribute
  const modifiersByAttr = new Map<
    string,
    { positive: ModifierCondition[]; negated: ModifierCondition[] }
  >();

  for (const term of terms) {
    if (term.kind !== 'state' || term.type !== 'modifier') continue;

    const attr = term.attribute;
    if (!modifiersByAttr.has(attr)) {
      modifiersByAttr.set(attr, { positive: [], negated: [] });
    }

    const group = modifiersByAttr.get(attr)!;
    if (term.negated) {
      group.negated.push(term);
    } else {
      group.positive.push(term);
    }
  }

  // Check each attribute for conflicts
  for (const [attr, group] of modifiersByAttr) {
    // Multiple different values for same attribute in positive → conflict
    const positiveValues = group.positive
      .filter((m) => m.value !== undefined)
      .map((m) => m.value);
    const uniquePositiveValues = new Set(positiveValues);
    if (uniquePositiveValues.size > 1) {
      return true;
    }

    // Positive value + negated boolean for same attribute → conflict
    // e.g., [data-theme="dark"] & ![data-theme]
    const hasPositiveValue = group.positive.some((m) => m.value !== undefined);
    const hasNegatedBoolean = group.negated.some((m) => m.value === undefined);
    if (hasPositiveValue && hasNegatedBoolean) {
      return true;
    }

    // Positive boolean + negated value (same value) → tautology not conflict
    // But positive value + negated same value → conflict
    for (const pos of group.positive) {
      if (pos.value !== undefined) {
        for (const neg of group.negated) {
          if (neg.value === pos.value) {
            return true; // [data-x="y"] & ![data-x="y"]
          }
        }
      }
    }
  }

  return false;
}

// ============================================================================
// Container Style Query Conflict Detection
// ============================================================================

/**
 * Check for container style query conflicts
 * e.g., style(--variant: danger) & style(--variant: success) → FALSE
 * e.g., style(--variant: danger) & not style(--variant) → FALSE
 */
function hasContainerStyleConflict(terms: ConditionNode[]): boolean {
  // Group container style queries by property (and container name)
  const styleByProp = new Map<
    string,
    { positive: ContainerCondition[]; negated: ContainerCondition[] }
  >();

  for (const term of terms) {
    if (
      term.kind !== 'state' ||
      term.type !== 'container' ||
      term.subtype !== 'style'
    )
      continue;

    const key = `${term.containerName || '_'}:${term.property}`;
    if (!styleByProp.has(key)) {
      styleByProp.set(key, { positive: [], negated: [] });
    }

    const group = styleByProp.get(key)!;
    if (term.negated) {
      group.negated.push(term);
    } else {
      group.positive.push(term);
    }
  }

  // Check each property for conflicts
  for (const [, group] of styleByProp) {
    // Multiple different values for same property in positive → conflict
    // e.g., style(--variant: danger) & style(--variant: success)
    const positiveValues = group.positive
      .filter((c) => c.propertyValue !== undefined)
      .map((c) => c.propertyValue);
    const uniquePositiveValues = new Set(positiveValues);
    if (uniquePositiveValues.size > 1) {
      return true;
    }

    // Positive value + negated existence → conflict
    // e.g., style(--variant: danger) & not style(--variant)
    const hasPositiveValue = group.positive.some(
      (c) => c.propertyValue !== undefined,
    );
    const hasNegatedExistence = group.negated.some(
      (c) => c.propertyValue === undefined,
    );
    if (hasPositiveValue && hasNegatedExistence) {
      return true;
    }

    // Positive value + negated same value → conflict
    // e.g., style(--variant: danger) & not style(--variant: danger)
    for (const pos of group.positive) {
      if (pos.propertyValue !== undefined) {
        for (const neg of group.negated) {
          if (neg.propertyValue === pos.propertyValue) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

// ============================================================================
// Implied Negation Removal
// ============================================================================

/**
 * Remove negations that are implied by positive terms.
 *
 * Key optimizations:
 * 1. style(--variant: danger) implies NOT style(--variant: success)
 *    → If we have style(--variant: danger) & not style(--variant: success),
 *      the negation is redundant and can be removed.
 *
 * 2. [data-theme="dark"] implies NOT [data-theme="light"]
 *    → Same logic for attribute selectors.
 *
 * This produces cleaner CSS:
 *   Before: @container style(--variant: danger) and (not style(--variant: success))
 *   After:  @container style(--variant: danger)
 */
function removeImpliedNegations(terms: ConditionNode[]): ConditionNode[] {
  // Build sets of positive container style properties with specific values
  const positiveContainerStyles = new Map<string, string | undefined>();
  // key: "containerName:property", value: propertyValue (or undefined for existence)

  // Build sets of positive modifier attributes with specific values
  const positiveModifiers = new Map<string, string | undefined>();
  // key: "attribute", value: value (or undefined for boolean)

  for (const term of terms) {
    if (term.kind !== 'state' || term.negated) continue;

    if (term.type === 'container' && term.subtype === 'style') {
      const key = `${term.containerName || '_'}:${term.property}`;
      // Only track if we have a specific value (not just existence check)
      if (term.propertyValue !== undefined) {
        positiveContainerStyles.set(key, term.propertyValue);
      }
    }

    if (term.type === 'modifier' && term.value !== undefined) {
      positiveModifiers.set(term.attribute, term.value);
    }
  }

  // Filter out redundant negations
  return terms.filter((term) => {
    if (term.kind !== 'state' || !term.negated) return true;

    // Check container style negations
    if (term.type === 'container' && term.subtype === 'style') {
      const key = `${term.containerName || '_'}:${term.property}`;
      const positiveValue = positiveContainerStyles.get(key);

      if (positiveValue !== undefined) {
        // We have a positive style(--prop: X) for this property

        if (term.propertyValue === undefined) {
          // Negating existence: not style(--prop)
          // But we have style(--prop: X), which implies existence → contradiction
          // This should have been caught by hasContainerStyleConflict
          return true;
        }

        if (term.propertyValue !== positiveValue) {
          // Negating a different value: not style(--prop: Y)
          // We have style(--prop: X), which implies not style(--prop: Y)
          // → This negation is redundant!
          return false;
        }
      }
    }

    // Check modifier negations
    if (term.type === 'modifier') {
      const positiveValue = positiveModifiers.get(term.attribute);

      if (positiveValue !== undefined && term.value !== undefined) {
        // We have [attr="X"] and this is not [attr="Y"]
        if (term.value !== positiveValue) {
          // [attr="X"] implies not [attr="Y"] → redundant
          return false;
        }
      }
    }

    return true;
  });
}

// ============================================================================
// Deduplication
// ============================================================================

function deduplicateTerms(terms: ConditionNode[]): ConditionNode[] {
  const seen = new Set<string>();
  const result: ConditionNode[] = [];

  for (const term of terms) {
    const id = getConditionUniqueId(term);
    if (!seen.has(id)) {
      seen.add(id);
      result.push(term);
    }
  }

  return result;
}

// ============================================================================
// Range Merging
// ============================================================================

/**
 * Merge compatible range conditions
 * e.g., @media(w >= 400px) & @media(w <= 800px) → @media(400px <= w <= 800px)
 */
function mergeRanges(terms: ConditionNode[]): ConditionNode[] {
  // Group media conditions by dimension
  const mediaByDim = new Map<
    string,
    { conditions: MediaCondition[]; indices: number[] }
  >();
  const containerByDim = new Map<
    string,
    { conditions: ContainerCondition[]; indices: number[] }
  >();

  terms.forEach((term, index) => {
    if (term.kind !== 'state') return;

    if (
      term.type === 'media' &&
      term.subtype === 'dimension' &&
      !term.negated
    ) {
      const key = term.dimension || 'width';
      if (!mediaByDim.has(key)) {
        mediaByDim.set(key, { conditions: [], indices: [] });
      }
      const group = mediaByDim.get(key)!;
      group.conditions.push(term);
      group.indices.push(index);
    }

    if (
      term.type === 'container' &&
      term.subtype === 'dimension' &&
      !term.negated
    ) {
      const key = `${term.containerName || '_'}:${term.dimension || 'width'}`;
      if (!containerByDim.has(key)) {
        containerByDim.set(key, { conditions: [], indices: [] });
      }
      const group = containerByDim.get(key)!;
      group.conditions.push(term);
      group.indices.push(index);
    }
  });

  // Track indices to remove
  const indicesToRemove = new Set<number>();
  const mergedTerms: ConditionNode[] = [];

  // Merge media conditions
  for (const [dim, group] of mediaByDim) {
    if (group.conditions.length > 1) {
      const merged = mergeMediaRanges(group.conditions);
      if (merged) {
        group.indices.forEach((i) => indicesToRemove.add(i));
        mergedTerms.push(merged);
      }
    }
  }

  // Merge container conditions
  for (const [, group] of containerByDim) {
    if (group.conditions.length > 1) {
      const merged = mergeContainerRanges(group.conditions);
      if (merged) {
        group.indices.forEach((i) => indicesToRemove.add(i));
        mergedTerms.push(merged);
      }
    }
  }

  // Build result
  const result: ConditionNode[] = [];
  terms.forEach((term, index) => {
    if (!indicesToRemove.has(index)) {
      result.push(term);
    }
  });
  result.push(...mergedTerms);

  return result;
}

function mergeMediaRanges(conditions: MediaCondition[]): MediaCondition | null {
  if (conditions.length === 0) return null;

  let lowerBound: NumericBound | undefined;
  let upperBound: NumericBound | undefined;

  for (const cond of conditions) {
    if (cond.lowerBound) {
      if (
        !lowerBound ||
        (cond.lowerBound.valueNumeric ?? -Infinity) >
          (lowerBound.valueNumeric ?? -Infinity)
      ) {
        lowerBound = cond.lowerBound;
      }
    }
    if (cond.upperBound) {
      if (
        !upperBound ||
        (cond.upperBound.valueNumeric ?? Infinity) <
          (upperBound.valueNumeric ?? Infinity)
      ) {
        upperBound = cond.upperBound;
      }
    }
  }

  const base = conditions[0];

  // Build a merged condition
  const merged: MediaCondition = {
    kind: 'state',
    type: 'media',
    subtype: 'dimension',
    negated: false,
    raw: buildMergedRaw(base.dimension || 'width', lowerBound, upperBound),
    uniqueId: '', // Will be recalculated
    dimension: base.dimension,
    lowerBound,
    upperBound,
  };

  // Recalculate uniqueId
  const parts = ['media', 'dim', merged.dimension];
  if (lowerBound) {
    parts.push(lowerBound.inclusive ? '>=' : '>');
    parts.push(lowerBound.value);
  }
  if (upperBound) {
    parts.push(upperBound.inclusive ? '<=' : '<');
    parts.push(upperBound.value);
  }
  merged.uniqueId = parts.join(':');

  return merged;
}

function mergeContainerRanges(
  conditions: ContainerCondition[],
): ContainerCondition | null {
  if (conditions.length === 0) return null;

  let lowerBound: NumericBound | undefined;
  let upperBound: NumericBound | undefined;

  for (const cond of conditions) {
    if (cond.lowerBound) {
      if (
        !lowerBound ||
        (cond.lowerBound.valueNumeric ?? -Infinity) >
          (lowerBound.valueNumeric ?? -Infinity)
      ) {
        lowerBound = cond.lowerBound;
      }
    }
    if (cond.upperBound) {
      if (
        !upperBound ||
        (cond.upperBound.valueNumeric ?? Infinity) <
          (upperBound.valueNumeric ?? Infinity)
      ) {
        upperBound = cond.upperBound;
      }
    }
  }

  const base = conditions[0];

  const merged: ContainerCondition = {
    kind: 'state',
    type: 'container',
    subtype: 'dimension',
    negated: false,
    raw: buildMergedRaw(base.dimension || 'width', lowerBound, upperBound),
    uniqueId: '', // Will be recalculated
    containerName: base.containerName,
    dimension: base.dimension,
    lowerBound,
    upperBound,
  };

  // Recalculate uniqueId
  const name = merged.containerName || '_';
  const parts = ['container', 'dim', name, merged.dimension];
  if (lowerBound) {
    parts.push(lowerBound.inclusive ? '>=' : '>');
    parts.push(lowerBound.value);
  }
  if (upperBound) {
    parts.push(upperBound.inclusive ? '<=' : '<');
    parts.push(upperBound.value);
  }
  merged.uniqueId = parts.join(':');

  return merged;
}

function buildMergedRaw(
  dimension: string,
  lowerBound?: NumericBound,
  upperBound?: NumericBound,
): string {
  if (lowerBound && upperBound) {
    const lowerOp = lowerBound.inclusive ? '<=' : '<';
    const upperOp = upperBound.inclusive ? '<=' : '<';
    return `@media(${lowerBound.value} ${lowerOp} ${dimension} ${upperOp} ${upperBound.value})`;
  } else if (upperBound) {
    const op = upperBound.inclusive ? '<=' : '<';
    return `@media(${dimension} ${op} ${upperBound.value})`;
  } else if (lowerBound) {
    const op = lowerBound.inclusive ? '>=' : '>';
    return `@media(${dimension} ${op} ${lowerBound.value})`;
  }
  return '@media()';
}

// ============================================================================
// Sorting
// ============================================================================

function sortTerms(terms: ConditionNode[]): ConditionNode[] {
  return [...terms].sort((a, b) => {
    const idA = getConditionUniqueId(a);
    const idB = getConditionUniqueId(b);
    return idA.localeCompare(idB);
  });
}

// ============================================================================
// Absorption
// ============================================================================

/**
 * Apply absorption law for AND: A & (A | B) → A
 */
function applyAbsorptionAnd(terms: ConditionNode[]): ConditionNode[] {
  // Collect all unique IDs of simple terms
  const simpleIds = new Set<string>();
  for (const term of terms) {
    if (term.kind !== 'compound') {
      simpleIds.add(getConditionUniqueId(term));
    }
  }

  // Filter out OR terms that are absorbed
  return terms.filter((term) => {
    if (term.kind === 'compound' && term.operator === 'OR') {
      // If any child of this OR is in simpleIds, absorb the whole OR
      for (const child of term.children) {
        if (simpleIds.has(getConditionUniqueId(child))) {
          return false; // Absorb
        }
      }
    }
    return true;
  });
}

/**
 * Apply absorption law for OR: A | (A & B) → A
 */
function applyAbsorptionOr(terms: ConditionNode[]): ConditionNode[] {
  // Collect all unique IDs of simple terms
  const simpleIds = new Set<string>();
  for (const term of terms) {
    if (term.kind !== 'compound') {
      simpleIds.add(getConditionUniqueId(term));
    }
  }

  // Filter out AND terms that are absorbed
  return terms.filter((term) => {
    if (term.kind === 'compound' && term.operator === 'AND') {
      // If any child of this AND is in simpleIds, absorb the whole AND
      for (const child of term.children) {
        if (simpleIds.has(getConditionUniqueId(child))) {
          return false; // Absorb
        }
      }
    }
    return true;
  });
}
