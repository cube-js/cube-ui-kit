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

    const suffix = getSelector(key, nestedStyles);
    if (suffix) {
      // Create sub-element context for @own() validation
      const subContext: StateParserContext = {
        ...parserContext,
        isSubElement: true,
      };

      // Remove $ from nested styles
      const { $: _omit, ...cleanedStyles } = nestedStyles;
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
 * Get selector suffix for a key
 */
function getSelector(key: string, styles?: Styles): string | null {
  if (key.startsWith('&')) {
    return key.slice(1);
  }

  if (key.startsWith('.')) {
    return ` ${key}`;
  }

  if (/^[A-Z]/.test(key)) {
    const affix = styles?.$;
    if (affix !== undefined) {
      const prefix = transformSelectorAffix(String(affix));
      return `${prefix}[data-element="${key}"]`;
    }
    return ` [data-element="${key}"]`;
  }

  return null;
}

/**
 * Transform selector affix
 */
function transformSelectorAffix(affix: string): string {
  const trimmed = affix.trim();
  if (!trimmed) return ' ';

  // Validate that combinators have spaces around them
  // Check for capitalized words adjacent to combinators without spaces
  const invalidPattern = /[A-Z][a-z]*[>+~]|[>+~][A-Z][a-z]*/;
  if (invalidPattern.test(trimmed)) {
    console.error(
      `[Tasty] Invalid selector affix ($) syntax: "${affix}"\n` +
        `Combinators (>, +, ~) must have spaces around them when used with element names.\n` +
        `Example: Use "$: '> Body > Row'" instead of "$: '>Body>Row'"\n` +
        `This is a design choice: the parser uses simple whitespace splitting for performance.`,
    );
  }

  const tokens = trimmed.split(/\s+/);
  const transformed = tokens.map((token) =>
    /^[A-Z]/.test(token) ? `[data-element="${token}"]` : token,
  );

  return ` ${transformed.join(' ')} `;
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
 * Render styles to CSS rules.
 *
 * When called without classNameOrSelector, returns RenderResult with needsClassName=true.
 * When called with a selector/className string, returns StyleResult[] for direct injection.
 */
export function renderStyles(styles?: Styles): RenderResult;
export function renderStyles(
  styles: Styles | undefined,
  classNameOrSelector: string,
): StyleResult[];
export function renderStyles(
  styles?: Styles,
  classNameOrSelector?: string,
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

          // Increase specificity for tasty class selectors by duplicating the class
          if (sel.startsWith('.') && /^\.t\d+/.test(sel)) {
            const classMatch = sel.match(/^\.t\d+/);
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
