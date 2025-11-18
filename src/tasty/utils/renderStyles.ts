/**
 * Style rendering that works with structured style objects.
 * Eliminates CSS string parsing for better performance.
 *
 * Key optimizations:
 * - Early exit checks (hasSameAttributeConflicts) handle common cases without overhead
 * - Logical rule caching (logicalRulesCache) memoizes expensive style processing
 * - Conflict detection prevents invalid CSS selector combinations
 * - Not-selector optimization reduces CSS size
 * - Priority-based filtering handles mod precedence correctly
 * - Consolidated mod processing eliminates code duplication
 */

import { Lru } from '../parser/lru';
import { createStyle, STYLE_HANDLER_MAP } from '../styles';
import { Styles } from '../styles/types';

import { getModCombinationsIterative } from './getModCombinations';
import {
  computeState,
  getModSelector,
  stringifyStyles,
  StyleHandler,
  StyleMap,
  styleStateMapToStyleStateDataList,
} from './styles';

export interface StyleResult {
  selector: string;
  declarations: string;
  atRules?: string[];
  needsClassName?: boolean; // Flag to indicate selector needs className prepended
}

export interface RenderResult {
  rules: StyleResult[];
  className?: string;
}

interface LogicalRule {
  selectorSuffix: string; // '', ':hover', '>*', …
  declarations: Record<string, string>;
}

type HandlerQueueItem = {
  handler: StyleHandler;
  styleMap: StyleMap;
};

// Cache logical rules per styles+breakpoints to avoid recomputation across identical calls
const logicalRulesCache = new Lru<string, LogicalRule[]>(5000);

// Normalize selector suffixes coming from `$` in style handler results.
// Some legacy handlers return suffixes starting with `&` (e.g. '& > *').
// The renderer expects suffixes without the ampersand because it adds
// the parent selector during materialization.
function normalizeDollarSelectorSuffix(suffix: string): string {
  if (!suffix) return '';
  return suffix.startsWith('&') ? suffix.slice(1) : suffix;
}

/**
 * Check if a key represents a CSS selector
 */
export function isSelector(key: string): boolean {
  return (
    key.startsWith('&') || key.startsWith('.') || key.match(/^[A-Z]/) !== null
  );
}

/**
 * Transform selector affix by converting capitalized words to sub-element selectors.
 * Returns a selector prefix with leading and trailing spaces.
 *
 * Examples:
 *   '> Body > Row'     -> ' > [data-element="Body"] > [data-element="Row"] '
 *   '> Body > Row >'   -> ' > [data-element="Body"] > [data-element="Row"] > '
 *   '>'                -> ' > '
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
 * Get the selector suffix for a key
 */
function getSelector(key: string, styles?: Styles): string | null {
  if (key.startsWith('&')) {
    return key.slice(1);
  }

  if (key.startsWith('.')) {
    return ` ${key}`;
  }

  if (key.match(/^[A-Z]/)) {
    const affix = styles?.$;
    if (affix !== undefined) {
      const prefix = transformSelectorAffix(String(affix));
      return `${prefix}[data-element="${key}"]`;
    }
    return ` [data-element="${key}"]`;
  }

  return null;
}

// Helper functions to parse and handle attribute selectors
interface ParsedAttributeSelector {
  attribute: string;
  value: string;
  fullSelector: string;
}

/**
 * Parse attribute selector into its components.
 * Simple regex parsing - JS engines optimize repeated patterns internally.
 */
function parseAttributeSelector(
  selector: string,
): ParsedAttributeSelector | null {
  // Match patterns like [data-size="medium"] or [data-selected]
  const match = selector.match(/^\[([^=\]]+)(?:="([^"]+)")?\]$/);
  return match
    ? {
        attribute: match[1],
        value: match[2] || 'true', // Handle boolean attributes
        fullSelector: selector,
      }
    : null;
}

function hasConflictingAttributeSelectors(
  mods: string[],
  parsedMods?: Map<string, ParsedAttributeSelector | null>,
): boolean {
  const attributeValues = new Map<string, string[]>();
  const attributeBooleans = new Set<string>();

  for (const mod of mods) {
    const parsed = parsedMods?.get(mod) ?? parseAttributeSelector(mod);
    if (!parsed) continue;

    if (parsed.value === 'true') {
      // Boolean attribute
      attributeBooleans.add(parsed.attribute);
    } else {
      // Value attribute
      if (!attributeValues.has(parsed.attribute)) {
        attributeValues.set(parsed.attribute, []);
      }
      attributeValues.get(parsed.attribute)!.push(parsed.value);
    }
  }

  // Check for multiple different values for the same attribute
  for (const values of attributeValues.values()) {
    if (values.length > 1) return true;
  }

  return false;
}

