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

  // Enhanced regex to handle at-rules - improved to handle simple cases better
  const rulePattern = /([^{]+)\s*\{\s*([^{}]*(?:\{[^}]*\}[^{}]*)*)\s*\}/g;
  let match;

  while ((match = rulePattern.exec(cssText)) !== null) {
    const selector = match[1].trim();
    const content = match[2].trim();

    // Skip empty rules
    if (!selector || (!content && !content.includes('{'))) {
      continue;
    }

    // Check if this is an at-rule
    if (selector.startsWith('@')) {
      // This is an at-rule, parse its content with updated stack
      const newAtRuleStack = [...atRuleStack, selector];
      const nestedRules = parseCssRules(content, newAtRuleStack);
      rules.push(...nestedRules); // Flatten at-rule contents
    } else {
      // Regular selector rule
      if (content.includes('{')) {
        // Has nested rules - need to separate declarations from nested rules
        const { declarations, nestedContent } =
          separateDeclarationsFromNested(content);

        // Add the rule for the selector if it has declarations
        if (declarations && declarations.trim()) {
          rules.push({
            selector,
            declarations: declarations.trim(),
            atRules: atRuleStack.length > 0 ? [...atRuleStack] : undefined,
          });
        }

        // Parse nested rules
        if (nestedContent.trim()) {
          const nestedRules = parseCssRules(nestedContent, atRuleStack);
          rules.push(...nestedRules);
        }
      } else {
        // Only declarations - this handles simple cases like &{display: block;}
        if (content && content.trim()) {
          rules.push({
            selector,
            declarations: content.trim(),
            atRules: atRuleStack.length > 0 ? [...atRuleStack] : undefined,
          });
        }
      }
    }
  }

  return rules;
}

/**
 * Separate declarations from nested rules in CSS content
 */
function separateDeclarationsFromNested(content: string): {
  declarations: string;
  nestedContent: string;
} {
  const declarations: string[] = [];
  const nestedRules: string[] = [];
  let i = 0;
  let currentDeclaration = '';

  while (i < content.length) {
    const char = content[i];

    if (char === '{') {
      // Found start of nested rule - extract the entire nested rule
      const ruleStart = i;
      let braceDepth = 1;
      i++; // Move past opening brace

      // Find the matching closing brace
      while (i < content.length && braceDepth > 0) {
        if (content[i] === '{') {
          braceDepth++;
        } else if (content[i] === '}') {
          braceDepth--;
        }
        i++;
      }

      // Extract the complete nested rule (including selector before '{')
      let selectorStart = ruleStart;
      while (
        selectorStart > 0 &&
        content[selectorStart - 1] !== ';' &&
        content[selectorStart - 1] !== '\n'
      ) {
        selectorStart--;
      }

      // Skip whitespace at start of selector
      while (selectorStart < ruleStart && /\s/.test(content[selectorStart])) {
        selectorStart++;
      }

      const nestedRule = content.slice(selectorStart, i);
      nestedRules.push(nestedRule);

      // Save any pending declaration
      if (currentDeclaration.trim()) {
        const decl = currentDeclaration.trim();
        if (decl.includes(':') && !decl.includes('{') && !decl.includes('}')) {
          declarations.push(decl);
        }
        currentDeclaration = '';
      }

      continue;
    } else if (char === ';') {
      // End of declaration
      const decl = currentDeclaration.trim();
      if (
        decl &&
        decl.includes(':') &&
        !decl.includes('{') &&
        !decl.includes('}')
      ) {
        declarations.push(decl);
      }
      currentDeclaration = '';
    } else if (char !== '\n' || currentDeclaration.trim()) {
      // Add character to current declaration (skip leading newlines)
      currentDeclaration += char;
    }

    i++;
  }

  // Handle final declaration if no trailing semicolon
  if (currentDeclaration.trim()) {
    const decl = currentDeclaration.trim();
    if (decl.includes(':') && !decl.includes('{') && !decl.includes('}')) {
      declarations.push(decl);
    }
  }

  return {
    declarations: declarations.join('; '),
    nestedContent: nestedRules.join('\n'),
  };
}

/**
 * Extract CSS declarations (non-nested rules) from content
 */
