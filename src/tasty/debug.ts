/**
 * Debug utilities for inspecting tasty-generated CSS at runtime
 */

import { getCssText, getCssTextForNode, injector } from './injector';
import { isDevEnv } from './utils/isDevEnv';

// Type definitions for the new API
type CSSTarget =
  | 'all' // tasty CSS + tasty global CSS (createGlobalStyle)
  | 'global' // only tasty global CSS
  | 'active' // tasty CSS for classes currently in DOM
  | 'unused' // tasty CSS with refCount = 0 (still in cache but not actively used)
  | 'page' // ALL CSS on the page across stylesheets (not only tasty)
  | string // 't123' tasty class or a CSS selector
  | string[] // array of tasty classes like ['t1', 't2']
  | Element; // a DOM element

interface CssOptions {
  root?: Document | ShadowRoot;
  prettify?: boolean; // default: true
  log?: boolean; // default: false
}

interface InspectResult {
  element?: Element | null;
  classes: string[]; // tasty classes found on the element
  css: string; // full, prettified CSS affecting the element
  size: number; // characters in css
  rules: number; // number of rule blocks
}

interface CacheMetrics {
  hits: number;
  misses: number;
  bulkCleanups: number;
  totalInsertions: number;
  totalUnused: number;
  stylesCleanedUp: number;
  cleanupHistory: Array<{
    timestamp: number;
    classesDeleted: number;
    cssSize: number;
    rulesDeleted: number;
  }>;
  startTime: number;

  // Calculated metrics
  unusedHits?: number; // calculated as current unused count
}

interface CacheStatus {
  classes: {
    active: string[]; // classes with refCount > 0 and present in DOM
    unused: string[]; // classes with refCount = 0 but still in cache
    all: string[]; // union of both
  };
  metrics: CacheMetrics | null;
}

interface GlobalBreakdown {
  css: string; // prettified tasty global CSS
  totalRules: number;
  totalCSSSize: number;
  selectors: {
    elements: string[];
    classes: string[];
    ids: string[];
    pseudoClasses: string[];
    mediaQueries: string[];
    keyframes: string[];
    other: string[];
  };
}

interface Definitions {
  properties: string[]; // defined via @property
  keyframes: Array<{ name: string; refCount: number }>;
}

interface SummaryOptions {
  root?: Document | ShadowRoot;
  log?: boolean;
  includePageCSS?:
    | false // do not include page-level CSS stats (default)
    | true // include sizes/counts only
    | 'all'; // include stats and return full page CSS string
}

interface Summary {
  // Classes
  activeClasses: string[];
  unusedClasses: string[];
  totalStyledClasses: string[];

  // Tasty CSS sizes
  activeCSSSize: number;
  unusedCSSSize: number;
  totalCSSSize: number; // tasty-only: active + unused + tasty global

  // Tasty CSS payloads
  activeCSS: string;
  unusedCSS: string;
  allCSS: string; // tasty-only CSS (active + unused + tasty global)

  // Tasty global (createGlobalStyle)
  globalCSS: string;
  globalCSSSize: number;
  globalRuleCount: number;

  // Page-level CSS (across all stylesheets, not only tasty) — shown when includePageCSS != false
  page?: {
    css?: string; // present only when includePageCSS === 'all'
    cssSize: number; // total characters
    ruleCount: number; // approximate rule count
    stylesheetCount: number; // stylesheets scanned (CORS-safe)
    skippedStylesheets: number; // stylesheets skipped due to cross-origin/CORS
  };

  // Metrics & definitions
  metrics: CacheMetrics | null;
  definedProperties: string[];
  definedKeyframes: Array<{ name: string; refCount: number }>;
  propertyCount: number;
  keyframeCount: number;

  // Cleanup summary
  cleanupSummary: {
    enabled: boolean;
    totalCleanups: number;
    totalClassesDeleted: number;
    totalCssDeleted: number;
    totalRulesDeleted: number;
    averageClassesPerCleanup: number;
    averageCssPerCleanup: number;
    averageRulesPerCleanup: number;
    lastCleanup?: {
      timestamp: number;
      date: string;
      classesDeleted: number;
      cssSize: number;
      rulesDeleted: number;
    };
  };
}