/**
 * Create a conflict checker function that uses precomputed attribute maps
 * for efficient conflict detection during combination generation
 */
function createAttributeConflictChecker(
  parsedMods: Map<string, ParsedAttributeSelector | null>,
): (combination: string[]) => boolean {
  return (combination: string[]) =>
    hasConflictingAttributeSelectors(combination, parsedMods);
}

// Interface for precomputed attribute maps to optimize not selector generation
interface AttributeMaps {
  allAttributes: Map<string, Set<string>>;
  currentAttributes: Map<string, string>;
  parsedMods: Map<string, ParsedAttributeSelector | null>;
}

// Build precomputed attribute maps for efficient not selector optimization
function buildAttributeMaps(
  currentMods: string[],
  allMods: string[],
  parsedModsCache?: Map<string, ParsedAttributeSelector | null>,
): AttributeMaps {
  const allAttributes = new Map<string, Set<string>>();
  const currentAttributes = new Map<string, string>();
  const parsedMods =
    parsedModsCache || new Map<string, ParsedAttributeSelector | null>();

  // Parse all mods once and cache results (only if cache not provided)
  if (!parsedModsCache) {
    const allModsSet = new Set([...currentMods, ...allMods]);
    for (const mod of allModsSet) {
      if (!parsedMods.has(mod)) {
        parsedMods.set(mod, parseAttributeSelector(mod));
      }
    }
  }

  // Build map of all possible values for each attribute
  for (const mod of allMods) {
    const parsed = parsedMods.get(mod);
    if (parsed && parsed.value !== 'true') {
      if (!allAttributes.has(parsed.attribute)) {
        allAttributes.set(parsed.attribute, new Set());
      }
      allAttributes.get(parsed.attribute)!.add(parsed.value);
    }
  }

  // Build map of current mod attribute values
  for (const mod of currentMods) {
    const parsed = parsedMods.get(mod);
    if (parsed && parsed.value !== 'true') {
      currentAttributes.set(parsed.attribute, parsed.value);
    }
  }

  return { allAttributes, currentAttributes, parsedMods };
}

/**
 * Check if a combination of positive and negative selectors creates a contradiction
 * Returns true if the combination is INVALID and should be pruned
 */
function hasContradiction(
  currentMods: string[],
  notMods: string[],
  parsedMods: Map<string, ParsedAttributeSelector | null>,
): boolean {
  // Build maps of positive selector states
  const positiveAttributes = new Map<string, string[]>();
  const positiveBooleans = new Set<string>();

  for (const mod of currentMods) {
    const parsed = parsedMods.get(mod);
    if (parsed) {
      if (parsed.value === 'true') {
        // Boolean attribute (e.g., [data-theme])
        positiveBooleans.add(parsed.attribute);
      } else {
        // Value attribute (e.g., [data-theme="danger"])
        if (!positiveAttributes.has(parsed.attribute)) {
          positiveAttributes.set(parsed.attribute, []);
        }
        positiveAttributes.get(parsed.attribute)!.push(parsed.value);
      }
    }
  }

  // Check negative selectors for contradictions
  for (const mod of notMods) {
    const parsed = parsedMods.get(mod);
    if (parsed) {
      if (parsed.value === 'true') {
        // Negative boolean: !([data-theme])
        // Case 6: Value positive + attribute negative = CONTRADICTION
        if (
          positiveAttributes.has(parsed.attribute) ||
          positiveBooleans.has(parsed.attribute)
        ) {
          return true; // INVALID: can't have value without attribute
        }
      } else {
        // Negative value: !([data-theme="danger"])
        // No contradiction - this is valid
      }
    }
  }

  return false;
}

