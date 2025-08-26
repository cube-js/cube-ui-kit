/**
 * Utility functions for optimizing attribute selectors
 */

interface ParsedAttributeSelector {
  attribute: string;
  value: string;
  originalSelector: string;
}

/**
 * Parse an attribute selector like [data-size="medium"] into its components
 */
function parseAttributeSelector(
  selector: string,
): ParsedAttributeSelector | null {
  const match = selector.match(/^\[([^=]+)="([^"]+)"\]$/);
  if (!match) return null;

  return {
    attribute: match[1],
    value: match[2],
    originalSelector: selector,
  };
}

/**
 * Optimize a list of modifiers and not-modifiers to avoid redundant selectors
 *
 * For example:
 * - [data-size="medium"]:not([data-size="large"]) -> [data-size="medium"]
 * - :not([data-size="medium"]):not([data-size="large"]) -> :not([data-size])
 */
export function optimizeModifierSelectors(
  mods: string[],
  notMods: string[],
  getModSelector: (mod: string) => string,
): string {
  // Convert modifiers to selectors
  const modSelectors = mods.map(getModSelector);
  const notModSelectors = notMods.map(getModSelector);

  // Parse attribute selectors
  const parsedModSelectors = modSelectors.map((sel) => ({
    selector: sel,
    parsed: parseAttributeSelector(sel),
  }));

  const parsedNotModSelectors = notModSelectors.map((sel) => ({
    selector: sel,
    parsed: parseAttributeSelector(sel),
  }));

  // Group by attribute name
  const modsByAttribute = new Map<string, Set<string>>();
  const notModsByAttribute = new Map<string, Set<string>>();

  parsedModSelectors.forEach(({ parsed }) => {
    if (parsed) {
      const set = modsByAttribute.get(parsed.attribute) || new Set();
      set.add(parsed.value);
      modsByAttribute.set(parsed.attribute, set);
    }
  });

  parsedNotModSelectors.forEach(({ parsed }) => {
    if (parsed) {
      const set = notModsByAttribute.get(parsed.attribute) || new Set();
      set.add(parsed.value);
      notModsByAttribute.set(parsed.attribute, set);
    }
  });

  // Check for conflicting attributes (same attribute with different values in mods)
  for (const [attribute, values] of modsByAttribute) {
    if (values.size > 1) {
      // This combination is impossible (e.g., [data-size="medium"][data-size="large"])
      return 'IMPOSSIBLE_SELECTOR';
    }
  }

  // Build optimized selectors
  const finalModSelectors: string[] = [];
  const finalNotSelectors: string[] = [];

  // Add regular mod selectors
  parsedModSelectors.forEach(({ selector, parsed }) => {
    finalModSelectors.push(selector);
  });

  // First pass: collect all not selectors that aren't attribute selectors
  parsedNotModSelectors.forEach(({ selector, parsed }) => {
    if (!parsed) {
      // Not an attribute selector, keep as is
      const sel = selector.startsWith(':not(')
        ? selector.slice(5, -1)
        : `:not(${selector})`;
      finalNotSelectors.push(sel);
    }
  });

  // Handle attribute-based not selectors with optimization
  notModsByAttribute.forEach((values, attribute) => {
    const modValues = modsByAttribute.get(attribute);

    if (modValues && modValues.size > 0) {
      // We have a positive selector for this attribute (e.g., [data-size="medium"])
      // So we don't need any :not() selectors for other values of the same attribute
      // because they're mutually exclusive
      return;
    }

    // No positive selector for this attribute
    if (values.size >= 2) {
      // Multiple values being negated - optimize to :not([attribute])
      finalNotSelectors.push(`:not([${attribute}])`);
    } else {
      // Single value being negated
      values.forEach((value) => {
        finalNotSelectors.push(`:not([${attribute}="${value}"])`);
      });
    }
  });

  return finalModSelectors.join('') + finalNotSelectors.join('');
}