/**
 * Pretty-print CSS with proper indentation and formatting
 */
function prettifyCSS(css: string): string {
  if (!css || css.trim() === '') {
    return '';
  }

  // First, normalize whitespace but preserve structure
  let formatted = css.replace(/\s+/g, ' ').trim();

  // Add newlines after opening braces
  formatted = formatted.replace(/\s*\{\s*/g, ' {\n');

  // Add newlines after semicolons (but not inside strings or functions)
  formatted = formatted.replace(/;(?![^"']*["'][^"']*$)(?![^()]*\))/g, ';\n');

  // Add newlines before closing braces
  formatted = formatted.replace(/\s*\}\s*/g, '\n}\n');

  // Handle comma-separated selectors (only outside of property values)
  // This regex looks for commas that are:
  // 1. Not inside quotes
  // 2. Not inside parentheses (CSS functions)
  // 3. Not followed by a colon (not in a property value)
  formatted = formatted.replace(
    /,(?![^"']*["'][^"']*$)(?![^()]*\))(?=.*:.*\{|.*\{)/g,
    ',\n',
  );

  // Process line by line for proper indentation
  const lines = formatted.split('\n');
  let indentLevel = 0;
  const indentSize = 2;

  const formattedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '';

    // Handle closing braces - decrease indent first
    if (trimmed === '}') {
      indentLevel = Math.max(0, indentLevel - 1);
      return ' '.repeat(indentLevel * indentSize) + trimmed;
    }

    // Current line with proper indentation
    const indent = ' '.repeat(indentLevel * indentSize);
    let result = indent + trimmed;

    // Handle opening braces - increase indent for next line
    if (trimmed.endsWith('{')) {
      indentLevel++;
    }

    return result;
  });

  // Clean up the result and ensure proper spacing
  let result = formattedLines
    .filter((line) => line.trim()) // Remove empty lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .trim();

  // Final cleanup: ensure single spaces in function calls
  result = result.replace(/,\s+/g, ', ');

  return result;
}

// Helper functions
function findAllTastyClasses(root: Document | ShadowRoot = document): string[] {
  const classes = new Set<string>();
  const elements = (root as Document).querySelectorAll?.('[class]') || [];

  elements.forEach((element) => {
    const classList = element.getAttribute('class');
    if (classList) {
      const tastyClasses = classList
        .split(/\s+/)
        .filter((cls) => /^t\d+$/.test(cls));
      tastyClasses.forEach((cls) => classes.add(cls));
    }
  });

  return Array.from(classes).sort((a, b) => {
    const aNum = parseInt(a.slice(1));
    const bNum = parseInt(b.slice(1));
    return aNum - bNum;
  });
}

function findAllStyledClasses(
  root: Document | ShadowRoot = document,
): string[] {
  // Extract tasty classes from all CSS text by parsing selectors
  const allCSS = injector.instance.getCssText({ root });
  const classes = new Set<string>();

  // Simple regex to find .t{number} class selectors
  const classRegex = /\.t(\d+)/g;
  let match;
  while ((match = classRegex.exec(allCSS)) !== null) {
    classes.add(`t${match[1]}`);
  }

  return Array.from(classes).sort((a, b) => {
    const aNum = parseInt(a.slice(1));
    const bNum = parseInt(b.slice(1));
    return aNum - bNum;
  });
}