function optimizeNotSelectors(
  currentMods: string[],
  allMods: string[],
  precomputedMaps?: AttributeMaps,
): string[] {
  const maps = precomputedMaps || buildAttributeMaps(currentMods, allMods);

  const notMods = allMods.filter((mod) => !currentMods.includes(mod));
  const optimizedNotMods: string[] = [];

  // Precompute presence of negative boolean attributes to avoid repeated scans
  const negativeBooleanByAttr = new Set<string>();
  for (const mod of notMods) {
    const p = maps.parsedMods.get(mod);
    if (p && p.value === 'true') {
      negativeBooleanByAttr.add(p.attribute);
    }
  }

  // Build maps of positive selector states for subsumption optimization
  const positiveAttributes = new Map<string, string[]>();
  const positiveBooleans = new Set<string>();

  for (const mod of currentMods) {
    const parsed = maps.parsedMods.get(mod);
    if (parsed) {
      if (parsed.value === 'true') {
        positiveBooleans.add(parsed.attribute);
      } else {
        if (!positiveAttributes.has(parsed.attribute)) {
          positiveAttributes.set(parsed.attribute, []);
        }
        positiveAttributes.get(parsed.attribute)!.push(parsed.value);
      }
    }
  }

  for (const mod of notMods) {
    const parsed = maps.parsedMods.get(mod);

    if (parsed && parsed.value !== 'true') {
      // Negative value selector
      // If we already have a value for this attribute, skip this not selector
      // because it's already mutually exclusive (optimization)
      if (maps.currentAttributes.has(parsed.attribute)) {
        continue;
      }
    }

    // If we have a positive value for this attribute, skip the negative boolean
    // This avoids producing selectors like [data-attr="x"]:not([data-attr])
    if (parsed && parsed.value === 'true') {
      if (maps.currentAttributes.has(parsed.attribute)) {
        continue;
      }
    }

    // Case 4 subsumption: If we have a value positive and boolean positive for same attribute
    // The value implies the boolean, so we can skip the boolean from positive mods
    // (This is handled elsewhere - the value selector is more specific)

    // Case 7 subsumption: If we have a value negative and boolean negative for same attribute
    // The boolean negative implies value negative, so skip the value negative
    if (parsed && parsed.value !== 'true') {
      // If we also have the boolean attribute in negative mods, skip the value negative
      if (negativeBooleanByAttr.has(parsed.attribute)) {
        continue;
      }
    }

    optimizedNotMods.push(mod);
  }

  return optimizedNotMods;
}

/**
 * Quick check if there are any same-attribute conflicts (boolean vs value for same attribute).
 * Returns true if conflicts exist, false if filtering can be skipped.
 * This early exit optimization handles the common case efficiently.
 */
function hasSameAttributeConflicts(
  allMods: string[],
  parsedModsCache: Map<string, ParsedAttributeSelector | null>,
): boolean {
  const attributeCounts = new Map<
    string,
    { hasBool: boolean; hasValue: boolean }
  >();

  for (const mod of allMods) {
    const parsed = parsedModsCache.get(mod);
    if (!parsed) continue;

    const isBool = parsed.value === 'true';
    const existing = attributeCounts.get(parsed.attribute);

    if (existing) {
      // Already have both types for this attribute - conflict exists!
      if ((isBool && existing.hasValue) || (!isBool && existing.hasBool)) {
        return true;
      }
      // Update the types we've seen
      if (isBool) existing.hasBool = true;
      else existing.hasValue = true;
    } else {
      attributeCounts.set(parsed.attribute, {
        hasBool: isBool,
        hasValue: !isBool,
      });
    }
  }

  return false;
}

/**
 * Filter mods based on priority order for same-attribute conflicts.
 * If a boolean selector has higher priority than value selectors for the same attribute,
 * remove the value selectors (they would be shadowed by the boolean).
 *
 * Priority is determined by order in the styleStates (after reversal - earlier = higher priority)
 */
