/**
 * Debug utilities for inspecting tasty-generated CSS at runtime
 */

import { getCssText, getCssTextForNode, injector } from './injector';

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

/**
 * Debug utilities for inspecting tasty styles in runtime applications
 */
export const tastyDebug = {
  /**
   * Get CSS for a specific tasty class (e.g., 't24')
   */
  getCSSForClass(className: string): string {
    if (!className.match(/^t\d+$/)) {
      console.warn(
        `"${className}" doesn't look like a tasty class. Expected format: t{number}`,
      );
    }
    const css = injector.instance.getCssTextForClasses([className]);
    return prettifyCSS(css);
  },

  /**
   * Get CSS for multiple tasty classes
   */
  getCSSForClasses(classNames: string[]): string {
    const css = injector.instance.getCssTextForClasses(classNames);
    return prettifyCSS(css);
  },

  /**
   * Log CSS for a specific tasty class (e.g., 't24') to console
   */
  logCSSForClass(className: string): void {
    if (!className.match(/^t\d+$/)) {
      console.warn(
        `"${className}" doesn't look like a tasty class. Expected format: t{number}`,
      );
    }
    const css = this.getCSSForClass(className);
    this.logCSS(css, `CSS for class "${className}"`);
  },

  /**
   * Log CSS for multiple tasty classes to console
   */
  logCSSForClasses(classNames: string[]): void {
    const css = this.getCSSForClasses(classNames);
    const title = `CSS for classes [${classNames.join(', ')}]`;
    this.logCSS(css, title);
  },

  /**
   * Inspect an element by CSS selector and get its tasty CSS
   */
  inspectElement(selector: string): string {
    const element = document.querySelector(selector);
    if (!element) {
      return `Element not found: ${selector}`;
    }

    console.group(`🎨 Tasty CSS for "${selector}"`);
    console.log('Element:', element);

    const css = getCssTextForNode(element);
    if (css) {
      const prettified = prettifyCSS(css);
      console.log('Generated CSS:\n' + prettified);
      console.groupEnd();
      return prettified;
    } else {
      console.log('No tasty CSS found for this element');
      console.groupEnd();
      return 'No tasty CSS found';
    }
  },

  /**
   * Inspect a DOM element directly and get its tasty CSS
   */
  inspectDOMElement(element: Element): string {
    if (!element) {
      return 'Element is null or undefined';
    }

    console.group('🎨 Tasty CSS for element');
    console.log('Element:', element);

    const css = getCssTextForNode(element);
    if (css) {
      const prettified = prettifyCSS(css);
      console.log('Generated CSS:\n' + prettified);
      console.groupEnd();
      return prettified;
    } else {
      console.log('No tasty CSS found for this element');
      console.groupEnd();
      return 'No tasty CSS found';
    }
  },

  /**
   * Get all tasty CSS currently injected into the page
   */
  getAllCSS(): string {
    return getCssText();
  },

  /**
   * Find all tasty classes used in the page (in DOM)
   */
  findAllTastyClasses(): string[] {
    const classes = new Set<string>();

    // Find all elements with class attributes
    const elements = document.querySelectorAll('[class]');
    elements.forEach((element) => {
      const classList = element.getAttribute('class');
      if (classList) {
        // Extract tasty classes (t + digits)
        const tastyClasses = classList
          .split(/\s+/)
          .filter((cls) => /^t\d+$/.test(cls));
        tastyClasses.forEach((cls) => classes.add(cls));
      }
    });

    return Array.from(classes).sort((a, b) => {
      // Sort numerically by the number part
      const aNum = parseInt(a.slice(1));
      const bNum = parseInt(b.slice(1));
      return aNum - bNum;
    });
  },

  /**
   * Find all tasty classes that have styles in the stylesheet (used + unused)
   */
  findAllStyledClasses(): string[] {
    const registry = (injector.instance as any)['sheetManager'].getRegistry(
      document,
    );
    const classes = new Set<string>();

    // Add all classes from rules map (active + unused)
    if (registry?.rules) {
      for (const className of registry.rules.keys()) {
        if (/^t\d+$/.test(className)) {
          classes.add(className);
        }
      }
    }

    return Array.from(classes).sort((a, b) => {
      // Sort numerically by the number part
      const aNum = parseInt(a.slice(1));
      const bNum = parseInt(b.slice(1));
      return aNum - bNum;
    });
  },

  /**
   * Get active vs cached class breakdown
   */
  getClassUsage(): {
    activeClasses: string[];
    cachedClasses: string[];
    totalStyledClasses: string[];
  } {
    const domClasses = this.findAllTastyClasses();
    const styledClasses = this.findAllStyledClasses();
    const registry = (injector.instance as any)['sheetManager'].getRegistry(
      document,
    );

    const activeClasses = domClasses;
    const cachedClasses = styledClasses.filter(
      (cls) => !domClasses.includes(cls),
    );

    // Also check unusedRules registry for classes that are marked as cached (unused but kept for performance)
    if (registry?.unusedRules) {
      for (const className of registry.unusedRules.keys()) {
        if (/^t\d+$/.test(className) && !cachedClasses.includes(className)) {
          cachedClasses.push(className);
        }
      }
    }

    return {
      activeClasses: activeClasses.sort((a, b) => {
        const aNum = parseInt(a.slice(1));
        const bNum = parseInt(b.slice(1));
        return aNum - bNum;
      }),
      cachedClasses: cachedClasses.sort((a, b) => {
        const aNum = parseInt(a.slice(1));
        const bNum = parseInt(b.slice(1));
        return aNum - bNum;
      }),
      totalStyledClasses: styledClasses,
    };
  },

  /**
   * Get a comprehensive summary of all tasty styles
   */
  getSummary(): {
    activeClasses: string[];
    cachedClasses: string[];
    totalStyledClasses: string[];
    activeCSSSize: number;
    cachedCSSSize: number;
    totalCSSSize: number;
    activeCSS: string;
    cachedCSS: string;
    allCSS: string;
    globalCSS: string;
    globalCSSSize: number;
    globalRuleCount: number;
    metrics: any;
    definedProperties: string[];
    definedKeyframes: { name: string; refCount: number; cssText?: string }[];
    propertyCount: number;
    keyframeCount: number;
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
  } {
    const usage = this.getClassUsage();
    const allCSS = this.getAllCSS();
    const activeCSS = this.getCSSForClasses(usage.activeClasses);
    const cachedCSS = this.getCSSForClasses(usage.cachedClasses);
    const globalCSS = this.getGlobalCSS();
    const globalBreakdown = this.getGlobalCSSBreakdown();
    const metrics = injector.instance.getMetrics();
    const definedProperties = this.getDefinedProperties();
    const definedKeyframes = this.getDefinedKeyframes();
    const cleanupSummary = this.getCleanupSummary();

    const summary = {
      activeClasses: usage.activeClasses,
      cachedClasses: usage.cachedClasses,
      totalStyledClasses: usage.totalStyledClasses,
      activeCSSSize: activeCSS.length,
      cachedCSSSize: cachedCSS.length,
      totalCSSSize: allCSS.length,
      activeCSS,
      cachedCSS,
      allCSS,
      globalCSS,
      globalCSSSize: globalCSS.length,
      globalRuleCount: globalBreakdown.totalRules,
      metrics,
      definedProperties,
      definedKeyframes,
      propertyCount: definedProperties.length,
      keyframeCount: definedKeyframes.length,
      cleanupSummary,
    };

    console.group('🎨 Comprehensive Tasty Debug Summary');
    console.log(`📊 Style Cache Status:`);
    console.log(`  • Active classes (in DOM): ${summary.activeClasses.length}`);
    console.log(
      `  • Cached classes (performance cache): ${summary.cachedClasses.length}`,
    );
    console.log(
      `  • Total styled classes: ${summary.totalStyledClasses.length}`,
    );
    console.log(`💾 CSS Size:`);
    console.log(`  • Active CSS: ${summary.activeCSSSize} characters`);
    console.log(`  • Cached CSS: ${summary.cachedCSSSize} characters`);
    console.log(
      `  • Global CSS: ${summary.globalCSSSize} characters (${summary.globalRuleCount} rules)`,
    );
    console.log(`  • Total CSS: ${summary.totalCSSSize} characters`);
    console.log('🏷️ Properties & Keyframes:');
    console.log(`  • Defined @property: ${definedProperties.length}`);
    console.log(`  • Defined keyframes: ${definedKeyframes.length}`);
    if (definedProperties.length > 0) {
      console.log('  • Properties:', definedProperties);
    }
    if (definedKeyframes.length > 0) {
      console.log(
        '  • Keyframes:',
        definedKeyframes.map((k) => `${k.name} (refs: ${k.refCount})`),
      );
    }
    console.log('🧹 Cleanup Statistics:');
    if (cleanupSummary.enabled) {
      console.log(
        `  • Total cleanups performed: ${cleanupSummary.totalCleanups}`,
      );
      console.log(
        `  • Total classes deleted: ${cleanupSummary.totalClassesDeleted}`,
      );
      console.log(
        `  • Total CSS deleted: ${cleanupSummary.totalCssDeleted} chars`,
      );
      console.log(
        `  • Total rules deleted: ${cleanupSummary.totalRulesDeleted}`,
      );
      if (cleanupSummary.totalCleanups > 0) {
        console.log(
          `  • Avg classes per cleanup: ${cleanupSummary.averageClassesPerCleanup.toFixed(1)}`,
        );
        console.log(
          `  • Avg CSS per cleanup: ${cleanupSummary.averageCssPerCleanup.toFixed(0)} chars`,
        );
        console.log(
          `  • Avg rules per cleanup: ${cleanupSummary.averageRulesPerCleanup.toFixed(1)}`,
        );
      }
      if (cleanupSummary.lastCleanup) {
        console.log(`  • Last cleanup: ${cleanupSummary.lastCleanup.date}`);
      }
    } else {
      console.log(
        '  • Metrics collection disabled (enable with collectMetrics: true)',
      );
    }
    console.log(`⚡ Performance Metrics:`);
    if (metrics) {
      console.log(`  • Cache hits: ${metrics.hits}`);
      console.log(`  • Cache misses: ${metrics.misses}`);
      console.log(`  • Cached style reuses: ${metrics.unusedHits}`);
      console.log(`  • Total insertions: ${metrics.totalInsertions}`);
      console.log(`  • Styles cleaned up: ${metrics.stylesCleanedUp}`);

      const hitRate =
        metrics.hits + metrics.misses > 0
          ? (
              ((metrics.hits + metrics.unusedHits) /
                (metrics.hits + metrics.misses)) *
              100
            ).toFixed(1)
          : 0;
      console.log(`  • Overall cache hit rate: ${hitRate}%`);
    } else {
      console.log(
        `  • Metrics not available (enable with collectMetrics: true)`,
      );
    }
    console.log('🔍 Details:');
    console.log('  • Active classes:', summary.activeClasses);
    console.log('  • Cached classes:', summary.cachedClasses);
    console.log(
      'ℹ️  Note: Cached styles are kept for performance - avoiding expensive DOM operations',
    );
    console.groupEnd();

    return summary;
  },

  /**
   * Helper to log CSS in a readable format
   */
  logCSS(css: string, title = 'CSS'): void {
    if (!css || css.trim() === '') {
      console.log(`${title}: (empty)`);
      return;
    }

    console.group(`🎨 ${title}`);
    const prettified = prettifyCSS(css);
    console.log(prettified);
    console.groupEnd();
  },

  /**
   * Advanced inspection with detailed breakdown and statistics
   */
  inspect(target: string | Element): {
    element: Element | null;
    tastyClasses: string[];
    css: string;
    cssSize: number;
    ruleCount: number;
    breakdown: {
      [className: string]: {
        css: string;
        cssSize: number;
        ruleCount: number;
      };
    };
    stats: {
      totalClasses: number;
      totalRules: number;
      totalCSSSize: number;
      averageRulesPerClass: number;
      averageCSSPerClass: number;
    };
  } {
    const element =
      typeof target === 'string' ? document.querySelector(target) : target;

    if (!element) {
      console.error(`Element not found: ${target}`);
      return {
        element: null,
        tastyClasses: [],
        css: '',
        cssSize: 0,
        ruleCount: 0,
        breakdown: {},
        stats: {
          totalClasses: 0,
          totalRules: 0,
          totalCSSSize: 0,
          averageRulesPerClass: 0,
          averageCSSPerClass: 0,
        },
      };
    }

    // Find tasty classes on this element
    const classList = element.getAttribute('class') || '';
    const tastyClasses = classList
      .split(/\s+/)
      .filter((cls) => /^t\d+$/.test(cls));

    // Get CSS for the entire subtree
    const fullCSS = getCssTextForNode(element);
    const prettifiedCSS = prettifyCSS(fullCSS);

    // Count CSS rules in the full CSS
    const ruleCount = (fullCSS.match(/\{[^}]*\}/g) || []).length;

    // Get CSS breakdown per class with detailed stats
    const breakdown: {
      [className: string]: {
        css: string;
        cssSize: number;
        ruleCount: number;
      };
    } = {};

    let totalClassRules = 0;
    let totalClassCSSSize = 0;

    tastyClasses.forEach((className) => {
      const classCSS = this.getCSSForClass(className);
      const classRuleCount = (classCSS.match(/\{[^}]*\}/g) || []).length;
      breakdown[className] = {
        css: classCSS,
        cssSize: classCSS.length,
        ruleCount: classRuleCount,
      };
      totalClassRules += classRuleCount;
      totalClassCSSSize += classCSS.length;
    });

    // Calculate statistics
    const stats = {
      totalClasses: tastyClasses.length,
      totalRules: totalClassRules,
      totalCSSSize: totalClassCSSSize,
      averageRulesPerClass:
        tastyClasses.length > 0 ? totalClassRules / tastyClasses.length : 0,
      averageCSSPerClass:
        tastyClasses.length > 0 ? totalClassCSSSize / tastyClasses.length : 0,
    };

    const result = {
      element,
      tastyClasses,
      css: prettifiedCSS,
      cssSize: fullCSS.length,
      ruleCount,
      breakdown,
      stats,
    };

    console.group(`🔍 Detailed Tasty Inspection`);
    console.log('Element:', element);
    console.log('📊 Overview:');
    console.log(`  • Tasty classes: ${stats.totalClasses}`);
    console.log(`  • Total rules applied: ${ruleCount}`);
    console.log(`  • Total CSS size: ${fullCSS.length} characters`);
    console.log('🏷️ Classes:', tastyClasses);
    console.log('📈 Statistics:');
    console.log(
      `  • Rules per class (avg): ${stats.averageRulesPerClass.toFixed(1)}`,
    );
    console.log(
      `  • CSS per class (avg): ${stats.averageCSSPerClass.toFixed(0)} chars`,
    );
    console.log('🎨 Element CSS:\n' + prettifiedCSS);
    console.log('🔨 CSS breakdown by class:');
    Object.entries(breakdown).forEach(([className, data]) => {
      console.log(
        `  ${className}: ${data.ruleCount} rules, ${data.cssSize} chars`,
      );
    });
    console.groupEnd();

    return result;
  },

  /**
   * Get CSS for active classes only
   */
  getActiveCSS(): string {
    const usage = this.getClassUsage();
    return this.getCSSForClasses(usage.activeClasses);
  },

  /**
   * Get CSS for cached classes only
   */
  getCachedCSS(): string {
    const usage = this.getClassUsage();
    return this.getCSSForClasses(usage.cachedClasses);
  },

  /**
   * Get all defined @property custom properties
   */
  getDefinedProperties(): string[] {
    const registry = (injector.instance as any)['sheetManager'].getRegistry(
      document,
    );
    if (!registry?.injectedProperties) {
      return [];
    }
    return Array.from(registry.injectedProperties as Set<string>).sort();
  },

  /**
   * Get all defined keyframes
   */
  getDefinedKeyframes(): {
    name: string;
    refCount: number;
    cssText?: string;
  }[] {
    const registry = (injector.instance as any)['sheetManager'].getRegistry(
      document,
    );
    if (!registry?.keyframesCache) {
      return [];
    }

    const keyframes: {
      name: string;
      refCount: number;
      cssText?: string;
    }[] = [];

    for (const [cacheKey, entry] of registry.keyframesCache.entries()) {
      keyframes.push({
        name: entry.name,
        refCount: entry.refCount,
        cssText: entry.info?.cssText,
      });
    }

    return keyframes.sort((a, b) => a.name.localeCompare(b.name));
  },

  /**
   * Check if a specific @property is defined
   */
  isPropertyDefined(propertyName: string): boolean {
    return injector.instance.isPropertyDefined(propertyName);
  },

  /**
   * Check if a specific keyframe is defined
   */
  isKeyframeDefined(keyframeName: string): boolean {
    const registry = (injector.instance as any)['sheetManager'].getRegistry(
      document,
    );
    if (!registry?.keyframesCache) {
      return false;
    }

    for (const entry of registry.keyframesCache.values()) {
      if (entry.name === keyframeName) {
        return true;
      }
    }
    return false;
  },

  /**
   * Get detailed cleanup statistics history
   */
  getCleanupHistory(): {
    totalCleanups: number;
    totalClassesDeleted: number;
    totalCssDeleted: number;
    totalRulesDeleted: number;
    cleanupHistory: Array<{
      timestamp: number;
      date: string;
      classesDeleted: number;
      cssSize: number;
      rulesDeleted: number;
    }>;
  } {
    const registry = (injector.instance as any)['sheetManager'].getRegistry(
      document,
    );

    if (!registry?.metrics?.cleanupHistory) {
      return {
        totalCleanups: 0,
        totalClassesDeleted: 0,
        totalCssDeleted: 0,
        totalRulesDeleted: 0,
        cleanupHistory: [],
      };
    }

    const history = registry.metrics.cleanupHistory;
    const totalClassesDeleted = history.reduce(
      (sum, cleanup) => sum + cleanup.classesDeleted,
      0,
    );
    const totalCssDeleted = history.reduce(
      (sum, cleanup) => sum + cleanup.cssSize,
      0,
    );
    const totalRulesDeleted = history.reduce(
      (sum, cleanup) => sum + cleanup.rulesDeleted,
      0,
    );

    return {
      totalCleanups: history.length,
      totalClassesDeleted,
      totalCssDeleted,
      totalRulesDeleted,
      cleanupHistory: history.map((cleanup) => ({
        ...cleanup,
        date: new Date(cleanup.timestamp).toISOString(),
      })),
    };
  },

  /**
   * Get cleanup statistics summary
   */
  getCleanupSummary(): {
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
  } {
    const registry = (injector.instance as any)['sheetManager'].getRegistry(
      document,
    );

    if (!registry?.metrics) {
      return {
        enabled: false,
        totalCleanups: 0,
        totalClassesDeleted: 0,
        totalCssDeleted: 0,
        totalRulesDeleted: 0,
        averageClassesPerCleanup: 0,
        averageCssPerCleanup: 0,
        averageRulesPerCleanup: 0,
      };
    }

    const history = registry.metrics.cleanupHistory || [];
    const totalClassesDeleted = history.reduce(
      (sum, cleanup) => sum + cleanup.classesDeleted,
      0,
    );
    const totalCssDeleted = history.reduce(
      (sum, cleanup) => sum + cleanup.cssSize,
      0,
    );
    const totalRulesDeleted = history.reduce(
      (sum, cleanup) => sum + cleanup.rulesDeleted,
      0,
    );
    const totalCleanups = history.length;

    const lastCleanup =
      history.length > 0 ? history[history.length - 1] : undefined;

    return {
      enabled: true,
      totalCleanups,
      totalClassesDeleted,
      totalCssDeleted,
      totalRulesDeleted,
      averageClassesPerCleanup:
        totalCleanups > 0 ? totalClassesDeleted / totalCleanups : 0,
      averageCssPerCleanup:
        totalCleanups > 0 ? totalCssDeleted / totalCleanups : 0,
      averageRulesPerCleanup:
        totalCleanups > 0 ? totalRulesDeleted / totalCleanups : 0,
      lastCleanup: lastCleanup
        ? {
            ...lastCleanup,
            date: new Date(lastCleanup.timestamp).toISOString(),
          }
        : undefined,
    };
  },

  /**
   * Log cleanup history to console in a readable format
   */
  logCleanupHistory(): void {
    const cleanupData = this.getCleanupHistory();

    if (cleanupData.totalCleanups === 0) {
      console.log('🧹 No cleanup history available');
      return;
    }

    console.group(`🧹 Cleanup History (${cleanupData.totalCleanups} cleanups)`);
    console.log('📊 Total Statistics:');
    console.log(
      `  • Total classes deleted: ${cleanupData.totalClassesDeleted}`,
    );
    console.log(
      `  • Total CSS deleted: ${cleanupData.totalCssDeleted} characters`,
    );
    console.log(`  • Total rules deleted: ${cleanupData.totalRulesDeleted}`);

    console.log('\n📅 Cleanup Sessions:');
    cleanupData.cleanupHistory.forEach((cleanup, index) => {
      console.log(`  ${index + 1}. ${cleanup.date}`);
      console.log(`     • Classes: ${cleanup.classesDeleted}`);
      console.log(`     • CSS: ${cleanup.cssSize} chars`);
      console.log(`     • Rules: ${cleanup.rulesDeleted}`);
    });

    console.groupEnd();
  },

  /**
   * Get all global CSS rules (non-tasty class selectors)
   */
  getGlobalCSS(): string {
    const allCSS = this.getAllCSS();

    // Split CSS into rules and filter out tasty class rules
    const rules = this.extractCSSRules(allCSS);
    const globalRules = rules.filter((rule) => {
      // Filter out rules that only contain tasty classes (t + digits)
      const selectors = rule.selector.split(',').map((s) => s.trim());
      return !selectors.every((selector) => {
        // Check if selector is purely a tasty class or contains only tasty classes
        const cleanSelector = selector.replace(/[.#:\s>+~[\]()]/g, ' ');
        const parts = cleanSelector.split(/\s+/).filter(Boolean);
        return parts.length > 0 && parts.every((part) => /^t\d+$/.test(part));
      });
    });

    const globalCSS = globalRules
      .map((rule) => `${rule.selector} { ${rule.declarations} }`)
      .join('\n');
    return prettifyCSS(globalCSS);
  },

  /**
   * Log global CSS to console
   */
  logGlobalCSS(): void {
    const globalCSS = this.getGlobalCSS();
    if (!globalCSS.trim()) {
      console.log('🌍 No global CSS found');
      return;
    }
    this.logCSS(globalCSS, 'Global CSS (createGlobalStyle)');
  },

  /**
   * Get global CSS rules breakdown with detailed analysis
   */
  getGlobalCSSBreakdown(): {
    globalRules: Array<{
      selector: string;
      declarations: string;
      ruleCount: number;
    }>;
    totalRules: number;
    totalCSSSize: number;
    css: string;
    selectors: {
      elements: string[];
      classes: string[];
      ids: string[];
      pseudoClasses: string[];
      mediaQueries: string[];
      keyframes: string[];
      other: string[];
    };
  } {
    const allCSS = this.getAllCSS();
    const rules = this.extractCSSRules(allCSS);

    const globalRules = rules.filter((rule) => {
      const selectors = rule.selector.split(',').map((s) => s.trim());
      return !selectors.every((selector) => {
        const cleanSelector = selector.replace(/[.#:\s>+~[\]()]/g, ' ');
        const parts = cleanSelector.split(/\s+/).filter(Boolean);
        return parts.length > 0 && parts.every((part) => /^t\d+$/.test(part));
      });
    });

    const breakdown = globalRules.map((rule) => ({
      selector: rule.selector,
      declarations: rule.declarations,
      ruleCount: 1,
    }));

    const css = globalRules
      .map((rule) => `${rule.selector} { ${rule.declarations} }`)
      .join('\n');
    const prettifiedCSS = prettifyCSS(css);

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

    globalRules.forEach((rule) => {
      const selector = rule.selector;

      // Categorize selectors
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

    return {
      globalRules: breakdown,
      totalRules: breakdown.length,
      totalCSSSize: css.length,
      css: prettifiedCSS,
      selectors,
    };
  },

  /**
   * Log detailed global CSS breakdown
   */
  logGlobalCSSBreakdown(): void {
    const breakdown = this.getGlobalCSSBreakdown();

    if (breakdown.totalRules === 0) {
      console.log('🌍 No global CSS rules found');
      return;
    }

    console.group(`🌍 Global CSS Breakdown (${breakdown.totalRules} rules)`);
    console.log(`📊 Statistics:`);
    console.log(`  • Total global rules: ${breakdown.totalRules}`);
    console.log(`  • Total CSS size: ${breakdown.totalCSSSize} characters`);

    console.log(`🎯 Selector Analysis:`);
    if (breakdown.selectors.elements.length > 0) {
      console.log(
        `  • Element selectors: ${breakdown.selectors.elements.length}`,
        breakdown.selectors.elements.slice(0, 5),
      );
    }
    if (breakdown.selectors.classes.length > 0) {
      console.log(
        `  • Class selectors: ${breakdown.selectors.classes.length}`,
        breakdown.selectors.classes.slice(0, 5),
      );
    }
    if (breakdown.selectors.ids.length > 0) {
      console.log(
        `  • ID selectors: ${breakdown.selectors.ids.length}`,
        breakdown.selectors.ids.slice(0, 5),
      );
    }
    if (breakdown.selectors.pseudoClasses.length > 0) {
      console.log(
        `  • Pseudo-class selectors: ${breakdown.selectors.pseudoClasses.length}`,
        breakdown.selectors.pseudoClasses.slice(0, 5),
      );
    }
    if (breakdown.selectors.mediaQueries.length > 0) {
      console.log(
        `  • Media queries: ${breakdown.selectors.mediaQueries.length}`,
        breakdown.selectors.mediaQueries.slice(0, 3),
      );
    }
    if (breakdown.selectors.keyframes.length > 0) {
      console.log(
        `  • Keyframe rules: ${breakdown.selectors.keyframes.length}`,
        breakdown.selectors.keyframes.slice(0, 3),
      );
    }
    if (breakdown.selectors.other.length > 0) {
      console.log(
        `  • Other selectors: ${breakdown.selectors.other.length}`,
        breakdown.selectors.other.slice(0, 5),
      );
    }

    console.log(`🎨 CSS Output:`);
    console.log(breakdown.css);
    console.groupEnd();
  },

  /**
   * Helper to extract CSS rules from raw CSS text
   */
  extractCSSRules(
    css: string,
  ): Array<{ selector: string; declarations: string }> {
    const rules: Array<{ selector: string; declarations: string }> = [];

    // Remove comments
    let cleanCSS = css.replace(/\/\*[\s\S]*?\*\//g, '');

    // Enhanced parser that handles nested CSS properly
    this.parseCSSSafe(cleanCSS, rules);

    return rules;
  },

  /**
   * Safe CSS parser that handles nested rules properly
   */
  parseCSSSafe(
    css: string,
    rules: Array<{ selector: string; declarations: string }>,
  ): void {
    let i = 0;

    while (i < css.length) {
      // Skip whitespace
      while (i < css.length && /\s/.test(css[i])) {
        i++;
      }

      if (i >= css.length) break;

      // Find selector start
      const selectorStart = i;
      let braceDepth = 0;
      let inString = false;
      let stringChar = '';

      // Find opening brace for this rule
      while (i < css.length) {
        const char = css[i];

        if (inString) {
          if (char === stringChar && css[i - 1] !== '\\') {
            inString = false;
          }
        } else {
          if (char === '"' || char === "'") {
            inString = true;
            stringChar = char;
          } else if (char === '{') {
            braceDepth++;
            if (braceDepth === 1) {
              break; // Found opening brace
            }
          }
        }
        i++;
      }

      if (i >= css.length) break;

      const selector = css.substring(selectorStart, i).trim();
      i++; // Skip opening brace

      // Find matching closing brace and extract content
      const contentStart = i;
      braceDepth = 1;
      inString = false;

      while (i < css.length && braceDepth > 0) {
        const char = css[i];

        if (inString) {
          if (char === stringChar && css[i - 1] !== '\\') {
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

      const content = css.substring(contentStart, i - 1).trim();

      // Check if content has nested rules
      if (content.includes('{') && content.includes('}')) {
        // Extract declarations (before any nested rules)
        const declarationMatch = content.match(/^([^{]*)/);
        const declarations = declarationMatch ? declarationMatch[1].trim() : '';

        if (declarations) {
          rules.push({ selector, declarations });
        }

        // Extract and parse nested rules recursively
        const nestedStart = content.indexOf('{');
        if (nestedStart !== -1) {
          const nestedCSS = content.substring(nestedStart);
          this.parseCSSSafe(nestedCSS, rules);
        }
      } else if (content.trim()) {
        // Simple rule with just declarations
        rules.push({ selector, declarations: content });
      }
    }
  },

  /**
   * Debug method to see raw CSS content and rule parsing
   */
  debugRawCSS(): void {
    const allCSS = this.getAllCSS();
    console.group('🔍 Raw CSS Debug');
    console.log('📝 Raw CSS length:', allCSS.length);
    console.log('📝 Raw CSS preview (first 2000 chars):');
    console.log(allCSS.substring(0, 2000));

    const rules = this.extractCSSRules(allCSS);
    console.log('📊 Total extracted rules:', rules.length);
    console.log('📋 First 10 rules:');
    rules.slice(0, 10).forEach((rule, i) => {
      console.log(`  ${i + 1}. ${rule.selector}`);
    });

    // Show some examples of what gets filtered as tasty vs global
    const tastyRules = rules.filter((rule) => {
      const selectors = rule.selector.split(',').map((s) => s.trim());
      return selectors.every((selector) => {
        const cleanSelector = selector.replace(/[.#:\s>+~[\]()]/g, ' ');
        const parts = cleanSelector.split(/\s+/).filter(Boolean);
        return parts.length > 0 && parts.every((part) => /^t\d+$/.test(part));
      });
    });

    const globalRules = rules.filter((rule) => {
      const selectors = rule.selector.split(',').map((s) => s.trim());
      return !selectors.every((selector) => {
        const cleanSelector = selector.replace(/[.#:\s>+~[\]()]/g, ' ');
        const parts = cleanSelector.split(/\s+/).filter(Boolean);
        return parts.length > 0 && parts.every((part) => /^t\d+$/.test(part));
      });
    });

    console.log('🏷️ Tasty class rules found:', tastyRules.length);
    console.log('🌍 Global rules found:', globalRules.length);

    if (globalRules.length > 0) {
      console.log('📋 First 5 global rules:');
      globalRules.slice(0, 5).forEach((rule, i) => {
        console.log(`  ${i + 1}. ${rule.selector}`);
      });
    }

    console.groupEnd();
  },
};

/**
 * Check if we're in a development environment at runtime
 * Uses bracket notation to avoid bundler compilation
 */
function isDevelopmentEnvironment(): boolean {
  if (typeof process === 'undefined') return false;

  // Use bracket notation to avoid bundler replacement
  const nodeEnv = process.env?.['NODE_ENV'];
  return nodeEnv === 'development' || nodeEnv !== 'production';
}

/**
 * Install tastyDebug on window object for easy access in browser console
 * Only in non-production environments
 */
export function installGlobalDebug(options?: { force?: boolean }): void {
  const shouldInstall = options?.force || isDevelopmentEnvironment();

  if (
    typeof window !== 'undefined' &&
    shouldInstall &&
    (window as any).tastyDebug !== tastyDebug
  ) {
    (window as any).tastyDebug = tastyDebug;
    console.log(
      '🎨 tastyDebug installed on window.\n' +
        '💡 Quick start:\n' +
        '  • tastyDebug.getSummary() - comprehensive overview with properties, keyframes & global CSS\n' +
        '  • tastyDebug.inspect(".my-element") - detailed element inspection\n' +
        '  • tastyDebug.getGlobalCSS() - get all global CSS from createGlobalStyle()\n' +
        '  • tastyDebug.logGlobalCSS() - log global CSS to console\n' +
        '  • tastyDebug.logGlobalCSSBreakdown() - detailed global CSS analysis\n' +
        '  • tastyDebug.debugRawCSS() - debug raw CSS parsing and filtering\n' +
        '  • tastyDebug.getDefinedProperties() - list all @property definitions\n' +
        '  • tastyDebug.getDefinedKeyframes() - list all keyframe definitions\n' +
        '  • tastyDebug.getActiveCSS() / getCachedCSS() - get specific CSS\n' +
        '  • tastyDebug.getCleanupSummary() - cleanup statistics overview\n' +
        '  • tastyDebug.logCleanupHistory() - detailed cleanup history',
    );
  }
}

/**
 * Auto-install in development
 */
if (typeof window !== 'undefined' && isDevelopmentEnvironment()) {
  installGlobalDebug();
}
