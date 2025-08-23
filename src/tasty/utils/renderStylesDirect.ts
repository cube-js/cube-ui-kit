/**
 * Direct style rendering that bypasses CSS string conversion
 * This eliminates the performance bottleneck of string-to-object-to-string conversion
 */

import { createStyle, STYLE_HANDLER_MAP } from '../styles';
import { Styles } from '../styles/types';

import { mediaWrapper, normalizeStyleZones, pointsToZones } from './responsive';
import { StyleHandler, StyleMap } from './styles';

export interface StyleResult {
  selector: string;
  declarations: string;
  atRules?: string[];
}

export interface DirectRenderResult {
  rules: StyleResult[];
  className?: string;
}

interface LogicalRule {
  selectorSuffix: string; // '', ':hover', '>*', …
  breakpointIdx: number; // 0 = base
  declarations: Record<string, string>;
}

type HandlerQueueItem = {
  handler: StyleHandler;
  styleMap: StyleMap;
  isResponsive: boolean;
};

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

/**
 * Explode a style handler result into logical rules with proper mapping
 * Phase 1: Handler fan-out ($ selectors, arrays)
 * Phase 2: Responsive fan-out (breakpoint arrays)
 * Phase 3: Rule materialization
 */
function explodeHandlerResult(
  result: any,
  zones: string[],
  selectorSuffix = '',
  forceBreakpointIdx?: number,
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
    const suffixes = $
      ? (Array.isArray($) ? $ : [$]).map((s) => selectorSuffix + s)
      : [selectorSuffix];

    // Create logical rules for each breakpoint × selector combination
    for (const [breakpointIdx, declarations] of breakpointGroups) {
      if (Object.keys(declarations).length === 0) continue;

      for (const suffix of suffixes) {
        logicalRules.push({
          selectorSuffix: suffix,
          breakpointIdx,
          declarations,
        });
      }
    }
  }

  return logicalRules;
}

/**
 * Parse CSS string back to logical rules (temporary solution for state bindings)
 */
function parseCssStringToLogicalRules(
  cssString: string,
  className: string,
): LogicalRule[] {
  const logicalRules: LogicalRule[] = [];

  // Simple regex to match CSS rules like "&:hover { color: red; }"
  const ruleRegex = /([^{]+)\s*\{\s*([^}]+)\s*\}/g;
  let match;

  while ((match = ruleRegex.exec(cssString)) !== null) {
    const [, selectorPart, declarationsPart] = match;

    // Extract selector suffix (remove & and trim)
    let selectorSuffix = selectorPart.replace(/^&/, '').trim();

    // Parse declarations
    const declarations: Record<string, string> = {};
    const declRegex = /([^:]+):\s*([^;]+);?/g;
    let declMatch;

    while ((declMatch = declRegex.exec(declarationsPart)) !== null) {
      const [, prop, value] = declMatch;
      declarations[prop.trim()] = value.trim();
    }

    if (Object.keys(declarations).length > 0) {
      logicalRules.push({
        selectorSuffix,
        breakpointIdx: 0, // CSS from wrapped handlers is typically base-level
        declarations,
      });
    }
  }

  return logicalRules;
}

/**
 * Convert logical rules to final StyleResult format
 */
function materializeRules(
  logicalRules: LogicalRule[],
  className: string,
  zones: string[],
): StyleResult[] {
  return logicalRules.map((rule) => {
    const selector = `.${className}${rule.selectorSuffix}`;

    const declarations = Object.entries(rule.declarations)
      .filter(([key]) => key !== '--raw-css') // Skip raw CSS for now
      .map(([prop, value]) => `${prop}: ${value};`)
      .join(' ');

    const atRules =
      rule.breakpointIdx > 0 && zones[rule.breakpointIdx]
        ? [`@media ${zones[rule.breakpointIdx]}`]
        : undefined;

    return {
      selector,
      declarations,
      atRules,
    };
  });
}

/**
 * Render styles directly without CSS string conversion
 * This is a performance-optimized version of renderStyles
 */