function filterModsByPriority(
  allMods: string[],
  styleStates: Record<string, any>,
  lookupStyles: string[],
  parsedModsCache: Map<string, ParsedAttributeSelector | null>,
): string[] {
  // Early exit: if no same-attribute conflicts exist, skip all the expensive work
  // This handles the common case efficiently without any cache overhead
  if (!hasSameAttributeConflicts(allMods, parsedModsCache)) {
    return allMods;
  }

  // Build priority map: for each mod, find its earliest appearance in any state list
  const modPriorities = new Map<string, number>();

  for (const style of lookupStyles) {
    const states = styleStates[style];
    if (!states || states.length === 0) continue; // Skip empty states

    // states are already reversed (higher priority = lower index)
    for (let index = 0; index < states.length; index++) {
      const state = states[index];
      if (!state.mods || state.mods.length === 0) continue; // Skip empty mods

      for (const mod of state.mods) {
        const currentPriority = modPriorities.get(mod);
        if (currentPriority === undefined || index < currentPriority) {
          modPriorities.set(mod, index);
        }
      }
    }
  }

  // Group mods by attribute
  const attributeGroups = new Map<
    string,
    Array<{
      mod: string;
      isBool: boolean;
      priority: number;
    }>
  >();

  for (const mod of allMods) {
    const parsed = parsedModsCache.get(mod);
    if (!parsed) continue;

    const priority = modPriorities.get(mod);
    if (priority === undefined) continue;

    const isBool = parsed.value === 'true';

    let group = attributeGroups.get(parsed.attribute);
    if (!group) {
      group = [];
      attributeGroups.set(parsed.attribute, group);
    }

    group.push({
      mod,
      isBool,
      priority,
    });
  }

  // Filter: for each attribute, if boolean has higher priority than any value, remove values
  const modsToRemove = new Set<string>();

  for (const [attribute, group] of attributeGroups.entries()) {
    // Only process attributes with more than one mod
    if (group.length <= 1) continue;

    const boolMods = group.filter((m) => m.isBool);
    const valueMods = group.filter((m) => !m.isBool);

    // Only check if we have both types
    if (boolMods.length === 0 || valueMods.length === 0) continue;

    // Check if any boolean has higher priority (lower index) than all values
    for (const boolMod of boolMods) {
      const hasHigherPriorityThanAllValues = valueMods.every(
        (valueMod) => boolMod.priority < valueMod.priority,
      );

      if (hasHigherPriorityThanAllValues) {
        // This boolean shadows all value mods for this attribute
        valueMods.forEach((valueMod) => modsToRemove.add(valueMod.mod));
      }
    }
  }

  return allMods.filter((mod) => !modsToRemove.has(mod));
}

/**
 * Explode a style handler result into logical rules with proper mapping
 * Phase 1: Handler fan-out ($ selectors)
 * Phase 2: Rule materialization
 */
function explodeHandlerResult(result: any, selectorSuffix = ''): LogicalRule[] {
  if (!result) return [];

  // Phase 1: Handler fan-out - normalize to array
  const resultArray = Array.isArray(result) ? result : [result];
  const logicalRules: LogicalRule[] = [];

  for (const item of resultArray) {
    if (!item || typeof item !== 'object') continue;

    const { $, ...styleProps } = item;

    // Build declarations from style props
    const declarations: Record<string, string> = {};
    for (const [prop, value] of Object.entries(styleProps)) {
      if (value != null && value !== '') {
        declarations[prop] = String(value);
      }
    }

    if (Object.keys(declarations).length === 0) continue;

    // Phase 2: Selector fan-out - handle $ suffixes
    // IMPORTANT: If we are already in a pseudo-element context (contains '::'),
    // CSS does not allow further descendant/child selectors (e.g., '>*') after
    // a pseudo-element. In such cases we must ignore the `$`-derived selectors.
    const inPseudoElementContext = selectorSuffix.includes('::');

    if (inPseudoElementContext && $) {
      // Skip this item entirely to avoid producing invalid selectors like
      // `.t0::before>*`.
      continue;
    }

    const suffixes = $
      ? (Array.isArray($) ? $ : [$]).map(
          (s) => selectorSuffix + normalizeDollarSelectorSuffix(String(s)),
        )
      : [selectorSuffix];

    // Create logical rules for each suffix
    for (const suffix of suffixes) {
      logicalRules.push({
        selectorSuffix: suffix,
        declarations: { ...declarations },
      });
    }
  }

  return logicalRules;
}

/**
 * Convert handler result (CSSMap) to CSS string for global injection
 */
