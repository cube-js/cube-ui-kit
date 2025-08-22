import { FlattenedRule } from './types';

/**
 * Parse and flatten nested CSS
 * Handles &, .Class, SubElement patterns from renderStyles output
 * Preserves at-rule context (media queries, supports, etc.)
 */
export function flattenNestedCss(
  cssText: string,
  baseClassName: string,
  atRuleStack: string[] = [],
): FlattenedRule[] {
  const rules: FlattenedRule[] = [];

  if (!cssText.trim()) {
    return rules;
  }

  // Parse the CSS text into rules
  const parsedRules = parseCssRules(cssText, atRuleStack);

  for (const rule of parsedRules) {
    const flattenedRules = flattenRule(rule, baseClassName);
    rules.push(...flattenedRules);
  }

  return rules;
}

interface ParsedRule {
  selector: string;
  declarations: string;
  nested?: ParsedRule[];
  atRules?: string[]; // Stack of at-rules this rule is nested in
}

/**
 * Parse CSS text into a tree structure
 * Handles at-rules and preserves context
 */
function parseCssRules(
  cssText: string,
  atRuleStack: string[] = [],
): ParsedRule[] {
  const rules: ParsedRule[] = [];

  // Enhanced regex to handle at-rules
  const rulePattern = /([^{]+)\{([^{}]*(?:\{[^}]*\}[^{}]*)*)\}/g;
  let match;

  while ((match = rulePattern.exec(cssText)) !== null) {
    const selector = match[1].trim();
    const content = match[2].trim();

    // Check if this is an at-rule
    if (selector.startsWith('@')) {
      // This is an at-rule, parse its content with updated stack
      const newAtRuleStack = [...atRuleStack, selector];
      const nestedRules = parseCssRules(content, newAtRuleStack);
      rules.push(...nestedRules); // Flatten at-rule contents
    } else {
      // Regular selector rule
      if (content.includes('{')) {
        // Has nested rules
        const nestedRules = parseCssRules(content, atRuleStack);
        const declarations = extractDeclarations(content);

        if (declarations) {
          rules.push({
            selector,
            declarations,
            atRules: atRuleStack.length > 0 ? [...atRuleStack] : undefined,
          });
        }

        rules.push(...nestedRules);
      } else {
        // Only declarations
        rules.push({
          selector,
          declarations: content,
          atRules: atRuleStack.length > 0 ? [...atRuleStack] : undefined,
        });
      }
    }
  }

  return rules;
}

/**
 * Extract CSS declarations (non-nested rules) from content
 */
function extractDeclarations(content: string): string {
  const declarations: string[] = [];
  const lines = content.split(/[;\n]/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.includes('{') && !trimmed.includes('}')) {
      // This looks like a declaration
      if (trimmed.includes(':')) {
        declarations.push(trimmed);
      }
    }
  }

  return declarations.join('; ');
}

/**
 * Flatten a parsed rule against a base class name
 */
function flattenRule(rule: ParsedRule, baseClassName: string): FlattenedRule[] {
  const results: FlattenedRule[] = [];

  // Process the main rule
  const flatSelector = flattenSelector(rule.selector, baseClassName);

  if (rule.declarations && rule.declarations.trim()) {
    results.push({
      selector: flatSelector,
      declarations: rule.declarations.trim(),
      atRules: rule.atRules,
    });
  }

  // Process nested rules
  if (rule.nested) {
    for (const nestedRule of rule.nested) {
      const nestedResults = flattenRule(nestedRule, baseClassName);
      results.push(...nestedResults);
    }
  }

  return results;
}

/**
 * Flatten a selector against a base class name
 * Handles &, .Class, SubElement patterns
 */
function flattenSelector(selector: string, baseClassName: string): string {
  // Handle media queries - pass through as-is
  if (selector.startsWith('@media')) {
    return selector;
  }

  // Handle & replacement
  if (selector.includes('&')) {
    return selector.replace(/&/g, `.${baseClassName}`);
  }

  // Handle .Class pattern -> descendant selector
  if (selector.startsWith('.')) {
    return `.${baseClassName} ${selector}`;
  }

  // Handle SubElement pattern (uppercase start) -> data-element selector
  if (/^[A-Z]/.test(selector)) {
    return `.${baseClassName} [data-element="${selector}"]`;
  }

  // Handle other selectors (pseudo-classes, attributes, etc.)
  if (selector.startsWith(':') || selector.startsWith('[')) {
    return `.${baseClassName}${selector}`;
  }

  // Default: treat as descendant
  return `.${baseClassName} ${selector}`;
}

/**
 * Wrap a CSS rule with at-rules (media queries, supports, etc.)
 */
export function wrapWithAtRules(rule: string, atRules?: string[]): string {
  if (!atRules || atRules.length === 0) {
    return rule;
  }

  return atRules.reduceRight((acc, atRule) => `${atRule} { ${acc} }`, rule);
}
