/**
 * Media Query Range Optimizer
 *
 * Detects overlapping media query ranges and generates non-overlapping CSS rules.
 * Ensures the default (no media query) rule is converted to a media query that
 * covers any "gap" in the dimension not covered by explicit media queries.
 *
 * Example:
 *   Input:
 *     @media(w <= 920px): '1fr'
 *     @media(w <= 1400px): '1fr 1fr'
 *     '': '1fr 1fr 1fr'
 *
 *   Output (non-overlapping):
 *     @media (width <= 920px): '1fr'
 *     @media (920px < width <= 1400px): '1fr 1fr'
 *     @media (width > 1400px): '1fr 1fr 1fr'
 */

export interface ParsedMediaCondition {
  dimension: string; // 'width' or 'height'
  operator: '<' | '<=' | '>' | '>=' | '=';
  value: string; // e.g., '920px', 'calc(var(--gap) * 40)'
  valueNumeric: number | null; // numeric value for comparison, null if not parseable
  raw: string; // original condition string
}

export interface ParsedRangeCondition {
  dimension: string;
  lower: { value: string; valueNumeric: number | null; inclusive: boolean };
  upper: { value: string; valueNumeric: number | null; inclusive: boolean };
  raw: string;
}

export type ParsedCondition =
  | { type: 'simple'; condition: ParsedMediaCondition }
  | { type: 'range'; condition: ParsedRangeCondition };

/**
 * Parse a media condition - handles both simple and range syntax
 */
export function parseMediaCondition(condition: string): ParsedCondition | null {
  // Match range syntax first: "920px < width <= 1400px" or "600px <= width < 900px"
  const rangeMatch = condition.match(
    /^(.+?)\s*(<=|<)\s*(width|height)\s*(<=|<)\s*(.+)$/,
  );
  if (rangeMatch) {
    const [, lowerValue, lowerOp, dimension, upperOp, upperValue] = rangeMatch;
    return {
      type: 'range',
      condition: {
        dimension,
        lower: {
          value: lowerValue.trim(),
          valueNumeric: parseNumericValue(lowerValue.trim()),
          inclusive: lowerOp === '<=',
        },
        upper: {
          value: upperValue.trim(),
          valueNumeric: parseNumericValue(upperValue.trim()),
          inclusive: upperOp === '<=',
        },
        raw: condition,
      },
    };
  }

  // Match simple pattern: "width <= 920px", "width < 600px", "width >= 1024px"
  const simpleMatch = condition.match(
    /^(width|height)\s*(<=|>=|<|>|=)\s*(.+)$/,
  );
  if (simpleMatch) {
    const [, dimension, operator, value] = simpleMatch;
    return {
      type: 'simple',
      condition: {
        dimension,
        operator: operator as ParsedMediaCondition['operator'],
        value: value.trim(),
        valueNumeric: parseNumericValue(value.trim()),
        raw: condition,
      },
    };
  }

  // Match reversed simple: "920px <= width"
  const reversedMatch = condition.match(
    /^(.+?)\s*(<=|>=|<|>|=)\s*(width|height)$/,
  );
  if (reversedMatch) {
    const [, value, operator, dimension] = reversedMatch;
    const reversedOp = reverseOperator(
      operator as ParsedMediaCondition['operator'],
    );
    return {
      type: 'simple',
      condition: {
        dimension,
        operator: reversedOp,
        value: value.trim(),
        valueNumeric: parseNumericValue(value.trim()),
        raw: condition,
      },
    };
  }

  // Too complex to optimize
  return null;
}

function reverseOperator(
  op: ParsedMediaCondition['operator'],
): ParsedMediaCondition['operator'] {
  switch (op) {
    case '<':
      return '>';
    case '<=':
      return '>=';
    case '>':
      return '<';
    case '>=':
      return '<=';
    default:
      return op;
  }
}

