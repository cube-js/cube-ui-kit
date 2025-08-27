/**
 * Debug utilities for inspecting tasty-generated CSS at runtime
 */

import { getCssText, getCssTextForNode, injector } from './injector';

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
    return injector.instance.getCssTextForClasses([className]);
  },

  /**
   * Get CSS for multiple tasty classes
   */
  getCSSForClasses(classNames: string[]): string {
    return injector.instance.getCssTextForClasses(classNames);
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
      console.log('Generated CSS:', css);
      console.groupEnd();
      return css;
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
      console.log('Generated CSS:', css);
      console.groupEnd();
      return css;
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
   * Find all tasty classes used in the page
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
   * Get a summary of all tasty styles in use
   */
  getSummary(): {
    totalClasses: number;
    classes: string[];
    totalCSSSize: number;
    allCSS: string;
  } {
    const classes = this.findAllTastyClasses();
    const allCSS = this.getAllCSS();

    const summary = {
      totalClasses: classes.length,
      classes,
      totalCSSSize: allCSS.length,
      allCSS,
    };

    console.group('🎨 Tasty Debug Summary');
    console.log(`Total tasty classes found: ${summary.totalClasses}`);
    console.log(`Total CSS size: ${summary.totalCSSSize} characters`);
    console.log('Classes in use:', summary.classes);
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

    // Try to format CSS for better readability
    const formatted = css
      .replace(/\{/g, ' {\n  ')
      .replace(/;/g, ';\n  ')
      .replace(/\}/g, '\n}\n')
      .replace(/,/g, ',\n')
      .replace(/\n\s*\n/g, '\n'); // Remove extra empty lines

    console.log(formatted);
    console.groupEnd();
  },

  /**
   * Advanced inspection with detailed breakdown
   */
  inspect(target: string | Element): {
    element: Element | null;
    tastyClasses: string[];
    css: string;
    breakdown: { [className: string]: string };
  } {
    const element =
      typeof target === 'string' ? document.querySelector(target) : target;

    if (!element) {
      console.error(`Element not found: ${target}`);
      return {
        element: null,
        tastyClasses: [],
        css: '',
        breakdown: {},
      };
    }

    // Find tasty classes on this element
    const classList = element.getAttribute('class') || '';
    const tastyClasses = classList
      .split(/\s+/)
      .filter((cls) => /^t\d+$/.test(cls));

    // Get CSS for the entire subtree
    const fullCSS = getCssTextForNode(element);

    // Get CSS breakdown per class
    const breakdown: { [className: string]: string } = {};
    tastyClasses.forEach((className) => {
      breakdown[className] = this.getCSSForClass(className);
    });

    const result = {
      element,
      tastyClasses,
      css: fullCSS,
      breakdown,
    };

    console.group(`🔍 Detailed Tasty Inspection`);
    console.log('Element:', element);
    console.log('Tasty classes found:', tastyClasses);
    console.log('Total CSS for element tree:', fullCSS);
    console.log('CSS breakdown by class:', breakdown);
    console.groupEnd();

    return result;
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
export function installGlobalDebug(): void {
  if (typeof window !== 'undefined' && isDevelopmentEnvironment()) {
    (window as any).tastyDebug = tastyDebug;
    console.log(
      '🎨 tastyDebug installed on window. Try: tastyDebug.getSummary()',
    );
  }
}

/**
 * Auto-install in development
 */
if (typeof window !== 'undefined' && isDevelopmentEnvironment()) {
  installGlobalDebug();
}