export function renderStylesDirect(
  styles?: Styles,
  responsive: number[] = [],
  className: string = 'unknown',
): DirectRenderResult {
  if (!styles) {
    return { rules: [] };
  }

  const zones = pointsToZones(responsive || []);
  const handlerQueue: HandlerQueueItem[] = [];
  const keys = Object.keys(styles);
  const selectorKeys = keys.filter((key) => isSelector(key));
  const baseSelector = `.${className}`;

  // Collect all logical rules
  const allLogicalRules: LogicalRule[] = [];

  // Handle nested selectors (like &:hover, .SubElement)
  for (const key of selectorKeys) {
    const selectorSuffix = getSelector(key);
    if (selectorSuffix && styles[key]) {
      const nestedStyles = styles[key] as Styles;
      const nestedResult = renderStylesDirect(
        nestedStyles,
        responsive,
        className,
      );

      // Convert nested rules to logical rules with adjusted selectors
      for (const rule of nestedResult.rules) {
        allLogicalRules.push({
          selectorSuffix: selectorSuffix,
          breakpointIdx: 0, // Nested selectors are typically base-level
          declarations: rule.declarations
            .split(';')
            .filter((decl) => decl.trim())
            .reduce(
              (acc, decl) => {
                const [prop, value] = decl.split(':').map((s) => s.trim());
                if (prop && value) acc[prop] = value;
                return acc;
              },
              {} as Record<string, string>,
            ),
        });
      }
    }
  }

  // Build handler queue for base styles
  keys.forEach((styleName) => {
    if (isSelector(styleName)) return;

    let handlers: StyleHandler[] = STYLE_HANDLER_MAP[styleName];

    if (!handlers) {
      handlers = STYLE_HANDLER_MAP[styleName] = [createStyle(styleName)];
    }

    handlers.forEach((handler) => {
      if (handlerQueue.find((queueItem) => queueItem.handler === handler)) {
        return;
      }

      let isResponsive = false;
      const lookupStyles = handler.__lookupStyles;
      const filteredStyleMap = lookupStyles.reduce((map, name) => {
        const value = styles?.[name];
        if (value !== undefined) {
          (map as any)[name] = value;

          if (Array.isArray(value)) {
            if (value.length === 0) {
              delete (map as any)[name];
            } else {
              // Keep arrays for responsive processing - don't flatten to single value
              isResponsive = true;
            }
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

      // Call original handler for each breakpoint (bypassing state resolution for simple values)
      propsByPoint.forEach((props, breakpointIdx) => {
        const originalHandler = (handler as any).__originalHandler || handler;
        const result = originalHandler(props);
        if (result) {
          const logicalRules = explodeHandlerResult(
            result,
            zones || [],
            '',
            breakpointIdx,
          );
          allLogicalRules.push(...logicalRules);
        }
      });
    } else {
      // For non-responsive styles, use wrapped handler (handles state bindings)
      // The wrapped handler returns CSS string, so we need to parse it
      const cssResult = handler(styleMap as any);
      if (cssResult && typeof cssResult === 'string') {
        // Parse the CSS string back to rules - this is a temporary solution
        // TODO: We should modify handlers to return structured data instead of CSS strings
        const tempLogicalRules = parseCssStringToLogicalRules(
          cssResult,
          className,
        );
        allLogicalRules.push(...tempLogicalRules);
      }
    }
  });

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
 * Render styles directly for global injection (without class names)
 * Returns CSS with & selectors that injectGlobal can process
 */
export function renderStylesDirectForGlobal(
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
      innerStyles += renderStylesDirectForGlobal(
        nestedStyles,
        responsive,
      ).replace(/&/g, `&${selectorSuffix}`);
    }
  }

  // Build handler queue for base styles
  keys.forEach((styleName) => {
    if (isSelector(styleName)) return;

    let handlers: StyleHandler[] = STYLE_HANDLER_MAP[styleName];

    if (!handlers) {
      handlers = STYLE_HANDLER_MAP[styleName] = [createStyle(styleName)];
    }

    handlers.forEach((handler) => {
      if (handlerQueue.find((queueItem) => queueItem.handler === handler)) {
        return;
      }

      let isResponsive = false;
      const lookupStyles = handler.__lookupStyles;
      const filteredStyleMap = lookupStyles.reduce((map, name) => {
        const value = styles?.[name];
        if (value !== undefined) {
          (map as any)[name] = value;

          if (Array.isArray(value)) {
            if (value.length === 0) {
              delete (map as any)[name];
            } else {
              isResponsive = true;
            }
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

  // Process handlers - similar to original renderStyles approach
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

      // Call handler for each breakpoint
      const rulesByPoint = propsByPoint.map((props) => {
        // Use wrapped handler to get CSS string with & selectors
        return handler(props) || '';
      });

      rulesByPoint.forEach((rules, i) => {
        responsiveStyles[i] += rules || '';
      });
    } else {
      // For non-responsive styles, use wrapped handler
      const cssResult =
        (handler(styleMap as any, '') as unknown as string) || '';

      // Handle different CSS rule formats
      if (cssResult) {
        if (cssResult.startsWith('& {') && !cssResult.includes('&', 2)) {
          // Simple rule: "& { declarations }"
          const declarationBlock = cssResult.slice(3, -1).trim(); // Remove "& {" and "}"
          if (declarationBlock) {
            declarations.push(declarationBlock);
          }
        } else {
          // Complex rule with nested selectors or state modifiers - keep as-is
          innerStyles += cssResult;
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
