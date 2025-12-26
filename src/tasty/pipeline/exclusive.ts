/**
 * Exclusive Condition Builder
 *
 * Transforms parsed style entries into exclusive conditions.
 * Each entry's condition is ANDed with the negation of all higher-priority conditions,
 * ensuring exactly one condition matches at any given time.
 */

import { StyleValue } from '../utils/styles';

import { and, ConditionNode, not, trueCondition } from './conditions';
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