function convertHandlerResultToCSS(result: any, selectorSuffix = ''): string {
  if (!result) return '';

  if (Array.isArray(result)) {
    const fragments: string[] = [];
    for (const item of result) {
      const itemCSS = convertHandlerResultToCSS(item, selectorSuffix);
      if (itemCSS) {
        fragments.push(itemCSS);
      }
    }
    return fragments.join('');
  }

  const { $, css, ...styleProps } = result;
  const styleFragments: string[] = [];

  // Process style properties using array accumulation
  for (const [styleName, value] of Object.entries(styleProps)) {
    if (Array.isArray(value)) {
      // Handle array values
      for (const val of value) {
        if (val) {
          styleFragments.push(`${styleName}: ${val};\n`);
        }
      }
    } else if (value) {
      // Handle single values
      styleFragments.push(`${styleName}: ${value};\n`);
    }
  }

  let renderedStyles = styleFragments.join('');

  if (css) {
    renderedStyles = css + '\n' + renderedStyles;
  }

  if (!renderedStyles) {
    return '';
  }

  const finalSelectorSuffix = selectorSuffix || '';

  if (Array.isArray($)) {
    const ruleFragments: string[] = [];
    for (const suffix of $) {
      const normalized = suffix
        ? normalizeDollarSelectorSuffix(String(suffix))
        : '';
      ruleFragments.push(
        `&${finalSelectorSuffix}${normalized}{\n${renderedStyles}}\n`,
      );
    }
    return ruleFragments.join('');
  }

  const normalizedSingle = $ ? normalizeDollarSelectorSuffix(String($)) : '';
  return `&${finalSelectorSuffix}${normalizedSingle}{\n${renderedStyles}}\n`;
}

/**
 * Process state maps with mod combinations and generate logical rules.
 * This consolidates the common logic for handling mod combinations, priority filtering,
 * contradiction checking, and selector optimization.
 */
function processStateMapsWithModCombinations(
  styleStates: Record<string, any>,
  lookupStyles: string[],
  handler: StyleHandler,
  parentSuffix: string,
  allLogicalRules: LogicalRule[],
): void {
  // Collect all mods from style states
  const allMods: string[] = [];
  const seenMods = new Set<string>();

  for (const style of lookupStyles) {
    const states = styleStates[style];
    if (!states) continue;

    for (const state of states) {
      if (state.mods) {
        for (const mod of state.mods) {
          if (!seenMods.has(mod)) {
            seenMods.add(mod);
            allMods.push(mod);
          }
        }
      }
    }
  }

  if (allMods.length === 0) {
    // No mods - just call handler with default state values
    const stateProps: Record<string, any> = {};
    lookupStyles.forEach((style) => {
      const states = styleStates[style];
      if (states && states.length > 0) {
        stateProps[style] = states[0].value;
      }
    });
    const result = handler(stateProps as any);
    if (!result) return;

    const logicalRules = explodeHandlerResult(result, parentSuffix);
    allLogicalRules.push(...logicalRules);
    return;
  }

  // Parse all mods once and share the cache across all operations
  const parsedModsCache = new Map<string, ParsedAttributeSelector | null>();
  for (const mod of allMods) {
    parsedModsCache.set(mod, parseAttributeSelector(getModSelector(mod)));
  }

  // Apply priority-based filtering for same-attribute boolean vs value conflicts
  const filteredMods = filterModsByPriority(
    allMods,
    styleStates,
    lookupStyles,
    parsedModsCache,
  );

  // Precompute attribute maps once for all combinations
  const attributeMaps = buildAttributeMaps([], filteredMods, parsedModsCache);

  // Generate combinations with conflict-aware pruning
  const conflictChecker = createAttributeConflictChecker(
    attributeMaps.parsedMods,
  );
  const combinations = getModCombinationsIterative(
    filteredMods,
    true,
    conflictChecker,
  );

  // Process each mod combination
  combinations.forEach((modCombination) => {
    const stateProps: Record<string, any> = {};

    // Find matching state for each style
    lookupStyles.forEach((style) => {
      const states = styleStates[style];
      const matchingState = states.find((state: any) =>
        computeState(state.model, (mod) => modCombination.includes(mod)),
      );
      if (matchingState) {
        stateProps[style] = matchingState.value;
      }
    });

    // Use precomputed maps for efficient not selector optimization
    const currentMaps = buildAttributeMaps(
      modCombination,
      filteredMods,
      parsedModsCache,
    );

    // Compute raw NOTs for contradiction check (before optimization)
    const rawNotMods = filteredMods.filter(
      (mod) => !modCombination.includes(mod),
    );

    // Check for contradictions between positive and negative selectors
    if (hasContradiction(modCombination, rawNotMods, currentMaps.parsedMods)) {
      return; // Skip this invalid combination
    }

    // Optimize NOT selectors afterwards (pure simplification)
    const optimizedNotMods = optimizeNotSelectors(
      modCombination,
      filteredMods,
      currentMaps,
    );

    // Build the mod selector string
    const modsSelectors = `${modCombination
      .map(getModSelector)
      .join('')}${optimizedNotMods
      .map((mod) => {
        const sel = getModSelector(mod);
        return sel.startsWith(':not(') ? sel.slice(5, -1) : `:not(${sel})`;
      })
      .join('')}`;

    // Simple non-responsive state values
    const result = handler(stateProps as any);
    if (!result) return;
    const logical = explodeHandlerResult(
      result,
      `${modsSelectors}${parentSuffix}`,
    );
    allLogicalRules.push(...logical);
  });
}

