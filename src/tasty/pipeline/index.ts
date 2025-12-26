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
  isValueMapping,
  parseStyleEntries,
} from './exclusive';
import {
  buildAtRules,
  buildCSSSelector,
  conditionToCSS,
  CSSRule,
} from './materialize';
import { parseStateKey, ParseStateKeyOptions } from './parseStateKey';
import { simplifyCondition } from './simplify';

// ============================================================================
// Types
// ============================================================================

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
    const key = `${rule.selector}|${rule.declarations}|${JSON.stringify(rule.atRules || [])}`;
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
    const exclusiveByStyle = new Map<string, ExclusiveStyleEntry[]>();

    for (const styleName of lookupStyles) {
      const value = styleMap[styleName];
      if (value === undefined) continue;

      if (isValueMapping(value)) {
        // Parse entries from value mapping
        const parsed = parseStyleEntries(styleName, value, (stateKey) =>
          parseStateKey(stateKey, { context: parserContext }),
        );

        // Build exclusive conditions
        const exclusive = buildExclusiveConditions(parsed);
        exclusiveByStyle.set(styleName, exclusive);
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
      const cssRule = materializeComputedRule(rule);
      if (cssRule) {
        allRules.push(cssRule);
      }
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a key is a CSS selector
 */
function isSelector(key: string): boolean {
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
 * Materialize a computed rule to final CSS format
 */
function materializeComputedRule(rule: ComputedRule): CSSRule | null {
  const components = conditionToCSS(rule.condition);

  if (components.isImpossible) {
    return null;
  }

  // Build selector (without className - it will be added later)
  let selector = components.modifierSelectors.join('');
  selector += rule.selectorSuffix;
  selector += components.ownSelectors.join('');

  const atRules = buildAtRules(components);

  const declarations = Object.entries(rule.declarations)
    .map(([prop, value]) => `${prop}: ${value};`)
    .join(' ');

  const cssRule: CSSRule = {
    selector,
    declarations,
  };

  if (atRules.length > 0) {
    cssRule.atRules = atRules;
  }

  if (components.rootPrefix) {
    cssRule.rootPrefix = components.rootPrefix;
  }

  return cssRule;
}

// ============================================================================
// Exports
// ============================================================================

export {
  ConditionNode,
  and,
  or,
  not,
  trueCondition,
  falseCondition,
} from './conditions';
export { parseStateKey } from './parseStateKey';
export { simplifyCondition } from './simplify';
export { buildExclusiveConditions } from './exclusive';
export { conditionToCSS, CSSRule } from './materialize';
