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
    metrics: any;
    definedProperties: string[];
    definedKeyframes: { name: string; refCount: number; cssText?: string }[];
    propertyCount: number;
    keyframeCount: number;
  } {
    const usage = this.getClassUsage();
    const allCSS = this.getAllCSS();
    const activeCSS = this.getCSSForClasses(usage.activeClasses);
    const cachedCSS = this.getCSSForClasses(usage.cachedClasses);
    const metrics = injector.instance.getMetrics();
    const definedProperties = this.getDefinedProperties();
    const definedKeyframes = this.getDefinedKeyframes();

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
      metrics,
      definedProperties,
      definedKeyframes,
      propertyCount: definedProperties.length,
      keyframeCount: definedKeyframes.length,
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
        '  • tastyDebug.getSummary() - comprehensive overview with properties & keyframes\n' +
        '  • tastyDebug.inspect(".my-element") - detailed element inspection\n' +
        '  • tastyDebug.getDefinedProperties() - list all @property definitions\n' +
        '  • tastyDebug.getDefinedKeyframes() - list all keyframe definitions\n' +
        '  • tastyDebug.getActiveCSS() / getCachedCSS() - get specific CSS',
    );
  }
}

/**
 * Auto-install in development
 */
if (typeof window !== 'undefined' && isDevelopmentEnvironment()) {
  installGlobalDebug();
}
