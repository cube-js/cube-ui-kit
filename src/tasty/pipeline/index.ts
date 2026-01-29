/**
 * Tasty Style Rendering Pipeline
 *
 * This is the main entrypoint for the new pipeline implementation.
 * It implements the complete flow from style objects to CSS rules.
 *
 * Pipeline stages:
 * 1. PARSE CONDITIONS - Parse state keys into ConditionNode trees
 * 2. BUILD EXCLUSIVE CONDITIONS - AND with negation of higher-priority conditions
 * 3. SIMPLIFY CONDITIONS - Apply boolean algebra, detect contradictions
 * 4. GROUP BY HANDLER - Collect styles per handler, compute combinations
 * 5. COMPUTE CSS VALUES - Call handlers to get CSS declarations
 * 6. MERGE BY VALUE - Merge rules with identical CSS output
 * 7. MATERIALIZE CSS - Convert conditions to CSS selectors + at-rules
 */

import { Lru } from '../parser/lru';
import { createStateParserContext, StateParserContext } from '../states';
import { createStyle, STYLE_HANDLER_MAP } from '../styles';
import { Styles } from '../styles/types';
import { stringifyStyles, StyleHandler, StyleValue } from '../utils/styles';

import {
  and,
  ConditionNode,
  getConditionUniqueId,
  or,
  StateCondition,
  trueCondition,
} from './conditions';
import {
  buildExclusiveConditions,
  ExclusiveStyleEntry,
  expandExclusiveOrs,
  expandOrConditions,
  isValueMapping,
  parseStyleEntries,
} from './exclusive';
import {
  buildAtRulesFromVariant,
  conditionToCSS,
  CSSRule,
  modifierToCSS,
  pseudoToCSS,
  rootConditionsToCSS,
  SelectorVariant,
} from './materialize';
import { parseStateKey, ParseStateKeyOptions } from './parseStateKey';
import { simplifyCondition } from './simplify';

// ============================================================================
// Types (compatible with old renderStyles API)
// ============================================================================

/**
 * Matches the old StyleResult interface for backward compatibility
 */
export interface StyleResult {
  selector: string;
  declarations: string;
  atRules?: string[];
  needsClassName?: boolean;
  rootPrefix?: string;
}

/**
 * Matches the old RenderResult interface for backward compatibility
 */
export interface RenderResult {
  rules: StyleResult[];
  className?: string;
}

export interface PipelineResult {
  rules: CSSRule[];
  className?: string;
}

interface HandlerStateGroup {
  handler: StyleHandler;
  lookupStyles: string[];
  stateSnapshots: Array<{
    condition: ConditionNode;
    values: Record<string, StyleValue>;
  }>;
}

interface ComputedRule {
  condition: ConditionNode;
  declarations: Record<string, string>;
  selectorSuffix: string;
}

// ============================================================================
// Caching
// ============================================================================

const pipelineCache = new Lru<string, CSSRule[]>(5000);

// ============================================================================
// Main Pipeline Function
// ============================================================================

/**
 * Render styles using the new pipeline.
 *
 * This is the main entrypoint that implements the complete flow.
 */
export function renderStylesPipeline(
  styles?: Styles,
  className?: string,
): PipelineResult {
  if (!styles) {
    return { rules: [], className };
  }

  // Check cache
  const cacheKey = stringifyStyles(styles);
  let rules = pipelineCache.get(cacheKey);

  if (!rules) {
    // Create parser context
    const parserContext = createStateParserContext(styles);

    // Run pipeline
    rules = runPipeline(styles, parserContext);

    // Cache result
    pipelineCache.set(cacheKey, rules);
  }

  // If no className, rules need it to be prepended later
  if (!className) {
    return {
      rules: rules.map((r) => ({
        ...r,
        needsClassName: true,
      })) as any,
    };
  }

  // Prepend className to selectors
  const finalRules = rules.map((rule) => {
    // Parse the selector to find where to insert className
    let selector = rule.selector;

    // If selector starts with :root, insert className after the :root part
    if (rule.rootPrefix) {
      selector = `${rule.rootPrefix} .${className}.${className}${selector}`;
    } else {
      selector = `.${className}.${className}${selector}`;
    }

    return {
      ...rule,
      selector,
    };
  });

  return {
    rules: finalRules,
    className,
  };
}

/**
 * Clear the pipeline cache (for testing)
 */
export function clearPipelineCache(): void {
  pipelineCache.clear();
}

// ============================================================================
// Pipeline Implementation
// ============================================================================

