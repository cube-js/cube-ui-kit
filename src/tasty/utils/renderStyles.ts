/**
 * Style rendering that works with structured style objects
 * Eliminates CSS string parsing for better performance
 */

import { Lru } from '../parser/lru';
import { createStyle, STYLE_HANDLER_MAP } from '../styles';
import { Styles } from '../styles/types';

import {
  mediaWrapper,
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

// Convert a state-map-of-arrays into an array-of-state-maps of length zoneNumber
// Example:
//   { '': ['1x', '2x'], large: [null, '3x'] } →
//   [ { '': '1x', large: null }, { '': '2x', large: '3x' } ]
function stateMapToArrayOfStateMaps(
  value: Record<string, any>,
  zoneNumber: number,
): Array<Record<string, any>> {
  const result: Array<Record<string, any>> = Array.from(
    { length: zoneNumber },
    () => ({}),
  );

  for (const [state, stateValue] of Object.entries(value)) {
    const perZone = Array.isArray(stateValue)
      ? (normalizeStyleZones(stateValue, zoneNumber) as any[])
      : Array(zoneNumber).fill(stateValue);

    for (let i = 0; i < zoneNumber; i++) {
      const v = perZone[i];
      // Always include the state in the result, even if null or empty
      // This preserves the state structure across all breakpoints
      result[i][state] = v;
    }
  }

  return result;
}

// Normalize an array that may contain plain values and/or state maps into
// an array-of-state-maps of fixed length zoneNumber with propagation.
// Example:
//   ['1x', { '': '1x', large: '2x' }] (zoneNumber=2) →
//   [ { '': '1x' }, { '': '1x', large: '2x' } ]
function normalizeArrayWithStateMaps(
  valueArray: any[],
  zoneNumber: number,
): Array<Record<string, any>> {
  const propagated = normalizeStyleZones(
    valueArray as any,
    zoneNumber,
  ) as any[];
  return propagated.map((entry) => {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      return entry as Record<string, any>;
    }
    return { '': entry } as Record<string, any>;
  });
}

