/**
 * Style rendering that works with structured style objects
 * Eliminates CSS string parsing for better performance
 */

import { Lru } from '../parser/lru';
import { createStyle, STYLE_HANDLER_MAP } from '../styles';
import { Styles } from '../styles/types';

import { getModCombinationsIterative } from './getModCombinations';
import {
  normalizeStyleZones,
  pointsToZones,
  ResponsiveZone,
} from './responsive';
import {
  computeState,
  getModSelector,
  StyleHandler,
  StyleMap,
  styleStateMapToStyleStateDataList,
} from './styles';

// Detect if a value is a state map whose entries contain responsive arrays
function stateMapHasResponsiveArrays(value: any): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value).some((v) => Array.isArray(v));
}

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
  breakpointIdx: number; // 0 = base
  declarations: Record<string, string>;
  // Marks that this rule originated from responsive array processing
  // When true and breakpointIdx === 0, we should wrap the rule in the zone[0] media query
  responsiveSource?: boolean;
}

type HandlerQueueItem = {
  handler: StyleHandler;
  styleMap: StyleMap;
  isResponsive: boolean;
};

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

// Cache for parsed attribute selectors with bounded size to prevent memory leaks
const attributeSelectorCache = new Lru<string, ParsedAttributeSelector | null>(
  5000,
);

function parseAttributeSelector(
  selector: string,
): ParsedAttributeSelector | null {
  // Check cache first
  const cached = attributeSelectorCache.get(selector);
  if (cached !== undefined) {
    return cached;
  }

  // Match patterns like [data-size="medium"] or [data-selected]
  const match = selector.match(/^\[([^=\]]+)(?:="([^"]+)")?\]$/);
  const result = match
    ? {
        attribute: match[1],
        value: match[2] || 'true', // Handle boolean attributes
        fullSelector: selector,
      }
    : null;

  // Cache the result
  attributeSelectorCache.set(selector, result);
  return result;
}