/**
 * Convert logical rules to final StyleResult format
 */
function materializeRules(
  logicalRules: LogicalRule[],
  className: string,
): StyleResult[] {
  return logicalRules.map((rule) => {
    // Generate base selector
    let selector = `.${className}${rule.selectorSuffix}`;

    // Increase specificity for tasty class selectors by duplicating the class
    if (/^t\d+$/.test(className)) {
      selector = `.${className}${selector}`;
    }

    const declarations = Object.entries(rule.declarations)
      .map(([prop, value]) => `${prop}: ${value};`)
      .join(' ');

    return {
      selector,
      declarations,
    };
  });
}

/**
 * Core style processing logic that generates logical rules
 * Used by the unified renderStyles function
 */
function generateLogicalRules(
  styles: Styles,
  parentSuffix: string = '',
): LogicalRule[] {
  const allLogicalRules: LogicalRule[] = [];

  // Process styles recursively, preserving mod selectors and combining with nested selector suffixes
  function processStyles(currentStyles: Styles, parentSuffix: string = '') {
    const keys = Object.keys(currentStyles || {});
    const selectorKeys = keys.filter((key) => isSelector(key));

    // Recurse into nested selectors first to compute proper suffix chaining
    for (const key of selectorKeys) {
      const suffix = getSelector(key, currentStyles[key] as Styles);
      if (suffix && currentStyles[key]) {
        // Remove $ key to prevent it from being processed as a style property
        const { $: _omit, ...cleanedStyles } = currentStyles[key] as any;
        processStyles(cleanedStyles as Styles, `${parentSuffix}${suffix}`);
      }
    }

    // Build handler queue for style properties at this level
    const handlerQueue: HandlerQueueItem[] = [];
    const seenHandlers = new Set<StyleHandler>();

    keys.forEach((styleName) => {
      if (isSelector(styleName)) return;

      let handlers: StyleHandler[] = STYLE_HANDLER_MAP[styleName];

      if (!handlers) {
        handlers = STYLE_HANDLER_MAP[styleName] = [createStyle(styleName)];
      }

      handlers.forEach((handler) => {
        if (seenHandlers.has(handler)) {
          return;
        }
        seenHandlers.add(handler);

        const lookupStyles = handler.__lookupStyles;
        const filteredStyleMap = lookupStyles.reduce((map, name) => {
          const value = currentStyles?.[name];
          if (value !== undefined) {
            (map as any)[name] = value;
          }

          return map;
        }, {} as StyleMap);

        handlerQueue.push({
          handler,
          styleMap: filteredStyleMap,
        });
      });
    });

    // Process handlers
    handlerQueue.forEach(({ handler, styleMap }) => {
      const lookupStyles = handler.__lookupStyles;

      // Check if any values have state maps
      const hasStateMaps = lookupStyles.some((style) => {
        const value = styleMap[style];
        return value && typeof value === 'object' && !Array.isArray(value);
      });

      if (hasStateMaps) {
        // Build styleStates from styleMap
        const styleStates: Record<string, any> = {};
        lookupStyles.forEach((style) => {
          const value = styleMap[style];
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            const { states } = styleStateMapToStyleStateDataList(value);
            styleStates[style] = states;
          } else {
            // Simple value, create a single state
            styleStates[style] = [{ mods: [], notMods: [], value }];
          }
        });

        // Use the consolidated helper for mod combination processing
        processStateMapsWithModCombinations(
          styleStates,
          lookupStyles,
          handler,
          parentSuffix,
          allLogicalRules,
        );
      } else {
        // Simple case: no state maps, call handler directly
        const result = handler(styleMap as any);
        if (result) {
          const logical = explodeHandlerResult(result, parentSuffix);
          allLogicalRules.push(...logical);
        }
      }
    });
  }

  // Kick off processing from the root styles with empty suffix
  processStyles(styles, parentSuffix);

  return allLogicalRules;
}