function parseNumericValue(value: string): number | null {
  const match = value.match(/^(\d+(?:\.\d+)?)(px|em|rem|vh|vw|%)?$/);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

interface Breakpoint {
  value: number;
  valueStr: string;
  inclusive: boolean; // true for <=, >=; false for <, >
  type: 'lower' | 'upper';
  stateKey: string;
}

/**
 * Compute the media query for the default rule based on gaps in coverage
 */
function computeDefaultMediaQuery(
  breakpoints: Breakpoint[],
  dimension: string,
): string | null {
  if (breakpoints.length === 0) return null;

  // Sort breakpoints by value
  const sorted = [...breakpoints].sort((a, b) => a.value - b.value);

  // Find the lowest upper bound and highest lower bound
  let lowestUpperBound: Breakpoint | null = null;
  let highestLowerBound: Breakpoint | null = null;

  for (const bp of sorted) {
    if (bp.type === 'upper') {
      if (!lowestUpperBound || bp.value < lowestUpperBound.value) {
        lowestUpperBound = bp;
      }
    } else {
      if (!highestLowerBound || bp.value > highestLowerBound.value) {
        highestLowerBound = bp;
      }
    }
  }

  // If we only have upper bounds, default is > highest upper bound
  if (lowestUpperBound && !highestLowerBound) {
    const op = lowestUpperBound.inclusive ? '>' : '>=';
    // Find the highest upper bound
    let highest = lowestUpperBound;
    for (const bp of sorted) {
      if (bp.type === 'upper' && bp.value > highest.value) {
        highest = bp;
      }
    }
    return `(${dimension} ${highest.inclusive ? '>' : '>='} ${highest.valueStr})`;
  }

  // If we only have lower bounds, default is < lowest lower bound
  if (highestLowerBound && !lowestUpperBound) {
    // Find the lowest lower bound
    let lowest = highestLowerBound;
    for (const bp of sorted) {
      if (bp.type === 'lower' && bp.value < lowest.value) {
        lowest = bp;
      }
    }
    const op = lowest.inclusive ? '<' : '<=';
    return `(${dimension} ${op} ${lowest.valueStr})`;
  }

  // If we have both, check for gaps
  if (lowestUpperBound && highestLowerBound) {
    // If the upper bounds and lower bounds meet or overlap, there's no gap
    // for the default - this shouldn't happen if ranges cover everything

    // Find the lowest value that's not covered
    // This is complex - for now, return the gap below the lowest lower bound
    let lowestLower = highestLowerBound;
    for (const bp of sorted) {
      if (bp.type === 'lower' && bp.value < lowestLower.value) {
        lowestLower = bp;
      }
    }
    const op = lowestLower.inclusive ? '<' : '<=';
    return `(${dimension} ${op} ${lowestLower.valueStr})`;
  }

  return null;
}

/**
 * Optimize overlapping upper-bound media queries
 */
function optimizeUpperBounds(
  entries: Array<{
    key: string;
    value: number;
    valueStr: string;
    inclusive: boolean;
  }>,
  defaultKey: string | null,
  dimension: string,
): Map<string, string> {
  // Sort by value ascending
  const sorted = [...entries].sort((a, b) => a.value - b.value);

  const result = new Map<string, string>();

  let prevValue: string | null = null;
  let prevInclusive = false;

  for (const entry of sorted) {
    if (prevValue === null) {
      // First (smallest) upper bound - no lower bound needed
      const op = entry.inclusive ? '<=' : '<';
      result.set(entry.key, `@media (${dimension} ${op} ${entry.valueStr})`);
    } else {
      // Subsequent upper bounds - add lower bound to make non-overlapping
      const lowerOp = prevInclusive ? '>' : '>=';
      const upperOp = entry.inclusive ? '<=' : '<';
      result.set(
        entry.key,
        `@media (${prevValue} ${lowerOp === '>' ? '<' : '<='} ${dimension} ${upperOp} ${entry.valueStr})`,
      );
    }

    prevValue = entry.valueStr;
    prevInclusive = entry.inclusive;
  }

  // Default gets the range above the highest upper bound
  if (defaultKey !== null && prevValue !== null) {
    const op = prevInclusive ? '>' : '>=';
    result.set(defaultKey, `@media (${dimension} ${op} ${prevValue})`);
  }

  return result;
}

/**
 * Optimize overlapping lower-bound media queries
 */
function optimizeLowerBounds(
  entries: Array<{
    key: string;
    value: number;
    valueStr: string;
    inclusive: boolean;
  }>,
  defaultKey: string | null,
  dimension: string,
): Map<string, string> {
  // Sort by value descending (highest first)
  const sorted = [...entries].sort((a, b) => b.value - a.value);

  const result = new Map<string, string>();

  let prevValue: string | null = null;
  let prevInclusive = false;

  for (const entry of sorted) {
    if (prevValue === null) {
      // First (largest) lower bound - no upper bound needed
      const op = entry.inclusive ? '>=' : '>';
      result.set(entry.key, `@media (${dimension} ${op} ${entry.valueStr})`);
    } else {
      // Subsequent lower bounds - add upper bound to make non-overlapping
      const lowerOp = entry.inclusive ? '<=' : '<';
      const upperOp = prevInclusive ? '<' : '<=';
      result.set(
        entry.key,
        `@media (${entry.valueStr} ${lowerOp} ${dimension} ${upperOp} ${prevValue})`,
      );
    }

    prevValue = entry.valueStr;
    prevInclusive = entry.inclusive;
  }

  // Default gets the range below the lowest lower bound
  if (defaultKey !== null && prevValue !== null) {
    const op = prevInclusive ? '<' : '<=';
    result.set(defaultKey, `@media (${dimension} ${op} ${prevValue})`);
  }

  return result;
}

export interface MediaRange {
  condition: string;
}

/**
 * Generate a CSS media condition from an OptimizedRange
 */
export function rangeToMediaCondition(
  range: {
    lower?: { value: string; inclusive: boolean };
    upper?: { value: string; inclusive: boolean };
  },
  dimension: string,
): string {
  const { lower, upper } = range;

  if (lower && upper) {
    const lowerOp = lower.inclusive ? '<=' : '<';
    const upperOp = upper.inclusive ? '<=' : '<';
    return `(${lower.value} ${lowerOp} ${dimension} ${upperOp} ${upper.value})`;
  } else if (upper) {
    const op = upper.inclusive ? '<=' : '<';
    return `(${dimension} ${op} ${upper.value})`;
  } else if (lower) {
    const op = lower.inclusive ? '>=' : '>';
    return `(${dimension} ${op} ${lower.value})`;
  }

  return '';
}

export interface OptimizedRange {
  lower?: { value: string; inclusive: boolean };
  upper?: { value: string; inclusive: boolean };
  stateKey: string;
}

/**
 * Compute non-overlapping ranges from parsed conditions
 */
export function computeNonOverlappingRanges(
  mediaConditions: Map<string, ParsedMediaCondition>,
  defaultStateKey: string | null,
): OptimizedRange[] {
  // Group by dimension
  const byDimension = new Map<
    string,
    { key: string; cond: ParsedMediaCondition }[]
  >();

  for (const [key, cond] of mediaConditions) {
    const dim = cond.dimension;
    if (!byDimension.has(dim)) {
      byDimension.set(dim, []);
    }
    byDimension.get(dim)!.push({ key, cond });
  }

  const ranges: OptimizedRange[] = [];

  for (const [dimension, entries] of byDimension) {
    const upperBounds = entries.filter(
      (e) => e.cond.operator === '<=' || e.cond.operator === '<',
    );
    const lowerBounds = entries.filter(
      (e) => e.cond.operator === '>=' || e.cond.operator === '>',
    );

    if (
      upperBounds.length === entries.length &&
      upperBounds.every((e) => e.cond.valueNumeric !== null)
    ) {
      // All are upper bounds
      upperBounds.sort((a, b) => a.cond.valueNumeric! - b.cond.valueNumeric!);

      let prevValue: string | null = null;
      let prevInclusive = false;

      for (const { key, cond } of upperBounds) {
        const inclusive = cond.operator === '<=';
        const range: OptimizedRange = {
          upper: { value: cond.value, inclusive },
          stateKey: key,
        };

        if (prevValue !== null) {
          range.lower = { value: prevValue, inclusive: !prevInclusive };
        }

        ranges.push(range);
        prevValue = cond.value;
        prevInclusive = inclusive;
      }

      if (defaultStateKey !== null && prevValue !== null) {
        ranges.push({
          lower: { value: prevValue, inclusive: !prevInclusive },
          stateKey: defaultStateKey,
        });
      }
    } else if (
      lowerBounds.length === entries.length &&
      lowerBounds.every((e) => e.cond.valueNumeric !== null)
    ) {
      // All are lower bounds
      lowerBounds.sort((a, b) => b.cond.valueNumeric! - a.cond.valueNumeric!);

      let prevValue: string | null = null;
      let prevInclusive = false;

      for (const { key, cond } of lowerBounds) {
        const inclusive = cond.operator === '>=';
        const range: OptimizedRange = {
          lower: { value: cond.value, inclusive },
          stateKey: key,
        };

        if (prevValue !== null) {
          range.upper = { value: prevValue, inclusive: !prevInclusive };
        }

        ranges.push(range);
        prevValue = cond.value;
        prevInclusive = inclusive;
      }

      if (defaultStateKey !== null && prevValue !== null) {
        ranges.push({
          upper: { value: prevValue, inclusive: !prevInclusive },
          stateKey: defaultStateKey,
        });
      }
    } else {
      // Mixed - can't optimize with current approach
      return [];
    }
  }

  return ranges;
}

// Re-export for compatibility
export { parseMediaCondition as parseSimpleMediaCondition };