function hasConflictingAttributeSelectors(
  mods: string[],
  parsedMods?: Map<string, ParsedAttributeSelector | null>,
): boolean {
  const attributeMap = new Map<string, string[]>();

  for (const mod of mods) {
    const parsed = parsedMods?.get(mod) ?? parseAttributeSelector(mod);
    if (parsed && parsed.value !== 'true') {
      if (!attributeMap.has(parsed.attribute)) {
        attributeMap.set(parsed.attribute, []);
      }
      attributeMap.get(parsed.attribute)!.push(parsed.value);
    }
  }

  // Check if any attribute has multiple values
  for (const values of attributeMap.values()) {
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
): AttributeMaps {
  const allAttributes = new Map<string, Set<string>>();
  const currentAttributes = new Map<string, string>();
  const parsedMods = new Map<string, ParsedAttributeSelector | null>();

  // Parse all mods once and cache results
  const allModsSet = new Set([...currentMods, ...allMods]);
  for (const mod of allModsSet) {
    if (!parsedMods.has(mod)) {
      parsedMods.set(mod, parseAttributeSelector(mod));
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
        if (positiveAttributes.has(parsed.attribute)) {
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

    // Case 4 subsumption: If we have a value positive and boolean positive for same attribute
    // The value implies the boolean, so we can skip the boolean from positive mods
    // (This is handled elsewhere - the value selector is more specific)

    // Case 7 subsumption: If we have a value negative and boolean negative for same attribute
    // The boolean negative implies value negative, so skip the value negative
    if (parsed && parsed.value !== 'true') {
      // Check if we also have the boolean attribute in negative mods
      const booleanMod = allMods.find((m) => {
        const p = maps.parsedMods.get(m);
        return (
          p &&
          p.value === 'true' &&
          p.attribute === parsed.attribute &&
          !currentMods.includes(m)
        );
      });

      if (booleanMod) {
        // We have both !([data-attr]) and !([data-attr="value"])
        // Skip the value negative as it's subsumed by attribute negative
        continue;
      }
    }

    optimizedNotMods.push(mod);
  }

  return optimizedNotMods;
}

/**
 * Explode a style handler result into logical rules with proper mapping
 * Phase 1: Handler fan-out ($ selectors, arrays)
 * Phase 2: Responsive fan-out (breakpoint arrays)
 * Phase 3: Rule materialization
 */
function explodeHandlerResult(
  result: any,
  zones: ResponsiveZone[],
  selectorSuffix = '',
  forceBreakpointIdx?: number,
  responsiveOrigin: boolean = false,
): LogicalRule[] {
  if (!result) return [];

  // Phase 1: Handler fan-out - normalize to array
  const resultArray = Array.isArray(result) ? result : [result];
  const logicalRules: LogicalRule[] = [];

  for (const item of resultArray) {
    if (!item || typeof item !== 'object') continue;

    const { $, ...styleProps } = item;

    // Phase 2: Responsive fan-out - handle array values
    const breakpointGroups = new Map<number, Record<string, string>>();

    if (forceBreakpointIdx !== undefined) {
      // When breakpoint is forced (from responsive processing), use all props for that breakpoint
      const group: Record<string, string> = {};
      for (const [prop, value] of Object.entries(styleProps)) {
        if (value != null && value !== '') {
          group[prop] = String(value);
        }
      }
      if (Object.keys(group).length > 0) {
        breakpointGroups.set(forceBreakpointIdx, group);
      }
    } else {
      // Normal processing - handle responsive arrays
      const responsiveProps: Array<{
        prop: string;
        value: any;
        breakpointIdx: number;
      }> = [];

      for (const [prop, value] of Object.entries(styleProps)) {
        if (Array.isArray(value)) {
          // Responsive array - create entry for each breakpoint
          value.forEach((val, idx) => {
            if (val != null && val !== '' && idx < zones.length) {
              responsiveProps.push({ prop, value: val, breakpointIdx: idx });
            }
          });
        } else if (value != null && value !== '') {
          // Single value - goes to base breakpoint
          responsiveProps.push({ prop, value, breakpointIdx: 0 });
        }
      }

      // Group by breakpoint index
      for (const { prop, value, breakpointIdx } of responsiveProps) {
        const group = breakpointGroups.get(breakpointIdx) || {};
        group[prop] = String(value);
        breakpointGroups.set(breakpointIdx, group);
      }
    }

    // Phase 3: Selector fan-out - handle $ suffixes
    // IMPORTANT: If we are already in a pseudo-element context (contains '::'),
    // CSS does not allow further descendant/child selectors (e.g., '>*') after
    // a pseudo-element. In such cases we must ignore only the `$`-derived
    // selectors while still preserving base declarations for the current
    // selector. Previously this branch returned early and accidentally dropped
    // all declarations computed before, including valid base ones.
    const inPseudoElementContext = selectorSuffix.includes('::');

    if (inPseudoElementContext && $) {
      // Skip this item entirely to avoid producing invalid selectors like
      // `.t0::before>*`. Other items (without $) in the same handler result
      // will still be processed and preserved.
      continue;
    }

    const suffixes = $
      ? (Array.isArray($) ? $ : [$]).map(
          (s) => selectorSuffix + normalizeDollarSelectorSuffix(String(s)),
        )
      : [selectorSuffix];

    // Early identical-breakpoint coalescing: skip duplicate declarations
    const seenDeclarations = new Map<string, number>();

    // Process breakpoints in order to prefer lower breakpoint indices
    const sortedBreakpoints = Array.from(breakpointGroups.entries()).sort(
      ([a], [b]) => a - b,
    );

    for (const [breakpointIdx, declarations] of sortedBreakpoints) {
      if (Object.keys(declarations).length === 0) continue;

      // Create a stable hash key for identical declarations
      const declarationKeys = Object.keys(declarations).sort();
      const declarationHash = declarationKeys
        .map((key) => `${key}:${declarations[key]}`)
        .join(';');

      const existingBreakpointIdx = seenDeclarations.get(declarationHash);
      if (existingBreakpointIdx !== undefined) {
        // Skip this breakpoint as it has identical declarations to a previous one
        // The CSS cascade will handle the responsive behavior correctly
        continue;
      }

      // Mark this declaration set as seen
      seenDeclarations.set(declarationHash, breakpointIdx);

      // Create logical rules for this unique declaration set
      for (const suffix of suffixes) {
        logicalRules.push({
          selectorSuffix: suffix,
          breakpointIdx,
          declarations,
          responsiveSource:
            responsiveOrigin || forceBreakpointIdx !== undefined,
        });
      }
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
 * Convert logical rules to final StyleResult format
 */
function materializeRules(
  logicalRules: LogicalRule[],
  className: string,
  zones: ResponsiveZone[],
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

    const q =
      rule.breakpointIdx > 0
        ? zones[rule.breakpointIdx]?.mediaQuery
        : rule.responsiveSource
          ? zones[0]?.mediaQuery
          : undefined;
    const atRules = q ? [`@media ${q}`] : undefined;

    return {
      selector,
      declarations,
      atRules,
    };
  });
}

/**
 * Core style processing logic that generates logical rules
 * Used by the unified renderStyles function
 */
function generateLogicalRules(
  styles: Styles,
  responsive: number[] = [],
  parentSuffix: string = '',
): LogicalRule[] {
  const zones = pointsToZones(responsive || []);
  const allLogicalRules: LogicalRule[] = [];

  // Cache for normalizeStyleZones results to avoid repeated computation
  // WeakMap allows automatic cleanup when arrays are garbage collected
  const normalizeCache = new WeakMap<any[], Map<number, any>>();

  // Helper function to get cached normalizeStyleZones result
  function cachedNormalizeStyleZones(value: any, zoneNumber: number): any {
    // Only cache for arrays - other types are fast to process
    if (!Array.isArray(value)) {
      return normalizeStyleZones(value, zoneNumber);
    }

    // Check if we have a cache for this array reference
    let zoneCache = normalizeCache.get(value);
    if (!zoneCache) {
      zoneCache = new Map<number, any>();
      normalizeCache.set(value, zoneCache);
    }

    // Check if we have a cached result for this zone count
    let result = zoneCache.get(zoneNumber);
    if (result === undefined) {
      result = normalizeStyleZones(value, zoneNumber);
      zoneCache.set(zoneNumber, result);
    }

    return result;
  }

  // Local versions of helpers that leverage cachedNormalizeStyleZones
  function stateMapToArrayOfStateMapsLocal(
    value: Record<string, any>,
    zoneNumber: number,
  ): Array<Record<string, any>> {
    // Short-circuit for single zone - avoid array allocation
    if (zoneNumber === 1) {
      const singleMap: Record<string, any> = {};
      for (const [state, stateValue] of Object.entries(value)) {
        if (Array.isArray(stateValue)) {
          // Take the first value from the array or null if empty
          singleMap[state] = stateValue.length > 0 ? stateValue[0] : null;
        } else {
          singleMap[state] = stateValue;
        }
      }
      return [singleMap];
    }

    const result: Array<Record<string, any>> = Array.from(
      { length: zoneNumber },
      () => ({}),
    );

    for (const [state, stateValue] of Object.entries(value)) {
      const perZone = Array.isArray(stateValue)
        ? (cachedNormalizeStyleZones(stateValue, zoneNumber) as any[])
        : Array(zoneNumber).fill(stateValue);

      for (let i = 0; i < zoneNumber; i++) {
        const v = perZone[i];
        result[i][state] = v;
      }
    }

    return result;
  }

  function normalizeArrayWithStateMapsLocal(
    valueArray: any[],
    zoneNumber: number,
  ): Array<Record<string, any>> {
    // Short-circuit for single zone - avoid array propagation and mapping
    if (zoneNumber === 1) {
      const firstEntry = valueArray.length > 0 ? valueArray[0] : null;
      if (
        firstEntry &&
        typeof firstEntry === 'object' &&
        !Array.isArray(firstEntry)
      ) {
        return [firstEntry as Record<string, any>];
      }
      return [{ '': firstEntry }];
    }

    const propagated = cachedNormalizeStyleZones(
      valueArray as any,
      zoneNumber,
    ) as any[];

    // Trim trailing null/undefined entries to reduce processing
    let lastNonNullIndex = propagated.length - 1;
    while (lastNonNullIndex >= 0 && propagated[lastNonNullIndex] == null) {
      lastNonNullIndex--;
    }

    // If all entries are null, return minimal array
    if (lastNonNullIndex < 0) {
      return Array.from({ length: zoneNumber }, () => ({ '': null }));
    }

    // Process only up to the last non-null entry, then fill the rest with the last value
    const result: Array<Record<string, any>> = [];
    let lastProcessedEntry: Record<string, any> | null = null;

    for (let i = 0; i <= lastNonNullIndex; i++) {
      const entry = propagated[i];
      let processedEntry: Record<string, any>;

      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        processedEntry = entry as Record<string, any>;
      } else {
        processedEntry = { '': entry };
      }

      result.push(processedEntry);
      lastProcessedEntry = processedEntry;
    }

    // Fill remaining slots with the last processed entry (CSS cascade behavior)
    for (let i = lastNonNullIndex + 1; i < zoneNumber; i++) {
      result.push(lastProcessedEntry || { '': null });
    }

    return result;
  }

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

        let isResponsive = false;
        const lookupStyles = handler.__lookupStyles;
        const filteredStyleMap = lookupStyles.reduce((map, name) => {
          const value = currentStyles?.[name];
          if (value !== undefined) {
            // Case 1: state-map-of-arrays → array-of-state-maps
            if (
              value &&
              typeof value === 'object' &&
              !Array.isArray(value) &&
              stateMapHasResponsiveArrays(value)
            ) {
              (map as any)[name] = stateMapToArrayOfStateMapsLocal(
                value as Record<string, any>,
                zones.length,
              );
              isResponsive = true;
            } else if (Array.isArray(value)) {
              // Case 2: array that may contain state maps → normalize to array-of-state-maps
              if (value.length > 0) {
                (map as any)[name] = normalizeArrayWithStateMapsLocal(
                  value as any[],
                  zones.length,
                );
                isResponsive = true;
              }
            } else {
              (map as any)[name] = value;
            }
          }

          return map;
        }, {} as StyleMap);

        handlerQueue.push({
          handler,
          styleMap: filteredStyleMap,
          isResponsive,
        });
      });
    });

    // Process handlers using the three-phase approach
    handlerQueue.forEach(({ handler, styleMap, isResponsive }) => {
      const lookupStyles = handler.__lookupStyles;

      if (isResponsive) {
        // For responsive styles, resolve arrays using normalizeStyleZones
        const valueMap = lookupStyles.reduce((map, style) => {
          map[style] = cachedNormalizeStyleZones(styleMap[style], zones.length);
          return map;
        }, {} as any);

        // Create props for each breakpoint
        const propsByPoint = zones.map((zone, i) => {
          const pointProps = {} as any;
          lookupStyles.forEach((style) => {
            if (valueMap != null && valueMap[style] != null) {
              pointProps[style] = valueMap[style][i];
            }
          });
          return pointProps;
        });

        // Call handler for each breakpoint, with state map processing if needed
        propsByPoint.forEach((pointProps, breakpointIdx) => {
          const hasStateMapsAtPoint = lookupStyles.some((style) => {
            const v = pointProps[style];
            return v && typeof v === 'object' && !Array.isArray(v);
          });

          if (hasStateMapsAtPoint) {
            const allMods = new Set<string>();
            const styleStates: Record<string, any> = {};

            lookupStyles.forEach((style) => {
              const v = pointProps[style];
              if (v && typeof v === 'object' && !Array.isArray(v)) {
                const { states, mods } = styleStateMapToStyleStateDataList(v);
                styleStates[style] = states;
                mods.forEach((m: string) => allMods.add(m));
              } else {
                styleStates[style] = [{ mods: [], notMods: [], value: v }];
              }
            });

            const allModsArray = Array.from(allMods);

            // Precompute attribute maps once for all combinations
            const attributeMaps = buildAttributeMaps([], allModsArray);

            // Generate combinations with conflict-aware pruning
            const conflictChecker = createAttributeConflictChecker(
              attributeMaps.parsedMods,
            );
            const combinations = getModCombinationsIterative(
              allModsArray,
              true,
              conflictChecker,
            );

            combinations.forEach((modCombination) => {
              const stateProps: Record<string, any> = {};

              lookupStyles.forEach((style) => {
                const states = styleStates[style];
                const matchingState = states.find((state: any) =>
                  computeState(state.model, (mod) =>
                    modCombination.includes(mod),
                  ),
                );
                if (matchingState) {
                  stateProps[style] = matchingState.value;
                }
              });

              // Use precomputed maps for efficient not selector optimization
              const currentMaps = buildAttributeMaps(
                modCombination,
                allModsArray,
              );
              const optimizedNotMods = optimizeNotSelectors(
                modCombination,
                allModsArray,
                currentMaps,
              );

              // Check for contradictions between positive and negative selectors
              if (
                hasContradiction(
                  modCombination,
                  optimizedNotMods,
                  currentMaps.parsedMods,
                )
              ) {
                return; // Skip this invalid combination
              }

              const modsSelectors = `${modCombination
                .map(getModSelector)
                .join('')}${optimizedNotMods
                .map((mod) => {
                  const sel = getModSelector(mod);
                  return sel.startsWith(':not(')
                    ? sel.slice(5, -1)
                    : `:not(${sel})`;
                })
                .join('')}`;

              const result = handler(stateProps as any);
              if (!result) return;

              const logicalRules = explodeHandlerResult(
                result,
                zones || [],
                `${modsSelectors}${parentSuffix}`,
                breakpointIdx,
                true,
              );
              allLogicalRules.push(...logicalRules);
            });
          } else {
            const result = handler(pointProps as any);
            if (!result) return;

            const logicalRules = explodeHandlerResult(
              result,
              zones || [],
              parentSuffix,
              breakpointIdx,
              true,
            );
            allLogicalRules.push(...logicalRules);
          }
        });
      } else {
        // For non-responsive styles, check if any values have state maps
        const hasStateMaps = lookupStyles.some((style) => {
          const value = styleMap[style];
          return value && typeof value === 'object' && !Array.isArray(value);
        });

        if (hasStateMaps) {
          // Process each style property individually for state resolution
          const allMods = new Set<string>();
          const styleStates: Record<string, any> = {};

          lookupStyles.forEach((style) => {
            const value = styleMap[style];
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              const { states, mods } = styleStateMapToStyleStateDataList(value);
              styleStates[style] = states;
              mods.forEach((mod) => allMods.add(mod));
            } else {
              // Simple value, create a single state
              styleStates[style] = [{ mods: [], notMods: [], value }];
            }
          });

          // Generate all possible mod combinations
          const allModsArray = Array.from(allMods);

          // Precompute attribute maps once for all combinations
          const attributeMaps = buildAttributeMaps([], allModsArray);

          // Generate combinations with conflict-aware pruning
          const conflictChecker = createAttributeConflictChecker(
            attributeMaps.parsedMods,
          );
          const combinations = getModCombinationsIterative(
            allModsArray,
            true,
            conflictChecker,
          );

          combinations.forEach((modCombination) => {
            const stateProps: Record<string, any> = {};

            lookupStyles.forEach((style) => {
              const states = styleStates[style];
              // Find the matching state for this mod combination
              const matchingState = states.find((state) => {
                return computeState(state.model, (mod) =>
                  modCombination.includes(mod),
                );
              });
              if (matchingState) {
                stateProps[style] = matchingState.value;
              }
            });

            // Use precomputed maps for efficient not selector optimization
            const currentMaps = buildAttributeMaps(
              modCombination,
              allModsArray,
            );
            const optimizedNotMods = optimizeNotSelectors(
              modCombination,
              allModsArray,
              currentMaps,
            );

            // Check for contradictions between positive and negative selectors
            if (
              hasContradiction(
                modCombination,
                optimizedNotMods,
                currentMaps.parsedMods,
              )
            ) {
              return; // Skip this invalid combination
            }

            const modsSelectors = `${modCombination
              .map(getModSelector)
              .join('')}${optimizedNotMods
              .map((mod) => {
                const sel = getModSelector(mod);
                return sel.startsWith(':not(')
                  ? sel.slice(5, -1)
                  : `:not(${sel})`;
              })
              .join('')}`;

            // If any state value is responsive (array), fan-out by breakpoint
            const hasResponsiveStateValues = lookupStyles.some((style) =>
              Array.isArray(stateProps[style]),
            );

            if (hasResponsiveStateValues) {
              const propsByPoint = zones.map((_, i) => {
                const pointProps: Record<string, any> = {};
                lookupStyles.forEach((style) => {
                  const v = stateProps[style];
                  if (Array.isArray(v)) {
                    const arr = cachedNormalizeStyleZones(v, zones.length);
                    pointProps[style] = arr?.[i];
                  } else {
                    pointProps[style] = v;
                  }
                });
                return pointProps;
              });

              propsByPoint.forEach((props, breakpointIdx) => {
                const res = handler(props as any);
                if (!res) return;
                const logical = explodeHandlerResult(
                  res,
                  zones || [],
                  `${modsSelectors}${parentSuffix}`,
                  breakpointIdx,
                  true,
                );
                allLogicalRules.push(...logical);
              });
            } else {
              // Simple non-responsive state values
              const result = handler(stateProps as any);
              if (!result) return;
              const logical = explodeHandlerResult(
                result,
                zones || [],
                `${modsSelectors}${parentSuffix}`,
              );
              allLogicalRules.push(...logical);
            }
          });
        } else {
          // Simple case: no state maps, call handler directly
          const result = handler(styleMap as any);
          if (result) {
            const logical = explodeHandlerResult(
              result,
              zones || [],
              parentSuffix,
            );
            allLogicalRules.push(...logical);
          }
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
export function renderStyles(
  styles?: Styles,
  responsive?: number[],
  className?: string,
): RenderResult;

/**
 * Render styles without className for element styles (injector will add it)
 */
export function renderStyles(
  styles: Styles | undefined,
  responsive?: number[],
): RenderResult;

/**
 * Render styles for direct injection with a specific selector
 * Bypasses CSS text generation and flattening by directly creating StyleResult[]
 */
export function renderStyles(
  styles: Styles | undefined,
  responsive: number[],
  selector: string,
): StyleResult[];

export function renderStyles(
  styles?: Styles,
  responsive: number[] = [],
  classNameOrSelector?: string,
): RenderResult | StyleResult[] {
  const directSelector = !!classNameOrSelector;

  if (!styles) {
    return directSelector ? [] : { rules: [] };
  }

  // Generate logical rules using shared pipeline
  const allLogicalRules = generateLogicalRules(styles, responsive);
  const zones = pointsToZones(responsive || []);

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

      const q =
        rule.breakpointIdx > 0
          ? zones[rule.breakpointIdx]?.mediaQuery
          : rule.responsiveSource
            ? zones[0]?.mediaQuery
            : undefined;
      const atRules = q ? [`@media ${q}`] : undefined;

      return {
        selector: finalSelector,
        declarations,
        atRules,
      };
    });
  }

  // Standard mode: use accumulation and materialization with className
  const accumulatedRules = new Map<string, LogicalRule>();

  for (const rule of allLogicalRules) {
    // Create a key based on breakpointIdx, selectorSuffix, and responsiveOrigin
    const ruleKey = `${rule.breakpointIdx}|${rule.selectorSuffix}|${rule.responsiveSource}`;

    const existing = accumulatedRules.get(ruleKey);
    if (existing) {
      // Merge declarations from this rule into the existing one
      Object.assign(existing.declarations, rule.declarations);
    } else {
      // Create a new accumulated rule
      accumulatedRules.set(ruleKey, {
        selectorSuffix: rule.selectorSuffix,
        breakpointIdx: rule.breakpointIdx,
        declarations: { ...rule.declarations },
        responsiveSource: rule.responsiveSource,
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

        const q =
          rule.breakpointIdx > 0
            ? zones[rule.breakpointIdx]?.mediaQuery
            : rule.responsiveSource
              ? zones[0]?.mediaQuery
              : undefined;
        const atRules = q ? [`@media ${q}`] : undefined;

        return {
          selector: rule.selectorSuffix || '',
          declarations,
          atRules,
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
    zones || [],
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