/**
 * Render styles to StyleResult[] format (recommended)
 * Supports both component and global styling with advanced optimizations
 */
export function renderStyles(styles?: Styles, className?: string): RenderResult;

/**
 * Render styles without className for element styles (injector will add it)
 */
export function renderStyles(styles: Styles | undefined): RenderResult;

/**
 * Render styles for direct injection with a specific selector
 * Bypasses CSS text generation and flattening by directly creating StyleResult[]
 */
export function renderStyles(
  styles: Styles | undefined,
  selector: string,
): StyleResult[];

export function renderStyles(
  styles?: Styles,
  classNameOrSelector?: string,
): RenderResult | StyleResult[] {
  const directSelector = !!classNameOrSelector;

  if (!styles) {
    return directSelector ? [] : { rules: [] };
  }

  // Generate logical rules using shared pipeline (memoized per styles)
  const stylesKey = stringifyStyles(styles);
  let allLogicalRules = logicalRulesCache.get(stylesKey);
  if (!allLogicalRules) {
    allLogicalRules = generateLogicalRules(styles);
    logicalRulesCache.set(stylesKey, allLogicalRules);
  }

  if (directSelector) {
    // Direct selector mode: convert logical rules directly to StyleResult format
    if (!classNameOrSelector) {
      throw new Error('directSelector mode requires classNameOrSelector');
    }

    return allLogicalRules.map((rule) => {
      // Replace & with the actual selector or append suffix to selector
      let finalSelector = rule.selectorSuffix
        ? `${classNameOrSelector}${rule.selectorSuffix}`
        : classNameOrSelector;

      // Increase specificity for tasty class selectors by duplicating the class
      if (finalSelector.startsWith('.') && /^\.t\d+/.test(finalSelector)) {
        const classMatch = finalSelector.match(/^\.t\d+/);
        if (classMatch) {
          const baseClass = classMatch[0];
          finalSelector = baseClass + finalSelector;
        }
      }

      const declarations = Object.entries(rule.declarations)
        .map(([prop, value]) => `${prop}: ${value};`)
        .join(' ');

      return {
        selector: finalSelector,
        declarations,
      };
    });
  }

  // Standard mode: use accumulation and materialization with className
  const accumulatedRules = new Map<string, LogicalRule>();

  for (const rule of allLogicalRules) {
    // Create a key based on selectorSuffix
    const ruleKey = rule.selectorSuffix;

    const existing = accumulatedRules.get(ruleKey);
    if (existing) {
      // Merge declarations from this rule into the existing one
      Object.assign(existing.declarations, rule.declarations);
    } else {
      // Create a new accumulated rule
      accumulatedRules.set(ruleKey, {
        selectorSuffix: rule.selectorSuffix,
        declarations: { ...rule.declarations },
      });
    }
  }

  // If no className provided, return rules with needsClassName flag
  if (!classNameOrSelector) {
    const materializedRules = Array.from(accumulatedRules.values()).map(
      (rule) => {
        const declarations = Object.entries(rule.declarations)
          .map(([prop, value]) => `${prop}: ${value};`)
          .join(' ');

        return {
          selector: rule.selectorSuffix || '',
          declarations,
          needsClassName: true, // Flag for injector to prepend className
        };
      },
    );

    return {
      rules: materializedRules,
    };
  }

  // Materialize the accumulated logical rules into final format
  const finalRulesRaw = materializeRules(
    Array.from(accumulatedRules.values()),
    classNameOrSelector,
  );

  // Simplified deduplication (should be much less work now)
  const seen = new Set<string>();
  const finalRules = finalRulesRaw.filter((rule) => {
    const at =
      rule.atRules && rule.atRules.length ? `@${rule.atRules.join('|')}` : '';
    const key = `${rule.selector}|${rule.declarations}|${at}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    rules: finalRules,
    className: classNameOrSelector,
  };
}