function extractCSSRules(
  css: string,
): Array<{ selector: string; declarations: string }> {
  const rules: Array<{ selector: string; declarations: string }> = [];

  // Remove comments
  let cleanCSS = css.replace(/\/\*[\s\S]*?\*\//g, '');

  let i = 0;
  while (i < cleanCSS.length) {
    // Skip whitespace
    while (i < cleanCSS.length && /\s/.test(cleanCSS[i])) {
      i++;
    }
    if (i >= cleanCSS.length) break;

    // Find selector start
    const selectorStart = i;
    let braceDepth = 0;
    let inString = false;
    let stringChar = '';

    // Find opening brace
    while (i < cleanCSS.length) {
      const char = cleanCSS[i];
      if (inString) {
        if (char === stringChar && cleanCSS[i - 1] !== '\\') {
          inString = false;
        }
      } else {
        if (char === '"' || char === "'") {
          inString = true;
          stringChar = char;
        } else if (char === '{') {
          braceDepth++;
          if (braceDepth === 1) break;
        }
      }
      i++;
    }

    if (i >= cleanCSS.length) break;
    const selector = cleanCSS.substring(selectorStart, i).trim();
    i++; // Skip opening brace

    // Find matching closing brace
    const contentStart = i;
    braceDepth = 1;
    inString = false;

    while (i < cleanCSS.length && braceDepth > 0) {
      const char = cleanCSS[i];
      if (inString) {
        if (char === stringChar && cleanCSS[i - 1] !== '\\') {
          inString = false;
        }
      } else {
        if (char === '"' || char === "'") {
          inString = true;
          stringChar = char;
        } else if (char === '{') {
          braceDepth++;
        } else if (char === '}') {
          braceDepth--;
        }
      }
      i++;
    }

    const content = cleanCSS.substring(contentStart, i - 1).trim();
    if (content && selector) {
      rules.push({ selector, declarations: content });
    }
  }

  return rules;
}

function getGlobalCSS(root: Document | ShadowRoot = document): string {
  const allCSS = injector.instance.getCssText({ root });
  const rules = extractCSSRules(allCSS);

  const globalRules = rules.filter((rule) => {
    const selectors = rule.selector.split(',').map((s) => s.trim());
    return !selectors.every((selector) => {
      const cleanSelector = selector.replace(/[.#:\s>+~[\]()]/g, ' ');
      const parts = cleanSelector.split(/\s+/).filter(Boolean);
      return parts.length > 0 && parts.every((part) => /^t\d+$/.test(part));
    });
  });

  const globalCSS = globalRules
    .map((rule) => `${rule.selector} { ${rule.declarations} }`)
    .join('\n');
  return prettifyCSS(globalCSS);
}

function getPageCSS(options?: {
  root?: Document | ShadowRoot;
  includeCrossOrigin?: boolean;
}): string {
  const root = options?.root || document;
  const includeCrossOrigin = options?.includeCrossOrigin ?? false;

  const cssChunks: string[] = [];

  try {
    if ('styleSheets' in root) {
      const styleSheets = Array.from((root as Document).styleSheets);

      for (const sheet of styleSheets) {
        try {
          if (sheet.cssRules) {
            const rules = Array.from(sheet.cssRules);
            cssChunks.push(rules.map((rule) => rule.cssText).join('\n'));
          }
        } catch (e) {
          // Cross-origin sheet or other access error
          if (includeCrossOrigin) {
            cssChunks.push(
              `/* Cross-origin stylesheet: ${sheet.href || 'inline'} */`,
            );
          }
        }
      }
    }
  } catch (e) {
    // Fallback error handling
  }

  return cssChunks.join('\n');
}

function getPageStats(options?: {
  root?: Document | ShadowRoot;
  includeCrossOrigin?: boolean;
}): {
  cssSize: number;
  ruleCount: number;
  stylesheetCount: number;
  skippedStylesheets: number;
} {
  const root = options?.root || document;
  const includeCrossOrigin = options?.includeCrossOrigin ?? false;

  let cssSize = 0;
  let ruleCount = 0;
  let stylesheetCount = 0;
  let skippedStylesheets = 0;

  try {
    if ('styleSheets' in root) {
      const styleSheets = Array.from((root as Document).styleSheets);
      stylesheetCount = styleSheets.length;

      for (const sheet of styleSheets) {
        try {
          if (sheet.cssRules) {
            const rules = Array.from(sheet.cssRules);
            ruleCount += rules.length;
            cssSize += rules.reduce(
              (sum, rule) => sum + rule.cssText.length,
              0,
            );
          }
        } catch (e) {
          skippedStylesheets++;
        }
      }
    }
  } catch (e) {
    // Fallback error handling
  }

  return { cssSize, ruleCount, stylesheetCount, skippedStylesheets };
}

/**
 * Concise tastyDebug API for inspecting styles at runtime
 */
export const tastyDebug = {
  // 1) One function to get CSS from anywhere
  css(target: CSSTarget, opts?: CssOptions): string {
    const { root = document, prettify = true, log = false } = opts || {};
    let css = '';

    if (typeof target === 'string') {
      if (target === 'all') {
        css = injector.instance.getCssText({ root });
      } else if (target === 'global') {
        css = getGlobalCSS(root);
      } else if (target === 'active') {
        const activeClasses = findAllTastyClasses(root);
        css = injector.instance.getCssTextForClasses(activeClasses, { root });
      } else if (target === 'unused') {
        // Get unused classes (refCount = 0) from the registry
        const registry = (injector.instance as any)[
          'sheetManager'
        ]?.getRegistry(root);
        const unusedClasses: string[] = registry
          ? Array.from(
              registry.refCounts.entries() as IterableIterator<
                [string, number]
              >,
            )
              .filter(([, refCount]: [string, number]) => refCount === 0)
              .map(([className]: [string, number]) => className)
          : [];
        css = injector.instance.getCssTextForClasses(unusedClasses, { root });
      } else if (target === 'page') {
        css = getPageCSS({ root, includeCrossOrigin: true });
      } else if (/^t\d+$/.test(target)) {
        // Single tasty class
        css = injector.instance.getCssTextForClasses([target], { root });
      } else {
        // CSS selector - find element and get its CSS
        const element = (root as Document).querySelector?.(target);
        if (element) {
          css = getCssTextForNode(element, { root });
        }
      }
    } else if (Array.isArray(target)) {
      // Array of tasty classes
      css = injector.instance.getCssTextForClasses(target, { root });
    } else if (target instanceof Element) {
      // DOM element
      css = getCssTextForNode(target, { root });
    }

    const result = prettify ? prettifyCSS(css) : css;

    if (log) {
      console.group(
        `🎨 CSS for ${Array.isArray(target) ? `[${target.join(', ')}]` : target}`,
      );
      console.log(result || '(empty)');
      console.groupEnd();
    }

    return result;
  },

  // 2) Element-level inspection
  inspect(
    target: string | Element,
    opts?: { root?: Document | ShadowRoot },
  ): InspectResult {
    const { root = document } = opts || {};
    const element =
      typeof target === 'string'
        ? (root as Document).querySelector?.(target)
        : target;

    if (!element) {
      return {
        element: null,
        classes: [],
        css: '',
        size: 0,
        rules: 0,
      };
    }

    const classList = element.getAttribute('class') || '';
    const tastyClasses = classList
      .split(/\s+/)
      .filter((cls) => /^t\d+$/.test(cls));

    const css = getCssTextForNode(element, { root });
    const prettifiedCSS = prettifyCSS(css);
    const ruleCount = (css.match(/\{[^}]*\}/g) || []).length;

    return {
      element,
      classes: tastyClasses,
      css: prettifiedCSS,
      size: css.length,
      rules: ruleCount,
    };
  },

  // 3) Cache + metrics at a glance
  cache(opts?: {
    root?: Document | ShadowRoot;
    includeHistory?: boolean;
  }): CacheStatus {
    const { root = document } = opts || {};
    const activeClasses = findAllTastyClasses(root);
    const allClasses = findAllStyledClasses(root);
    // Get unused classes (refCount = 0) from the registry
    const registry = (injector.instance as any)['sheetManager']?.getRegistry(
      root,
    );
    const unusedClasses: string[] = registry
      ? Array.from(
          registry.refCounts.entries() as IterableIterator<[string, number]>,
        )
          .filter(([, refCount]: [string, number]) => refCount === 0)
          .map(([className]: [string, number]) => className)
      : [];

    return {
      classes: {
        active: activeClasses,
        unused: unusedClasses,
        all: [...activeClasses, ...unusedClasses],
      },
      metrics: injector.instance.getMetrics({ root }),
    };
  },

  // 4) Cleanup + metrics utilities
  cleanup(opts?: { root?: Document | ShadowRoot }): void {
    const { root } = opts || {};
    injector.instance.cleanup(root);
  },

  metrics(opts?: { root?: Document | ShadowRoot }): CacheMetrics | null {
    const { root } = opts || {};
    return injector.instance.getMetrics({ root });
  },

  resetMetrics(opts?: { root?: Document | ShadowRoot }): void {
    const { root } = opts || {};
    injector.instance.resetMetrics({ root });
  },

  // 5) Tasty global CSS and selector analysis
  global(opts?: {
    root?: Document | ShadowRoot;
    log?: boolean;
  }): GlobalBreakdown {
    const { root = document, log = false } = opts || {};
    const css = getGlobalCSS(root);
    const rules = extractCSSRules(css);

    // Analyze selectors
    const selectors = {
      elements: [] as string[],
      classes: [] as string[],
      ids: [] as string[],
      pseudoClasses: [] as string[],
      mediaQueries: [] as string[],
      keyframes: [] as string[],
      other: [] as string[],
    };

    rules.forEach((rule) => {
      const selector = rule.selector;
      if (selector.startsWith('@media')) {
        selectors.mediaQueries.push(selector);
      } else if (selector.startsWith('@keyframes')) {
        selectors.keyframes.push(selector);
      } else if (
        selector.includes('.') &&
        !selector.includes('#') &&
        !selector.includes(':')
      ) {
        selectors.classes.push(selector);
      } else if (
        selector.includes('#') &&
        !selector.includes('.') &&
        !selector.includes(':')
      ) {
        selectors.ids.push(selector);
      } else if (selector.includes(':')) {
        selectors.pseudoClasses.push(selector);
      } else if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(selector.trim())) {
        selectors.elements.push(selector);
      } else {
        selectors.other.push(selector);
      }
    });

    const result = {
      css,
      totalRules: rules.length,
      totalCSSSize: css.length,
      selectors,
    };

    if (log) {
      console.group(`🌍 Global CSS (${result.totalRules} rules)`);
      console.log(`📊 Size: ${result.totalCSSSize} characters`);
      console.log('🎯 Selector breakdown:', result.selectors);
      console.log('🎨 CSS:\n' + result.css);
      console.groupEnd();
    }

    return result;
  },

  // 6) Defined @property and keyframes
  defs(opts?: { root?: Document | ShadowRoot }): Definitions {
    const { root = document } = opts || {};

    // Get properties from injector if available, otherwise scan CSS
    let properties: string[] = [];
    try {
      const registry = (injector.instance as any)['sheetManager']?.getRegistry(
        root,
      );
      if (registry?.injectedProperties) {
        properties = Array.from(
          registry.injectedProperties as Set<string>,
        ).sort();
      }
    } catch {
      // Fallback: scan CSS for @property rules
      const allCSS = injector.instance.getCssText({ root });
      const propRegex = /@property\s+(--[a-z0-9-]+)/gi;
      const propSet = new Set<string>();
      let match;
      while ((match = propRegex.exec(allCSS)) !== null) {
        propSet.add(match[1]);
      }
      properties = Array.from(propSet).sort();
    }

    // Get keyframes
    let keyframes: Array<{ name: string; refCount: number }> = [];
    try {
      const registry = (injector.instance as any)['sheetManager']?.getRegistry(
        root,
      );
      if (registry) {
        for (const entry of registry.keyframesCache.values()) {
          keyframes.push({
            name: entry.name,
            refCount: entry.refCount,
          });
        }
        keyframes.sort((a, b) => a.name.localeCompare(b.name));
      }
    } catch {
      // Fallback: scan CSS for @keyframes rules
      const allCSS = injector.instance.getCssText({ root });
      const keyframesRegex = /@keyframes\s+([a-zA-Z0-9_-]+)/gi;
      const keyframesSet = new Set<string>();
      let match;
      while ((match = keyframesRegex.exec(allCSS)) !== null) {
        keyframesSet.add(match[1]);
      }
      keyframes = Array.from(keyframesSet)
        .sort()
        .map((name) => ({ name, refCount: 1 }));
    }

    return { properties, keyframes };
  },

  // 7) One-shot overview
  summary(opts?: SummaryOptions): Summary {
    const { root = document, log = false, includePageCSS = false } = opts || {};
    const cacheStatus = this.cache({ root });
    const globalBreakdown = this.global({ root });
    const definitions = this.defs({ root });
    const metrics = this.metrics({ root });

    const activeCSS = this.css('active', { root, prettify: false });
    const unusedCSS = this.css('unused', { root, prettify: false });
    const allCSS = this.css('all', { root, prettify: false });

    // Build cleanup summary from metrics
    const cleanupSummary = {
      enabled: !!metrics,
      totalCleanups: metrics?.cleanupHistory?.length || 0,
      totalClassesDeleted:
        metrics?.cleanupHistory?.reduce(
          (sum, c) => sum + c.classesDeleted,
          0,
        ) || 0,
      totalCssDeleted:
        metrics?.cleanupHistory?.reduce((sum, c) => sum + c.cssSize, 0) || 0,
      totalRulesDeleted:
        metrics?.cleanupHistory?.reduce((sum, c) => sum + c.rulesDeleted, 0) ||
        0,
      averageClassesPerCleanup: 0,
      averageCssPerCleanup: 0,
      averageRulesPerCleanup: 0,
      lastCleanup: undefined as any,
    };

    if (cleanupSummary.totalCleanups > 0) {
      cleanupSummary.averageClassesPerCleanup =
        cleanupSummary.totalClassesDeleted / cleanupSummary.totalCleanups;
      cleanupSummary.averageCssPerCleanup =
        cleanupSummary.totalCssDeleted / cleanupSummary.totalCleanups;
      cleanupSummary.averageRulesPerCleanup =
        cleanupSummary.totalRulesDeleted / cleanupSummary.totalCleanups;

      const lastCleanup =
        metrics?.cleanupHistory?.[metrics.cleanupHistory.length - 1];
      if (lastCleanup) {
        cleanupSummary.lastCleanup = {
          ...lastCleanup,
          date: new Date(lastCleanup.timestamp).toISOString(),
        };
      }
    }

    let page: Summary['page'] | undefined;
    if (includePageCSS) {
      const pageStats = getPageStats({ root, includeCrossOrigin: true });
      page = {
        ...pageStats,
        css:
          includePageCSS === 'all'
            ? getPageCSS({ root, includeCrossOrigin: true })
            : undefined,
      };
    }

    const summary: Summary = {
      activeClasses: cacheStatus.classes.active,
      unusedClasses: cacheStatus.classes.unused,
      totalStyledClasses: cacheStatus.classes.all,
      activeCSSSize: activeCSS.length,
      unusedCSSSize: unusedCSS.length,
      totalCSSSize: allCSS.length,
      activeCSS: prettifyCSS(activeCSS),
      unusedCSS: prettifyCSS(unusedCSS),
      allCSS: prettifyCSS(allCSS),
      globalCSS: globalBreakdown.css,
      globalCSSSize: globalBreakdown.totalCSSSize,
      globalRuleCount: globalBreakdown.totalRules,
      page,
      metrics,
      definedProperties: definitions.properties,
      definedKeyframes: definitions.keyframes,
      propertyCount: definitions.properties.length,
      keyframeCount: definitions.keyframes.length,
      cleanupSummary,
    };

    if (log) {
      console.group('🎨 Comprehensive Tasty Debug Summary');
      console.log(`📊 Style Cache Status:`);
      console.log(
        `  • Active classes (in DOM): ${summary.activeClasses.length}`,
      );
      console.log(
        `  • Unused classes (refCount = 0): ${summary.unusedClasses.length}`,
      );
      console.log(
        `  • Total styled classes: ${summary.totalStyledClasses.length}`,
      );
      console.log(`💾 CSS Size:`);
      console.log(`  • Active CSS: ${summary.activeCSSSize} characters`);
      console.log(`  • Unused CSS: ${summary.unusedCSSSize} characters`);
      console.log(
        `  • Global CSS: ${summary.globalCSSSize} characters (${summary.globalRuleCount} rules)`,
      );
      console.log(`  • Total CSS: ${summary.totalCSSSize} characters`);

      if (page) {
        console.log(`📄 Page CSS:`);
        console.log(`  • Total page CSS: ${page.cssSize} characters`);
        console.log(`  • Total page rules: ${page.ruleCount}`);
        console.log(
          `  • Stylesheets: ${page.stylesheetCount} (${page.skippedStylesheets} skipped)`,
        );
      }

      console.log('🏷️ Properties & Keyframes:');
      console.log(`  • Defined @property: ${summary.propertyCount}`);
      console.log(`  • Defined keyframes: ${summary.keyframeCount}`);

      if (metrics) {
        console.log(`⚡ Performance Metrics:`);
        console.log(`  • Cache hits: ${metrics.hits}`);
        console.log(`  • Cache misses: ${metrics.misses}`);
        console.log(`  • Cached style reuses: ${metrics.unusedHits}`);
        const hitRate =
          metrics.hits + metrics.misses > 0
            ? (
                ((metrics.hits + (metrics.unusedHits || 0)) /
                  (metrics.hits + metrics.misses)) *
                100
              ).toFixed(1)
            : '0';
        console.log(`  • Overall cache hit rate: ${hitRate}%`);
      }

      console.log('🔍 Details:');
      console.log('  • Active classes:', summary.activeClasses);
      console.log('  • Unused classes:', summary.unusedClasses);
      console.groupEnd();
    }

    return summary;
  },

  // 8) Page-level CSS helpers
  pageCSS(opts?: {
    root?: Document | ShadowRoot;
    prettify?: boolean;
    log?: boolean;
    includeCrossOrigin?: boolean;
  }): string {
    const {
      root = document,
      prettify = true,
      log = false,
      includeCrossOrigin = true,
    } = opts || {};
    const css = getPageCSS({ root, includeCrossOrigin });
    const result = prettify ? prettifyCSS(css) : css;

    if (log) {
      console.group('📄 Page CSS (All Stylesheets)');
      console.log(result || '(empty)');
      console.groupEnd();
    }

    return result;
  },

  pageStats(opts?: {
    root?: Document | ShadowRoot;
    includeCrossOrigin?: boolean;
  }): {
    cssSize: number;
    ruleCount: number;
    stylesheetCount: number;
    skippedStylesheets: number;
  } {
    const { root = document, includeCrossOrigin = true } = opts || {};
    return getPageStats({ root, includeCrossOrigin });
  },

  // 9) Install globally
  install(): void {
    if (
      typeof window !== 'undefined' &&
      (window as any).tastyDebug !== tastyDebug
    ) {
      (window as any).tastyDebug = tastyDebug;
      console.log(
        '🎨 tastyDebug installed on window. Run tastyDebug.help() for quick start guide.',
      );
    }
  },

  // 10) Beautiful console logging with collapsible CSS
  log(target: CSSTarget, opts?: CssOptions & { title?: string }): void {
    const { title, ...cssOpts } = opts || {};
    const css = tastyDebug.css(target, cssOpts);

    if (!css.trim()) {
      console.warn(`🎨 No CSS found for target: ${String(target)}`);
      return;
    }

    const targetStr = Array.isArray(target)
      ? target.join(', ')
      : String(target);
    const displayTitle = title || `CSS for "${targetStr}"`;

    // Get some stats about the CSS
    const lines = css.split('\n').length;
    const size = new Blob([css]).size;
    const sizeStr = size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`;

    // Count CSS rules (blocks with opening braces)
    const ruleCount = (css.match(/\{/g) || []).length;

    console.group(
      `🎨 ${displayTitle} (${ruleCount} rules, ${lines} lines, ${sizeStr})`,
    );

    // Detect sub-elements in CSS
    const subElementMatches = css.match(/\[data-element="([^"]+)"\]/g) || [];
    const subElements = [
      ...new Set(
        subElementMatches
          .map((match) => match.match(/\[data-element="([^"]+)"\]/)?.[1])
          .filter(Boolean),
      ),
    ];

    if (subElements.length > 0) {
      console.log(`🧩 Sub-elements found: ${subElements.join(', ')}`);

      // Show stats and CSS for each sub-element
      subElements.forEach((element) => {
        const elementSelector = `[data-element="${element}"]`;
        const elementRegex = new RegExp(
          `[^}]*\\[data-element="${element.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\][^{]*\\{[^}]*\\}`,
          'gm',
        );
        const elementCSS = (css.match(elementRegex) || []).join('\n');

        if (elementCSS) {
          const elementRules = (elementCSS.match(/\{/g) || []).length;
          const elementLines = elementCSS.split('\n').length;
          const elementSize = new Blob([elementCSS]).size;
          const elementSizeStr =
            elementSize > 1024
              ? `${(elementSize / 1024).toFixed(1)}KB`
              : `${elementSize}B`;

          console.groupCollapsed(
            `🧩 ${element} (${elementRules} rules, ${elementLines} lines, ${elementSizeStr})`,
          );
          console.log(
            `%c${elementCSS}`,
            'color: #666; font-family: monospace; font-size: 12px; white-space: pre;',
          );
          console.groupEnd();
        }
      });
    }

    // Full CSS in collapsible group (hidden by default)
    console.groupCollapsed('📄 Full CSS (click to expand)');
    console.log(
      `%c${css}`,
      'color: #666; font-family: monospace; font-size: 12px; white-space: pre;',
    );
    console.groupEnd();

    console.groupEnd();
  },

  // 11) Show help and usage examples
  help(): void {
    console.group('🎨 tastyDebug - Quick Start Guide');
    console.log('💡 Essential commands:');
    console.log(
      '  • tastyDebug.summary({ log: true }) - comprehensive overview',
    );
    console.log('  • tastyDebug.log("active") - beautiful CSS display');
    console.log('  • tastyDebug.css("active") - get active CSS');
    console.log(
      '  • tastyDebug.inspect(".my-element") - detailed element inspection',
    );
    console.log('  • tastyDebug.global({ log: true }) - global CSS analysis');
    console.log('  • tastyDebug.cache() - cache status');
    console.log('  • tastyDebug.defs() - defined properties & keyframes');
    console.log('  • tastyDebug.pageCSS({ log: true }) - all page CSS');
    console.log('');
    console.log('📖 Common targets for css()/log():');
    console.log('  • "all" - all tasty CSS + global CSS');
    console.log('  • "active" - CSS for classes in DOM');
    console.log('  • "unused" - CSS for classes with refCount = 0');
    console.log('  • "global" - only global CSS (createGlobalStyle)');
    console.log('  • "page" - ALL page CSS (including non-tasty)');
    console.log('  • "t123" - specific tasty class');
    console.log('  • [".my-selector"] - CSS selector');
    console.log('');
    console.log('🔧 Available options:');
    console.log('  • { log: true } - auto-log results to console');
    console.log('  • { title: "Custom" } - custom title for log()');
    console.log('  • { root: shadowRoot } - target Shadow DOM');
    console.log('  • { prettify: false } - skip CSS formatting');
    console.groupEnd();
  },
};

/**
 * Auto-install in development
 */
if (typeof window !== 'undefined' && isDevEnv()) {
  tastyDebug.install();
}