function runPipeline(
  styles: Styles,
  parserContext: StateParserContext,
): CSSRule[] {
  const allRules: CSSRule[] = [];

  // Process styles recursively (including nested selectors)
  processStyles(styles, '', parserContext, allRules);

  // Deduplicate rules
  const seen = new Set<string>();
  const dedupedRules = allRules.filter((rule) => {
    // Include rootPrefix in dedup key - rules with different root prefixes are distinct
    const key = `${rule.selector}|${rule.declarations}|${JSON.stringify(rule.atRules || [])}|${rule.rootPrefix || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return dedupedRules;
}

/**
 * Process styles at a given nesting level
 */
function processStyles(
  styles: Styles,
  selectorSuffix: string,
  parserContext: StateParserContext,
  allRules: CSSRule[],
): void {
  const keys = Object.keys(styles);

  // Separate selector keys from style keys
  // Skip @keyframes (processed separately) and other @ prefixed keys (predefined states)
  const selectorKeys = keys.filter((key) => isSelector(key));
  const styleKeys = keys.filter(
    (key) => !isSelector(key) && !key.startsWith('@'),
  );

  // Process nested selectors first
  for (const key of selectorKeys) {
    const nestedStyles = styles[key] as Styles;
    if (!nestedStyles || typeof nestedStyles !== 'object') continue;

    // Get all selectors (handles comma-separated patterns)
    const suffixes = getAllSelectors(key, nestedStyles);
    if (!suffixes) continue; // Invalid selector, skip

    // Create sub-element context for @own() validation
    const subContext: StateParserContext = {
      ...parserContext,
      isSubElement: true,
    };

    // Remove $ from nested styles
    const { $: _omit, ...cleanedStyles } = nestedStyles;

    // Process for each selector (multiple selectors = same styles applied to each)
    for (const suffix of suffixes) {
      processStyles(
        cleanedStyles,
        selectorSuffix + suffix,
        subContext,
        allRules,
      );
    }
  }

  // Build handler queue
  const handlerQueue = buildHandlerQueue(styleKeys, styles);

  // Process each handler
  for (const { handler, styleMap } of handlerQueue) {
    const lookupStyles = handler.__lookupStyles;

    // Stage 1 & 2: Parse and build exclusive conditions for each style
    // Exclusive conditions ensure each CSS rule applies to exactly one state.
    // OR conditions in exclusives are properly expanded to DNF (multiple CSS selectors).
    const exclusiveByStyle = new Map<string, ExclusiveStyleEntry[]>();

    for (const styleName of lookupStyles) {
      const value = styleMap[styleName];
      if (value === undefined) continue;

      if (isValueMapping(value)) {
        // Parse entries from value mapping
        const parsed = parseStyleEntries(styleName, value, (stateKey) =>
          parseStateKey(stateKey, { context: parserContext }),
        );

        // Expand OR conditions into exclusive branches
        // This ensures OR branches like `A | B | C` become:
        //   A, B & !A, C & !A & !B
        const expanded = expandOrConditions(parsed);

        // Build exclusive conditions across all entries
        const exclusive = buildExclusiveConditions(expanded);

        // Expand ORs from De Morgan negation into exclusive branches
        // This transforms: !A | !B  →  !A, (A & !B)
        // Ensures each CSS rule has proper at-rule context
        const fullyExpanded = expandExclusiveOrs(exclusive);
        exclusiveByStyle.set(styleName, fullyExpanded);
      } else {
        // Simple value - single entry with TRUE condition
        exclusiveByStyle.set(styleName, [
          {
            styleKey: styleName,
            stateKey: '',
            value,
            condition: trueCondition(),
            priority: 0,
            exclusiveCondition: trueCondition(),
          },
        ]);
      }
    }

    // Stage 4: Compute all valid state combinations
    const stateSnapshots = computeStateCombinations(
      exclusiveByStyle,
      lookupStyles,
    );

    // Stage 5: Call handler for each snapshot
    const computedRules: ComputedRule[] = [];

    for (const snapshot of stateSnapshots) {
      const result = handler(snapshot.values as any);
      if (!result) continue;

      // Handler may return single or array
      const results = Array.isArray(result) ? result : [result];

      for (const r of results) {
        if (!r || typeof r !== 'object') continue;

        const { $, ...styleProps } = r;
        const declarations: Record<string, string> = {};

        for (const [prop, val] of Object.entries(styleProps)) {
          if (val != null && val !== '') {
            declarations[prop] = String(val);
          }
        }

        if (Object.keys(declarations).length === 0) continue;

        // Handle $ suffixes
        const suffixes = $
          ? (Array.isArray($) ? $ : [$]).map(
              (s) => selectorSuffix + normalizeSelectorSuffix(String(s)),
            )
          : [selectorSuffix];

        for (const suffix of suffixes) {
          computedRules.push({
            condition: snapshot.condition,
            declarations,
            selectorSuffix: suffix,
          });
        }
      }
    }

    // Stage 6: Merge rules with identical CSS output
    const mergedRules = mergeByValue(computedRules);

    // Stage 7: Materialize to CSS
    for (const rule of mergedRules) {
      const cssRules = materializeComputedRule(rule);
      allRules.push(...cssRules);
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a key is a CSS selector
 */
export function isSelector(key: string): boolean {
  return key.startsWith('&') || key.startsWith('.') || /^[A-Z]/.test(key);
}

/**
 * Result of processing a selector affix ($) pattern.
 *
 * @example
 * // Valid result with multiple selectors
 * { valid: true, selectors: ['> [data-element="Cell"]', ' [data-element="Body"] > [data-element="Cell"]'] }
 *
 * // Invalid result with error message
 * { valid: false, reason: 'Selector affix "+" targets elements outside the root scope.' }
 */
type AffixResult =
  | { valid: true; selectors: string[] }
  | { valid: false; reason: string };

/**
 * Get all selector suffixes for a sub-element key.
 *
 * Handles three types of selector keys:
 * - `&` prefix: Raw selector suffix (e.g., `&:hover` → `:hover`)
 * - `.` prefix: Class selector (e.g., `.active` → ` .active`)
 * - Uppercase: Sub-element with optional `$` affix pattern
 *
 * @param key - The sub-element key (e.g., 'Label', '&:hover', '.active')
 * @param styles - The styles object, may contain `$` property for selector affix
 * @returns Array of selector suffixes, or null if invalid (with console warning)
 *
 * @example
 * getAllSelectors('Label', {})
 * // → [' [data-element="Label"]']
 *
 * getAllSelectors('Cell', { $: '>, >Body>' })
 * // → ['> [data-element="Cell"]', ' [data-element="Body"] > [data-element="Cell"]']
 */
function getAllSelectors(key: string, styles?: Styles): string[] | null {
  if (key.startsWith('&')) {
    return [key.slice(1)];
  }

  if (key.startsWith('.')) {
    return [` ${key}`];
  }

  if (/^[A-Z]/.test(key)) {
    const affix = styles?.$;
    if (affix !== undefined) {
      const result = processAffix(String(affix), key);
      if (!result.valid) {
        console.warn(`[Tasty] ${result.reason}`);
        return null; // Skip this sub-element entirely
      }
      return result.selectors;
    }
    return [` [data-element="${key}"]`];
  }

  return null;
}

/**
 * Process selector affix pattern and return selector(s)
 *
 * Supports:
 * - Direct child: '>'
 * - Chained elements: '>Body>Row>'
 * - HTML tags: 'a', '>ul>li', 'button:hover'
 * - Pseudo-elements on root: '::before'
 * - Pseudo on sub-element: '@::before', '>@:hover'
 * - Classes: '.active', '>@.active'
 * - Multiple selectors: '>, >Body>'
 * - Sibling combinators (after element): '>Item+', '>Item~'
 */
function processAffix(affix: string, key: string): AffixResult {
  const trimmed = affix.trim();

  // Empty = default behavior (descendant selector with key)
  if (!trimmed) {
    return { valid: true, selectors: [` [data-element="${key}"]`] };
  }

  // Split by comma for multiple selectors
  const patterns = trimmed.split(',').map((p) => p.trim());
  const selectors: string[] = [];

  for (const pattern of patterns) {
    const validation = validatePattern(pattern);
    if (!validation.valid) {
      return validation;
    }

    const selector = processSinglePattern(pattern, key);
    selectors.push(selector);
  }

  return { valid: true, selectors };
}

/**
 * Recognized token patterns for selector affix validation.
 *
 * These patterns are used to tokenize and validate `$` affix strings.
 * Order matters: more specific patterns must come first to avoid
 * partial matches (e.g., `::before` must match before `:` alone).
 *
 * Unrecognized tokens (like `#id`, `*`, or numbers) will cause validation to fail.
 */
const VALID_TOKEN_PATTERNS = [
  /^[>+~]/, // Combinators: >, +, ~
  /^[A-Z][a-zA-Z0-9]*/, // Uppercase element names → [data-element="..."]
  /^@/, // @ placeholder for key injection position
  /^::?[a-z][a-z0-9-]*(?:\([^)]*\))?/, // Pseudo-elements/classes (:hover, ::before, :not(.x))
  /^\.[a-zA-Z_-][a-zA-Z0-9_-]*/, // Class selectors (.active, .is-open)
  /^\[[^\]]+\]/, // Attribute selectors ([type="text"], [role])
  /^[a-z][a-z0-9-]*/, // HTML tag names (a, div, button, my-component)
  /^\s+/, // Whitespace (ignored during parsing)
  /^&/, // Root reference (stripped, kept for backward compat)
];

/**
 * Scan a pattern for unrecognized tokens.
 *
 * Iterates through the pattern, consuming recognized tokens until
 * either the pattern is fully consumed (valid) or an unrecognized
 * character sequence is found (invalid).
 *
 * @param pattern - The selector pattern to validate
 * @returns The first unrecognized token found, or null if all tokens are valid
 *
 * @example
 * findUnrecognizedTokens('>Body>Row>') // → null (valid)
 * findUnrecognizedTokens('123')         // → '123' (invalid)
 * findUnrecognizedTokens('#myId')       // → '#' (invalid)
 */
function findUnrecognizedTokens(pattern: string): string | null {
  let remaining = pattern;

  while (remaining.length > 0) {
    let matched = false;

    for (const regex of VALID_TOKEN_PATTERNS) {
      const match = remaining.match(regex);
      if (match) {
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Found unrecognized content - extract the problematic part
      const unrecognized = remaining.match(/^[^\s>+~@.:[\]A-Z]+/);
      return unrecognized ? unrecognized[0] : remaining[0];
    }
  }

  return null;
}

/**
 * Validate a selector pattern for structural correctness.
 *
 * Checks for:
 * 1. Out-of-scope selectors: Patterns starting with `+` or `~` target siblings
 *    of the root element, which is outside the component's DOM scope.
 * 2. Consecutive combinators: Patterns like `>>` or `>+` are malformed CSS.
 * 3. Unrecognized tokens: Characters/sequences not matching valid CSS selectors.
 *
 * @param pattern - A single selector pattern (already split by comma)
 * @returns AffixResult indicating validity and error reason if invalid
 *
 * @example
 * validatePattern('>Body>Row>')  // → { valid: true, selectors: [] }
 * validatePattern('+')           // → { valid: false, reason: '...outside root scope...' }
 * validatePattern('>>')          // → { valid: false, reason: '...consecutive combinators...' }
 */
function validatePattern(pattern: string): AffixResult {
  const trimmed = pattern.trim();

  // Patterns starting with + or ~ target siblings of the root element,
  // which is outside the component's scope. Valid sibling patterns must
  // be preceded by an element: ">Item+", ">Item~"
  if (/^[+~]/.test(trimmed)) {
    return {
      valid: false,
      reason:
        `Selector affix "${pattern}" targets elements outside the root scope. ` +
        `Sibling selectors (+, ~) must be preceded by an element inside the root. ` +
        `Use ">Element+" or ">Element~" instead.`,
    };
  }

  // Check for consecutive combinators
  if (/[>+~]{2,}/.test(trimmed.replace(/\s+/g, ''))) {
    return {
      valid: false,
      reason: `Selector affix "${pattern}" contains consecutive combinators.`,
    };
  }

  // Check for unrecognized tokens (e.g., lowercase text like "foo")
  const unrecognized = findUnrecognizedTokens(trimmed);
  if (unrecognized) {
    return {
      valid: false,
      reason:
        `Selector affix "${pattern}" contains unrecognized token "${unrecognized}". ` +
        `Valid tokens: combinators (>, +, ~), element names (Uppercase), ` +
        `@ placeholder, pseudo (:hover, ::before), class (.name), attribute ([attr]).`,
    };
  }

  return { valid: true, selectors: [] };
}

/**
 * Process a single selector pattern into a CSS selector suffix.
 *
 * This is the main transformation function that converts a `$` affix pattern
 * into a valid CSS selector suffix. It handles:
 *
 * 1. `@` placeholder replacement with `[data-element="key"]`
 * 2. Key injection based on pattern ending (see `shouldInjectKey`)
 * 3. Proper spacing for descendant vs direct child selectors
 *
 * @param pattern - A single validated selector pattern
 * @param key - The sub-element key to inject (e.g., 'Label', 'Cell')
 * @returns CSS selector suffix ready to append to the root selector
 *
 * @example
 * processSinglePattern('>', 'Row')
 * // → '> [data-element="Row"]'
 *
 * processSinglePattern('>Body>Row>', 'Cell')
 * // → '> [data-element="Body"] > [data-element="Row"] > [data-element="Cell"]'
 *
 * processSinglePattern('::before', 'Before')
 * // → '::before' (no key injection for pseudo on root)
 *
 * processSinglePattern('>@:hover', 'Item')
 * // → '> [data-element="Item"]:hover'
 */
function processSinglePattern(pattern: string, key: string): string {
  // Strip leading & if present (implicit root reference, kept for compat)
  let normalized = pattern.replace(/^&/, '').trim();

  if (!normalized) {
    return ` [data-element="${key}"]`;
  }

  // Pseudo-elements/classes at start apply directly to root (no space prefix)
  const startsWithPseudo = /^::?[a-z]/.test(normalized);

  // Transform the pattern: convert element names and normalize spacing
  let result = transformPattern(normalized);

  // Handle @ placeholder: explicit key injection position
  if (result.includes('@')) {
    // Remove space between @ and following class/pseudo for proper attachment
    // e.g., "@ .active" → "[el].active", but "@ > span" → "[el] > span"
    result = result.replace(/@ (?=[.:])/g, '@');
    result = result.replace(/@/g, `[data-element="${key}"]`);

    if (!startsWithPseudo && !result.startsWith(' ')) {
      result = ' ' + result;
    }
    return result;
  }

  // Auto-inject key based on pattern ending (see shouldInjectKey for rules)
  if (shouldInjectKey(normalized)) {
    result = result + ' ' + `[data-element="${key}"]`;
  }

  // Add space prefix for selectors targeting inside root (not pseudo on root)
  if (!startsWithPseudo && !result.startsWith(' ')) {
    result = ' ' + result;
  }

  return result;
}

/**
 * Transform a selector pattern by converting element names and normalizing spacing.
 *
 * This is a character-by-character tokenizer that:
 * - Converts uppercase names to `[data-element="Name"]` selectors
 * - Adds proper spacing around combinators (>, +, ~)
 * - Preserves lowercase tags, classes, pseudos, and attributes as-is
 * - Keeps @ placeholder for later replacement
 *
 * The tokenizer handles these token types in order:
 * 1. Whitespace (skipped)
 * 2. Combinators: >, +, ~ (add surrounding spaces)
 * 3. Uppercase names: Body, Row (convert to [data-element="..."])
 * 4. @ placeholder (keep for later replacement)
 * 5. Pseudo: :hover, ::before (attach to previous token)
 * 6. Tags: a, div, button (keep as-is with spacing)
 * 7. Classes: .active (attach to previous element/tag/placeholder)
 * 8. Attributes: [type="text"] (keep as-is)
 *
 * @param pattern - The raw selector pattern to transform
 * @returns Transformed pattern with proper CSS selector syntax
 *
 * @example
 * transformPattern('>Body>Row>')
 * // → '> [data-element="Body"] > [data-element="Row"] >'
 *
 * transformPattern('button.primary:hover')
 * // → 'button.primary:hover'
 */
function transformPattern(pattern: string): string {
  let result = '';
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Combinator: > + ~
    if (/[>+~]/.test(char)) {
      // Add combinator with surrounding spaces
      if (result && !result.endsWith(' ')) {
        result += ' ';
      }
      result += char;
      i++;
      continue;
    }

    // Uppercase element name
    if (/[A-Z]/.test(char)) {
      // Read the full element name
      let name = '';
      while (i < pattern.length && /[a-zA-Z0-9]/.test(pattern[i])) {
        name += pattern[i];
        i++;
      }
      // Add with proper spacing
      if (result && !result.endsWith(' ')) {
        result += ' ';
      }
      result += `[data-element="${name}"]`;
      continue;
    }

    // @ placeholder
    if (char === '@') {
      if (result && !result.endsWith(' ')) {
        result += ' ';
      }
      result += '@';
      i++;
      // Don't add space after @ - let the next token attach if it's a class/pseudo
      continue;
    }

    // Pseudo-element/class (::before, :hover)
    if (char === ':') {
      // Don't add space before pseudo if attached to previous element
      let pseudo = '';
      while (
        i < pattern.length &&
        !/[\s>+~,@]/.test(pattern[i]) &&
        !/[A-Z]/.test(pattern[i])
      ) {
        pseudo += pattern[i];
        i++;
      }
      result += pseudo;
      continue;
    }

    // Lowercase HTML tag name (a, div, button, my-component)
    if (/[a-z]/.test(char)) {
      let tag = '';
      while (i < pattern.length && /[a-z0-9-]/.test(pattern[i])) {
        tag += pattern[i];
        i++;
      }
      // Add with proper spacing
      if (result && !result.endsWith(' ')) {
        result += ' ';
      }
      result += tag;
      continue;
    }

    // Class (.active, .myClass, .navItem)
    if (char === '.') {
      // Keep attached if directly after ] (element), @ (placeholder), or alphanumeric (tag)
      // Otherwise add space (standalone class selector)
      const lastNonSpace = result.replace(/\s+$/, '').slice(-1);
      const attachToLast =
        lastNonSpace === ']' ||
        lastNonSpace === '@' ||
        /[a-zA-Z0-9-]/.test(lastNonSpace);
      if (result && !attachToLast && !result.endsWith(' ')) {
        result += ' ';
      }
      // Start with the dot
      let cls = '.';
      i++;
      // Class names can contain uppercase letters (camelCase, BEM, etc.)
      // Stop at: whitespace, combinators, comma, @, or new token starters (. : [)
      while (i < pattern.length && /[a-zA-Z0-9_-]/.test(pattern[i])) {
        cls += pattern[i];
        i++;
      }
      result += cls;
      continue;
    }

    // Attribute selector [...]
    if (char === '[') {
      // Keep attached if directly after ] (element), @ (placeholder), or alphanumeric (tag)
      // Otherwise add space (standalone attribute selector)
      const lastNonSpace = result.replace(/\s+$/, '').slice(-1);
      const attachToLast =
        lastNonSpace === ']' ||
        lastNonSpace === '@' ||
        /[a-zA-Z0-9-]/.test(lastNonSpace);
      if (result && !attachToLast && !result.endsWith(' ')) {
        result += ' ';
      }
      let attr = '';
      let depth = 0;
      while (i < pattern.length) {
        attr += pattern[i];
        if (pattern[i] === '[') depth++;
        if (pattern[i] === ']') depth--;
        i++;
        if (depth === 0) break;
      }
      result += attr;
      continue;
    }

    // Other characters - just append
    result += char;
    i++;
  }

  return result;
}

/**
 * Determine if the sub-element key should be auto-injected based on pattern ending.
 *
 * Key injection rules (when no @ placeholder is present):
 *
 * | Pattern Ending | Inject Key? | Example | Result |
 * |----------------|-------------|---------|--------|
 * | Combinator (>, +, ~) | Yes | `'>Body>'` | `> [data-element="Body"] > [el]` |
 * | Uppercase element | Yes | `'>Body>Row'` | `> [el1] > [el2] [key]` |
 * | Lowercase tag | Yes | `'>ul>li'` | `> ul > li [key]` |
 * | Pseudo (:hover, ::before) | No | `'::before'` | `::before` |
 * | Class (.active) | No | `'.active'` | `.active` |
 * | Attribute ([type]) | No | `'[type="text"]'` | `[type="text"]` |
 *
 * @param pattern - The normalized pattern (after stripping &)
 * @returns true if key should be injected, false otherwise
 *
 * @example
 * shouldInjectKey('>')           // → true (trailing combinator)
 * shouldInjectKey('>Body>Row')   // → true (ends with element)
 * shouldInjectKey('>ul>li')      // → true (ends with tag)
 * shouldInjectKey('::before')    // → false (ends with pseudo)
 * shouldInjectKey('.active')     // → false (ends with class)
 * shouldInjectKey('a:hover')     // → false (ends with pseudo)
 * shouldInjectKey('button.primary') // → false (ends with class)
 */
function shouldInjectKey(pattern: string): boolean {
  const trimmed = pattern.trim();

  // Rule 1: Ends with combinator → inject key after it
  // e.g., '>' → '> [data-element="Key"]'
  if (/[>+~]$/.test(trimmed)) {
    return true;
  }

  // Rule 2: Ends with uppercase element name → inject key as descendant
  // The lookbehind ensures we're matching a standalone element name, not
  // part of a class like .myClass (where C is preceded by lowercase)
  // e.g., '>Body' → '> [data-element="Body"] [data-element="Key"]'
  if (/(?:^|[\s>+~\]:])[A-Z][a-zA-Z0-9]*$/.test(trimmed)) {
    return true;
  }

  // Rule 3: Ends with lowercase tag name → inject key as descendant
  // The negative lookbehind (?<![:.]) ensures we don't match:
  // - ':hover' (pseudo ending)
  // - '.primary' (class ending)
  // e.g., '>ul>li' → '> ul > li [data-element="Key"]'
  if (/(?<![:.])(?:^|[\s>+~])[a-z][a-z0-9-]*$/.test(trimmed)) {
    return true;
  }

  // Rule 4: Otherwise (pseudo, class, attribute) → no injection
  // The pattern is complete as-is, applying to root or a specific selector
  return false;
}