export interface StyleResult {
  selector: string;
  declarations: string;
  atRules?: string[];
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
 * Get the selector suffix for a key
 */
function getSelector(key: string): string | null {
  if (key.startsWith('&')) {
    return key.slice(1);
  }

  if (key.startsWith('.')) {
    return ` ${key}`;
  }

  if (key.match(/^[A-Z]/)) {
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

  // Match patterns like [data-size="medium"] or [data-is-selected]
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

function optimizeNotSelectors(
  currentMods: string[],
  allMods: string[],
  precomputedMaps?: AttributeMaps,
): string[] {
  const maps = precomputedMaps || buildAttributeMaps(currentMods, allMods);

  const notMods = allMods.filter((mod) => !currentMods.includes(mod));
  const optimizedNotMods: string[] = [];

  for (const mod of notMods) {
    const parsed = maps.parsedMods.get(mod);

    if (parsed && parsed.value !== 'true') {
      // If we already have a value for this attribute, skip this not selector
      // because it's already mutually exclusive
      if (maps.currentAttributes.has(parsed.attribute)) {
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

    const { $, css, ...styleProps } = item;

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

    // Handle raw CSS if present (add to base breakpoint)
    if (css && typeof css === 'string') {
      const baseGroup = breakpointGroups.get(0) || {};
      // For now, we'll add raw CSS as a special property
      // This is a limitation - raw CSS should be parsed properly
      baseGroup['--raw-css'] = css;
      breakpointGroups.set(0, baseGroup);
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

    // Create logical rules for each breakpoint × selector combination
    for (const [breakpointIdx, declarations] of breakpointGroups) {
      if (Object.keys(declarations).length === 0) continue;

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
    return result.reduce((css, item) => {
      return css + convertHandlerResultToCSS(item, selectorSuffix);
    }, '');
  }

  const { $, css, ...styleProps } = result;
  let renderedStyles = Object.keys(styleProps).reduce(
    (styleList, styleName) => {
      const value = styleProps[styleName];

      if (Array.isArray(value)) {
        return (
          styleList +
          value.reduce((css, val) => {
            if (val) {
              return css + `${styleName}: ${val};\n`;
            }
            return css;
          }, '')
        );
      }

      if (value) {
        return `${styleList}${styleName}: ${value};\n`;
      }

      return styleList;
    },
    '',
  );

  if (css) {
    renderedStyles = css + '\n' + renderedStyles;
  }

  if (!renderedStyles) {
    return '';
  }

  const finalSelectorSuffix = selectorSuffix || '';

  if (Array.isArray($)) {
    return $.reduce((rend, suffix) => {
      const normalized = suffix
        ? normalizeDollarSelectorSuffix(String(suffix))
        : '';
      return (
        rend + `&${finalSelectorSuffix}${normalized}{\n${renderedStyles}}\n`
      );
    }, '');
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
    const selector = `.${className}${rule.selectorSuffix}`;

    const declarations = Object.entries(rule.declarations)
      .filter(([key]) => key !== '--raw-css') // Skip raw CSS for now
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
 * Render styles without CSS string conversion
 * This is a performance-optimized version of renderStyles
 */
export function renderStyles(
  styles?: Styles,
  responsive: number[] = [],
  className: string = 'unknown',
): RenderResult {
  if (!styles) {
    return { rules: [] };
  }

  const zones = pointsToZones(responsive || []);
  // Collect all logical rules
  const allLogicalRules: LogicalRule[] = [];

  // Process styles recursively, preserving mod selectors and combining with nested selector suffixes
  function processStyles(currentStyles: Styles, parentSuffix: string = '') {
    const keys = Object.keys(currentStyles || {});
    const selectorKeys = keys.filter((key) => isSelector(key));

    // Recurse into nested selectors first to compute proper suffix chaining
    for (const key of selectorKeys) {
      const suffix = getSelector(key);
      if (suffix && currentStyles[key]) {
        processStyles(currentStyles[key] as Styles, `${parentSuffix}${suffix}`);
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
              (map as any)[name] = stateMapToArrayOfStateMaps(
                value as Record<string, any>,
                zones.length,
              );
              isResponsive = true;
            } else if (Array.isArray(value)) {
              // Case 2: array that may contain state maps → normalize to array-of-state-maps
              if (value.length > 0) {
                (map as any)[name] = normalizeArrayWithStateMaps(
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
          map[style] = normalizeStyleZones(styleMap[style], zones.length);
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

            const combinations: string[][] = [[]];
            for (let i = 0; i < allModsArray.length; i++) {
              const currentLength = combinations.length;
              for (let j = 0; j < currentLength; j++) {
                const newCombination = [...combinations[j], allModsArray[i]];
                if (
                  !hasConflictingAttributeSelectors(
                    newCombination,
                    attributeMaps.parsedMods,
                  )
                ) {
                  combinations.push(newCombination);
                }
              }
            }

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

          const combinations: string[][] = [[]]; // Start with empty combination

          // Generate all combinations (including empty)
          for (let i = 0; i < allModsArray.length; i++) {
            const currentLength = combinations.length;
            for (let j = 0; j < currentLength; j++) {
              const newCombination = [...combinations[j], allModsArray[i]];
              // Skip combinations with conflicting attribute selectors
              if (
                !hasConflictingAttributeSelectors(
                  newCombination,
                  attributeMaps.parsedMods,
                )
              ) {
                combinations.push(newCombination);
              }
            }
          }

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
                    const arr = normalizeStyleZones(v, zones.length);
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
  processStyles(styles, '');

  // Materialize all logical rules into final format
  const finalRulesRaw = materializeRules(
    allLogicalRules,
    className,
    zones || [],
  );

  // De-duplicate identical rules (same selector, declarations, and at-rules)
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
    className,
  };
}

/**
 * Render styles for global injection (without class names)
 * Returns CSS with & selectors that injectGlobal can process
 */
export function renderStylesForGlobal(
  styles?: Styles,
  responsive: number[] = [],
): string {
  if (!styles) {
    return '';
  }

  const zones = pointsToZones(responsive || []);
  const handlerQueue: HandlerQueueItem[] = [];
  const keys = Object.keys(styles);
  const selectorKeys = keys.filter((key) => isSelector(key));

  const declarations: string[] = [];
  const responsiveStyles = Array.from(Array(zones.length)).map(() => '');
  let innerStyles = '';

  // Handle nested selectors (like &:hover, .SubElement)
  for (const key of selectorKeys) {
    const selectorSuffix = getSelector(key);
    if (selectorSuffix && styles[key]) {
      const nestedStyles = styles[key] as Styles;
      innerStyles += renderStylesForGlobal(nestedStyles, responsive).replace(
        /&/g,
        `&${selectorSuffix}`,
      );
    }
  }

  // Build handler queue for base styles
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
        const value = styles?.[name];
        if (value !== undefined) {
          if (
            value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            stateMapHasResponsiveArrays(value)
          ) {
            (map as any)[name] = stateMapToArrayOfStateMaps(
              value as Record<string, any>,
              zones.length,
            );
            isResponsive = true;
          } else if (Array.isArray(value)) {
            if (value.length > 0) {
              (map as any)[name] = normalizeArrayWithStateMaps(
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

  // Process handlers using approach
  handlerQueue.forEach(({ handler, styleMap, isResponsive }) => {
    const lookupStyles = handler.__lookupStyles;

    if (isResponsive) {
      // For responsive styles, resolve arrays using normalizeStyleZones
      const valueMap = lookupStyles.reduce((map, style) => {
        map[style] = normalizeStyleZones(styleMap[style], zones.length);
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

      // Call handler for each breakpoint and convert to CSS, with state processing
      propsByPoint.forEach((pointProps, i) => {
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

          const combinations: string[][] = [[]];
          for (let a = 0; a < allModsArray.length; a++) {
            const currentLength = combinations.length;
            for (let b = 0; b < currentLength; b++) {
              const newCombination = [...combinations[b], allModsArray[a]];
              if (
                !hasConflictingAttributeSelectors(
                  newCombination,
                  attributeMaps.parsedMods,
                )
              ) {
                combinations.push(newCombination);
              }
            }
          }

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

            const cssResult = convertHandlerResultToCSS(result, modsSelectors);
            if (cssResult) {
              responsiveStyles[i] += cssResult;
            }
          });
        } else {
          const result = handler(pointProps as any);
          if (!result) return;
          const cssResult = convertHandlerResultToCSS(result);
          if (cssResult) {
            responsiveStyles[i] += cssResult;
          }
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

        const combinations: string[][] = [[]]; // Start with empty combination

        // Generate all combinations (including empty)
        for (let i = 0; i < allModsArray.length; i++) {
          const currentLength = combinations.length;
          for (let j = 0; j < currentLength; j++) {
            const newCombination = [...combinations[j], allModsArray[i]];
            // Skip combinations with conflicting attribute selectors
            if (
              !hasConflictingAttributeSelectors(
                newCombination,
                attributeMaps.parsedMods,
              )
            ) {
              combinations.push(newCombination);
            }
          }
        }

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

          const result = handler(stateProps as any);
          if (!result) return;

          // Use precomputed maps for efficient not selector optimization
          const currentMaps = buildAttributeMaps(modCombination, allModsArray);
          const optimizedNotMods = optimizeNotSelectors(
            modCombination,
            allModsArray,
            currentMaps,
          );
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

          // Convert to CSS with proper selectors
          const cssResult = convertHandlerResultToCSS(result, modsSelectors);

          if (cssResult) {
            if (cssResult.startsWith('& {') && !cssResult.includes('&', 2)) {
              // Simple rule: "& { declarations }"
              const declarationBlock = cssResult.slice(3, -1).trim();
              if (declarationBlock) {
                declarations.push(declarationBlock);
              }
            } else {
              // Complex rule with nested selectors or state modifiers
              innerStyles += cssResult;
            }
          }
        });
      } else {
        // Simple case: no state maps, call handler directly
        const result = handler(styleMap as any);
        if (result) {
          const cssResult = convertHandlerResultToCSS(result);

          if (cssResult) {
            if (cssResult.startsWith('& {') && !cssResult.includes('&', 2)) {
              // Simple rule: "& { declarations }"
              const declarationBlock = cssResult.slice(3, -1).trim();
              if (declarationBlock) {
                declarations.push(declarationBlock);
              }
            } else {
              // Complex rule with nested selectors or state modifiers
              innerStyles += cssResult;
            }
          }
        }
      }
    }
  });

  // Build final CSS similar to original renderStyles
  // Merge all declarations into a single rule
  const baseRule =
    declarations.length > 0 ? `& { ${declarations.join('\n')} }` : '';

  const mediaRules =
    responsive && responsive.length && responsiveStyles.some((s) => s)
      ? mediaWrapper(responsiveStyles, zones)
      : '';

  // Ensure we always separate the base rule, inner complex selectors and media rules with
  // a newline so the selector replacement step ( & -> actual selector ) cannot accidentally
  // concatenate two selectors and create the invalid form "..selector selector".
  const parts = [baseRule, innerStyles, mediaRules].filter(Boolean);
  const result = parts.join('\n');

  return result;
}