function extractDeclarations(content: string): string {
  const declarations: string[] = [];
  let braceDepth = 0;
  let currentDeclaration = '';

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '{') {
      braceDepth++;
      // If we're entering a nested rule, save any current declaration
      if (braceDepth === 1 && currentDeclaration.trim()) {
        const decl = currentDeclaration.trim();
        if (decl.includes(':') && !decl.includes('{') && !decl.includes('}')) {
          declarations.push(decl);
        }
        currentDeclaration = '';
      }
    } else if (char === '}') {
      braceDepth--;
      currentDeclaration = ''; // Reset on closing brace
    } else if (braceDepth === 0) {
      // Only collect content when we're not inside nested rules
      if (char === ';') {
        const decl = currentDeclaration.trim();
        if (
          decl &&
          decl.includes(':') &&
          !decl.includes('{') &&
          !decl.includes('}')
        ) {
          declarations.push(decl);
        }
        currentDeclaration = '';
      } else if (char !== '\n' || currentDeclaration.trim()) {
        // Add character to current declaration (skip leading newlines)
        currentDeclaration += char;
      }
    }
    // Ignore content inside nested rules (braceDepth > 0)
  }

  // Handle final declaration if no trailing semicolon
  if (braceDepth === 0 && currentDeclaration.trim()) {
    const decl = currentDeclaration.trim();
    if (decl.includes(':') && !decl.includes('{') && !decl.includes('}')) {
      declarations.push(decl);
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

  // Always process the main rule if it has declarations
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
 * Global-aware selector flattener that uses an arbitrary base selector (e.g. ".myButton"),
 * not a class name. It replaces "&" with the full selector and maps nested selectors
 * relative to that base without introducing extra dots.
 */
function flattenSelectorWithBase(
  selector: string,
  baseSelector: string,
): string {
  // Pass-through media queries
  if (selector.startsWith('@media')) {
    return selector;
  }

  // Replace all ampersands with the provided base selector directly
  if (selector.includes('&')) {
    return selector.replace(/&/g, baseSelector);
  }

  // Pseudo-classes/attributes attach directly
  if (selector.startsWith(':') || selector.startsWith('[')) {
    return `${baseSelector}${selector}`;
  }

  // Class or id selectors become descendants
  if (selector.startsWith('.') || selector.startsWith('#')) {
    return `${baseSelector} ${selector}`;
  }

  // SubElement pattern (uppercase start) -> data-element selector as descendant
  if (/^[A-Z]/.test(selector)) {
    return `${baseSelector} [data-element="${selector}"]`;
  }

  // Default: descendant
  return `${baseSelector} ${selector}`;
}

/**
 * Flatten nested CSS for a concrete selector (global styles).
 * Unlike the className-based variant, this preserves the provided selector string as-is.
 */
export function flattenNestedCssForSelector(
  cssText: string,
  baseSelector: string,
  atRuleStack: string[] = [],
): FlattenedRule[] {
  const rules: FlattenedRule[] = [];

  if (!cssText.trim()) {
    return rules;
  }

  // If there are no blocks, treat it as a declaration list for the base selector
  if (!cssText.includes('{')) {
    const declarations = extractDeclarations(cssText);
    if (declarations.trim()) {
      rules.push({
        selector: baseSelector,
        declarations,
        atRules: atRuleStack.length ? [...atRuleStack] : undefined,
      });
    }
    return rules;
  }

  // Reuse the same parser to get structured rules
  const parsedRules = parseCssRules(cssText, atRuleStack);

  function flattenRuleWithBase(
    rule: ParsedRule,
    baseSel: string,
  ): FlattenedRule[] {
    const results: FlattenedRule[] = [];

    const flatSelector = flattenSelectorWithBase(rule.selector, baseSel);

    if (rule.declarations && rule.declarations.trim()) {
      results.push({
        selector: flatSelector,
        declarations: rule.declarations.trim(),
        atRules: rule.atRules,
      });
    }

    if (rule.nested) {
      for (const nestedRule of rule.nested) {
        results.push(...flattenRuleWithBase(nestedRule, baseSel));
      }
    }

    return results;
  }

  for (const rule of parsedRules) {
    rules.push(...flattenRuleWithBase(rule, baseSelector));
  }

  return rules;
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