/**
 * Normalize selector suffix from $ property
 */
function normalizeSelectorSuffix(suffix: string): string {
  if (!suffix) return '';
  return suffix.startsWith('&') ? suffix.slice(1) : suffix;
}

/**
 * Build handler queue from style keys
 */
function buildHandlerQueue(
  styleKeys: string[],
  styles: Styles,
): Array<{ handler: StyleHandler; styleMap: Record<string, any> }> {
  const queue: Array<{ handler: StyleHandler; styleMap: Record<string, any> }> =
    [];
  const seenHandlers = new Set<StyleHandler>();

  for (const styleName of styleKeys) {
    let handlers: StyleHandler[] = STYLE_HANDLER_MAP[styleName];

    if (!handlers) {
      handlers = STYLE_HANDLER_MAP[styleName] = [createStyle(styleName)];
    }

    for (const handler of handlers) {
      if (seenHandlers.has(handler)) continue;
      seenHandlers.add(handler);

      const lookupStyles = handler.__lookupStyles;
      const styleMap: Record<string, any> = {};

      for (const name of lookupStyles) {
        if (styles[name] !== undefined) {
          styleMap[name] = styles[name];
        }
      }

      queue.push({ handler, styleMap });
    }
  }

  return queue;
}

/**
 * Compute all valid state combinations for a handler's lookup styles
 */
