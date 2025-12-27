/**
 * Exclusive Condition Builder
 *
 * Transforms parsed style entries into exclusive conditions.
 * Each entry's condition is ANDed with the negation of all higher-priority conditions,
 * ensuring exactly one condition matches at any given time.
 */

import { StyleValue } from '../utils/styles';

import {
  and,
  ConditionNode,
  isCompoundCondition,
  not,
  trueCondition,
} from './conditions';
import { simplifyCondition } from './simplify';

// ============================================================================
// Types
// ============================================================================

/**
 * Parsed style entry with condition
 */
export interface ParsedStyleEntry {
  styleKey: string; // e.g., 'padding', 'fill'
  stateKey: string; // Original key: '', 'compact', '@media(w < 768px)'
  value: StyleValue; // The style value (before handler processing)
  condition: ConditionNode; // Parsed condition tree
  priority: number; // Order in original object (higher = higher priority)
}

/**
 * Style entry with exclusive condition
 */
export interface ExclusiveStyleEntry extends ParsedStyleEntry {
  exclusiveCondition: ConditionNode; // condition & !higherPriorityConditions
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Build exclusive conditions for a list of parsed style entries.
 *
 * The entries should be ordered by priority (highest priority first).
 *
 * For each entry, we compute:
 *   exclusiveCondition = condition & !prior[0] & !prior[1] & ...
 *
 * This ensures exactly one condition matches at any time.
 *
 * Example:
 *   Input (ordered highest to lowest priority):
 *     A: value1 (priority 2)
 *     B: value2 (priority 1)
 *     C: value3 (priority 0)
 *
 *   Output:
 *     A: A
 *     B: B & !A
 *     C: C & !A & !B
 *
 * @param entries Parsed style entries ordered by priority (highest first)
 * @returns Entries with exclusive conditions, filtered to remove impossible ones
 */
export function buildExclusiveConditions(
  entries: ParsedStyleEntry[],
): ExclusiveStyleEntry[] {
  const result: ExclusiveStyleEntry[] = [];
  const priorConditions: ConditionNode[] = [];

  for (const entry of entries) {
    // Build: condition & !prior[0] & !prior[1] & ...
    let exclusive: ConditionNode = entry.condition;

    for (const prior of priorConditions) {
      // Skip negating "always true" (default state) - it would become "always false"
      if (prior.kind !== 'true') {
        exclusive = and(exclusive, not(prior));
      }
    }

    // Simplify the exclusive condition
    const simplified = simplifyCondition(exclusive);

    // Skip impossible conditions (simplified to FALSE)
    if (simplified.kind === 'false') {
      continue;
    }

    result.push({
      ...entry,
      exclusiveCondition: simplified,
    });

    // Add non-default conditions to prior list for subsequent entries
    if (entry.condition.kind !== 'true') {
      priorConditions.push(entry.condition);
    }
  }

  return result;
}

/**
 * Parse style entries from a value mapping object.
 *
 * @param styleKey The style key (e.g., 'padding')
 * @param valueMap The value mapping { '': '2x', 'compact': '1x', '@media(w < 768px)': '0.5x' }
 * @param parseCondition Function to parse state keys into conditions
 * @returns Parsed entries ordered by priority (highest first)
 */
export function parseStyleEntries(
  styleKey: string,
  valueMap: Record<string, StyleValue>,
  parseCondition: (stateKey: string) => ConditionNode,
): ParsedStyleEntry[] {
  const entries: ParsedStyleEntry[] = [];
  const keys = Object.keys(valueMap);

  keys.forEach((stateKey, index) => {
    const value = valueMap[stateKey];
    const condition =
      stateKey === '' ? trueCondition() : parseCondition(stateKey);

    entries.push({
      styleKey,
      stateKey,
      value,
      condition,
      priority: index,
    });
  });

  // Reverse so highest priority (last in object) comes first for exclusive building
  // buildExclusiveConditions expects highest priority first
  entries.reverse();

  return entries;
}

/**
 * Check if a value is a style value mapping (object with state keys)
 */
export function isValueMapping(
  value: StyleValue | Record<string, StyleValue>,
): value is Record<string, StyleValue> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

// ============================================================================
// OR Expansion
// ============================================================================

/**
 * Expand OR conditions in parsed entries into multiple exclusive entries.
 *
 * For an entry with condition `A | B | C`, this creates 3 entries:
 *   - condition: A
 *   - condition: B & !A
 *   - condition: C & !A & !B
 *
 * This ensures OR branches are mutually exclusive BEFORE the main
 * exclusive condition building pass.
 *
 * @param entries Parsed entries (may contain OR conditions)
 * @returns Expanded entries with OR branches made exclusive
 */
export function expandOrConditions(
  entries: ParsedStyleEntry[],
): ParsedStyleEntry[] {
  const result: ParsedStyleEntry[] = [];

  for (const entry of entries) {
    const expanded = expandSingleEntry(entry);
    result.push(...expanded);
  }

  return result;
}

/**
 * Expand a single entry's OR condition into multiple exclusive entries
 */
function expandSingleEntry(entry: ParsedStyleEntry): ParsedStyleEntry[] {
  const orBranches = collectOrBranches(entry.condition);

  // If no OR (single branch), return as-is
  if (orBranches.length <= 1) {
    return [entry];
  }

  // Make each OR branch exclusive from prior branches
  const result: ParsedStyleEntry[] = [];
  const priorBranches: ConditionNode[] = [];

  for (let i = 0; i < orBranches.length; i++) {
    const branch = orBranches[i];

    // Build: branch & !prior[0] & !prior[1] & ...
    let exclusiveBranch: ConditionNode = branch;
    for (const prior of priorBranches) {
      exclusiveBranch = and(exclusiveBranch, not(prior));
    }

    // Simplify to detect impossible combinations
    const simplified = simplifyCondition(exclusiveBranch);

    // Skip impossible branches
    if (simplified.kind === 'false') {
      priorBranches.push(branch);
      continue;
    }

    result.push({
      ...entry,
      stateKey: `${entry.stateKey}[${i}]`, // Mark as expanded branch
      condition: simplified,
      // Keep same priority - all branches from same entry have same priority
    });

    priorBranches.push(branch);
  }

  return result;
}

/**
 * Collect top-level OR branches from a condition.
 *
 * For `A | B | C`, returns [A, B, C]
 * For `A & B`, returns [A & B] (single branch)
 * For `A | (B & C)`, returns [A, B & C]
 */
function collectOrBranches(condition: ConditionNode): ConditionNode[] {
  if (condition.kind === 'true' || condition.kind === 'false') {
    return [condition];
  }

  if (isCompoundCondition(condition) && condition.operator === 'OR') {
    // Flatten nested ORs
    const branches: ConditionNode[] = [];
    for (const child of condition.children) {
      branches.push(...collectOrBranches(child));
    }
    return branches;
  }

  // Not an OR - return as single branch
  return [condition];
}
