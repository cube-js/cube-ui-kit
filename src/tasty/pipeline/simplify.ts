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
 * Check for range contradictions in media/container queries
 * e.g., @media(w < 400px) & @media(w > 800px) → FALSE
 */
function hasRangeContradiction(terms: ConditionNode[]): boolean {
  // Group by dimension
  const mediaByDim = new Map<string, MediaCondition[]>();
  const containerByDim = new Map<string, ContainerCondition[]>();

  for (const term of terms) {
    if (term.kind !== 'state') continue;

    if (
      term.type === 'media' &&
      term.subtype === 'dimension' &&
      !term.negated
    ) {
      const key = term.dimension || 'width';
      if (!mediaByDim.has(key)) {
        mediaByDim.set(key, []);
      }
      mediaByDim.get(key)!.push(term);
    }

    if (
      term.type === 'container' &&
      term.subtype === 'dimension' &&
      !term.negated
    ) {
      const key = `${term.containerName || '_'}:${term.dimension || 'width'}`;
      if (!containerByDim.has(key)) {
        containerByDim.set(key, []);
      }
      containerByDim.get(key)!.push(term);
    }
  }

  // Check each dimension group for impossible ranges
  for (const conditions of mediaByDim.values()) {
    if (rangesAreImpossible(conditions)) {
      return true;
    }
  }

  for (const conditions of containerByDim.values()) {
    if (rangesAreImpossible(conditions)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a set of range conditions are impossible to satisfy together
 */
function rangesAreImpossible(
  conditions: (MediaCondition | ContainerCondition)[],
): boolean {
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

  // Check if ranges are impossible
  if (lowerBound !== null && upperBound !== null) {
    if (lowerBound > upperBound) {
      return true;
    }
    if (lowerBound === upperBound && (!lowerInclusive || !upperInclusive)) {
      return true;
    }
  }

  return false;
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