function computeStateCombinations(
  exclusiveByStyle: Map<string, ExclusiveStyleEntry[]>,
  lookupStyles: string[],
): Array<{ condition: ConditionNode; values: Record<string, StyleValue> }> {
  // Get entries for each style
  const entriesPerStyle = lookupStyles.map(
    (style) => exclusiveByStyle.get(style) || [],
  );

  // Cartesian product of all combinations
  const combinations = cartesianProduct(entriesPerStyle);

  // Build snapshots, simplifying and filtering impossible combinations
  const snapshots: Array<{
    condition: ConditionNode;
    values: Record<string, StyleValue>;
  }> = [];

  for (const combo of combinations) {
    // Combine all exclusive conditions with AND
    const conditions = combo.map((e) => e.exclusiveCondition);
    const combined = and(...conditions);
    const simplified = simplifyCondition(combined);

    // Skip impossible combinations
    if (simplified.kind === 'false') continue;

    // Build values map
    const values: Record<string, StyleValue> = {};
    for (const entry of combo) {
      values[entry.styleKey] = entry.value;
    }

    snapshots.push({
      condition: simplified,
      values,
    });
  }

  return snapshots;
}

/**
 * Cartesian product of arrays
 */
function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];

  // Filter out empty arrays
  const nonEmpty = arrays.filter((a) => a.length > 0);
  if (nonEmpty.length === 0) return [[]];

  return nonEmpty.reduce<T[][]>(
    (acc, arr) => acc.flatMap((combo) => arr.map((item) => [...combo, item])),
    [[]],
  );
}

/**
 * Merge rules with identical CSS output
 */
function mergeByValue(rules: ComputedRule[]): ComputedRule[] {
  // Group by selectorSuffix + declarations
  const groups = new Map<string, ComputedRule[]>();

  for (const rule of rules) {
    const key = `${rule.selectorSuffix}|${JSON.stringify(rule.declarations)}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(rule);
  }

  // Merge conditions with OR for each group
  const merged: ComputedRule[] = [];

  for (const [, groupRules] of groups) {
    if (groupRules.length === 1) {
      merged.push(groupRules[0]);
    } else {
      // Merge conditions with OR
      const mergedCondition = simplifyCondition(
        or(...groupRules.map((r) => r.condition)),
      );
      merged.push({
        condition: mergedCondition,
        declarations: groupRules[0].declarations,
        selectorSuffix: groupRules[0].selectorSuffix,
      });
    }
  }

  return merged;
}

/**
 * Build selector fragment from a variant (without className prefix)
 */
function buildSelectorFromVariant(
  variant: SelectorVariant,
  selectorSuffix: string,
): string {
  let selector = '';

  // Add modifier selectors
  for (const mod of variant.modifierConditions) {
    selector += modifierToCSS(mod);
  }

  // Add pseudo selectors
  for (const pseudo of variant.pseudoConditions) {
    selector += pseudoToCSS(pseudo);
  }

  selector += selectorSuffix;

  // Add own selectors (after sub-element)
  for (const own of variant.ownConditions) {
    if ('attribute' in own) {
      selector += modifierToCSS(own);
    } else {
      selector += pseudoToCSS(own);
    }
  }

  return selector;
}

/**
 * Materialize a computed rule to final CSS format
 *
 * Returns an array because OR conditions may generate multiple CSS rules
 * (when different branches have different at-rules)
 */
function materializeComputedRule(rule: ComputedRule): CSSRule[] {
  const components = conditionToCSS(rule.condition);

  if (components.isImpossible || components.variants.length === 0) {
    return [];
  }

  const declarations = Object.entries(rule.declarations)
    .map(([prop, value]) => `${prop}: ${value};`)
    .join(' ');

  // Helper to get root prefix key for grouping
  const getRootPrefixKey = (variant: SelectorVariant): string => {
    return variant.rootConditions
      .map((r) => (r.negated ? `!${r.selector}` : r.selector))
      .sort()
      .join('|');
  };

  // Group variants by their at-rules (variants with same at-rules can be combined with commas)
  const byAtRules = new Map<
    string,
    { variants: SelectorVariant[]; atRules: string[]; rootPrefix?: string }
  >();

  for (const variant of components.variants) {
    const atRules = buildAtRulesFromVariant(variant);
    const key = atRules.sort().join('|||') + '###' + getRootPrefixKey(variant);

    const group = byAtRules.get(key);
    if (group) {
      group.variants.push(variant);
    } else {
      byAtRules.set(key, {
        variants: [variant],
        atRules,
        rootPrefix: rootConditionsToCSS(variant.rootConditions),
      });
    }
  }

  // Generate one CSSRule per at-rules group
  const rules: CSSRule[] = [];
  for (const [, group] of byAtRules) {
    // Build selector fragments for each variant (will be joined with className later)
    const selectorFragments = group.variants.map((v) =>
      buildSelectorFromVariant(v, rule.selectorSuffix),
    );

    // Store as array if multiple, string if single
    const selector =
      selectorFragments.length === 1 ? selectorFragments[0] : selectorFragments;

    const cssRule: CSSRule = {
      selector,
      declarations,
    };

    if (group.atRules.length > 0) {
      cssRule.atRules = group.atRules;
    }

    if (group.rootPrefix) {
      cssRule.rootPrefix = group.rootPrefix;
    }

    rules.push(cssRule);
  }

  return rules;
}

// ============================================================================
// Public API: renderStyles (compatible with old API)
// ============================================================================

/**
 * Options for renderStyles when using direct selector mode.
 */
export interface RenderStylesOptions {
  /**
   * Whether to double the class selector for increased specificity.
   * When true, `.myClass` becomes `.myClass.myClass` for higher specificity.
   *
   * @default false - User-provided selectors are not doubled.
   *
   * Note: This only applies when a classNameOrSelector is provided.
   * When renderStyles returns RenderResult with needsClassName=true,
   * the injector handles doubling automatically.
   */
  doubleSelector?: boolean;
}

/**
 * Render styles to CSS rules.
 *
 * When called without classNameOrSelector, returns RenderResult with needsClassName=true.
 * When called with a selector/className string, returns StyleResult[] for direct injection.
 */
export function renderStyles(styles?: Styles): RenderResult;
export function renderStyles(
  styles: Styles | undefined,
  classNameOrSelector: string,
  options?: RenderStylesOptions,
): StyleResult[];
export function renderStyles(
  styles?: Styles,
  classNameOrSelector?: string,
  options?: RenderStylesOptions,
): RenderResult | StyleResult[] {
  // Check if we have a direct selector/className
  const directSelector = !!classNameOrSelector;

  if (!styles) {
    return directSelector ? [] : { rules: [] };
  }

  // Check cache
  const cacheKey = stringifyStyles(styles);
  let rules = pipelineCache.get(cacheKey);

  if (!rules) {
    // Create parser context
    const parserContext = createStateParserContext(styles);

    // Run pipeline
    rules = runPipeline(styles, parserContext);

    // Cache result
    pipelineCache.set(cacheKey, rules);
  }

  // Direct selector/className mode: return StyleResult[] directly
  if (directSelector) {
    const shouldDouble = options?.doubleSelector ?? false;

    return rules.map((rule): StyleResult => {
      // Handle selector as array (OR conditions) or string
      const selectorParts = Array.isArray(rule.selector)
        ? rule.selector
        : rule.selector
          ? [rule.selector]
          : [''];

      let finalSelector = selectorParts
        .map((part) => {
          let sel = part
            ? `${classNameOrSelector}${part}`
            : classNameOrSelector;

          // Double class selector for increased specificity if requested
          // This is used when the caller explicitly wants higher specificity
          if (shouldDouble && sel.startsWith('.')) {
            const classMatch = sel.match(/^\.[a-zA-Z_-][a-zA-Z0-9_-]*/);
            if (classMatch) {
              const baseClass = classMatch[0];
              sel = baseClass + sel;
            }
          }

          // Handle root prefix for this selector
          if (rule.rootPrefix) {
            sel = `${rule.rootPrefix} ${sel}`;
          }

          return sel;
        })
        .join(', ');

      const result: StyleResult = {
        selector: finalSelector,
        declarations: rule.declarations,
      };

      if (rule.atRules && rule.atRules.length > 0) {
        result.atRules = rule.atRules;
      }

      return result;
    });
  }

  // No className mode: return RenderResult with needsClassName flag
  // Normalize selector to string (join array with placeholder that injector will handle)
  return {
    rules: rules.map(
      (r): StyleResult => ({
        selector: Array.isArray(r.selector)
          ? r.selector.join('|||')
          : r.selector,
        declarations: r.declarations,
        atRules: r.atRules,
        needsClassName: true,
        rootPrefix: r.rootPrefix,
      }),
    ),
  };
}

// ============================================================================
// Exports
// ============================================================================

export type { ConditionNode } from './conditions';
export { and, or, not, trueCondition, falseCondition } from './conditions';
export { parseStateKey } from './parseStateKey';
export { simplifyCondition } from './simplify';
export { buildExclusiveConditions } from './exclusive';
export { conditionToCSS } from './materialize';
export type { CSSRule } from './materialize';
