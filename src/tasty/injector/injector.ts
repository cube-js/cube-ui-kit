/**
 * Style injector that works with structured style objects
 * Eliminates CSS string parsing for better performance
 */

import { StyleResult } from '../utils/renderStylesDirect';

import { hashCssText } from './hash';
import { SheetManager } from './sheet-manager';
import {
  DisposeFunction,
  FlattenedRule,
  InjectResult,
  StyleInjectorConfig,
} from './types';

export class StyleInjector {
  private sheetManager: SheetManager;
  private config: StyleInjectorConfig;
  private cleanupScheduled = false;

  constructor(config: StyleInjectorConfig = {}) {
    this.config = config;
    this.sheetManager = new SheetManager(config);
  }

  /**
   * Inject styles from StyleResult objects
   */
  inject(
    rules: StyleResult[],
    options?: { root?: Document | ShadowRoot },
  ): InjectResult {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);

    if (rules.length === 0) {
      return {
        className: '',
        dispose: () => {},
      };
    }

    // Try to dedupe by className first — if the same class was already inserted, reuse it
    const preExtractedClass = this.extractClassName(rules);
    if (preExtractedClass && registry.rules.has(preExtractedClass)) {
      const currentRefCount = registry.refCounts.get(preExtractedClass) || 0;
      registry.refCounts.set(preExtractedClass, currentRefCount + 1);

      return {
        className: preExtractedClass,
        dispose: () => this.dispose(preExtractedClass, registry),
      };
    }

    // Convert to flattened rules for the existing sheet manager
    const flattenedRules = this.convertToFlattenedRules(rules);

    // Generate cache key and className
    const cacheKey = this.generateCacheKey(flattenedRules);
    const className =
      preExtractedClass ||
      this.extractClassName(rules) ||
      hashCssText(cacheKey);

    // Check cache
    const existingClassName = registry.cache.get(cacheKey);
    if (existingClassName) {
      // Increment reference count
      const currentRefCount = registry.refCounts.get(existingClassName) || 0;
      registry.refCounts.set(existingClassName, currentRefCount + 1);

      return {
        className: existingClassName,
        dispose: () => this.dispose(existingClassName, registry),
      };
    }

    // Insert rules using existing sheet manager
    const ruleInfo = this.sheetManager.insertRule(
      registry,
      flattenedRules,
      className,
      root,
    );

    if (!ruleInfo) {
      return {
        className,
        dispose: () => {},
      };
    }

    // Store in cache and registry
    registry.cache.set(cacheKey, className);
    registry.refCounts.set(className, 1);
    registry.rules.set(className, ruleInfo);

    return {
      className,
      dispose: () => this.dispose(className, registry),
    };
  }

  /**
   * Convert StyleResult to FlattenedRule format
   */
  private convertToFlattenedRules(rules: StyleResult[]): FlattenedRule[] {
    return rules.map((rule) => ({
      selector: rule.selector,
      declarations: rule.declarations,
      atRules: rule.atRules,
    }));
  }

  /**
   * Extract className from rules (assumes first rule contains the base className)
   */
  private extractClassName(rules: StyleResult[]): string | null {
    for (const rule of rules) {
      const match = rule.selector.match(/^\.([a-zA-Z0-9_-]+)/);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Generate cache key from flattened rules
   */
  private generateCacheKey(rules: FlattenedRule[]): string {
    const normalizeSelector = (selector: string): string => {
      const match = selector.match(/^\.[a-zA-Z0-9_-]+(.*)$/);
      return match ? match[1] : selector;
    };

    return rules
      .map((rule) => {
        const at =
          rule.atRules && rule.atRules.length
            ? `@${rule.atRules.join('|')}`
            : '';
        const sel = normalizeSelector(rule.selector);
        return `${sel}{${rule.declarations}}${at}`;
      })
      .join('');
  }

  /**
   * Dispose of a className
   */
  private dispose(className: string, registry: any): void {
    const currentRefCount = registry.refCounts.get(className) || 0;
    if (currentRefCount <= 1) {
      // Mark for deletion and schedule cleanup
      registry.refCounts.set(className, 0);
      registry.deletionQueue.push(className);
      this.scheduleCleanup(registry);
    } else {
      registry.refCounts.set(className, currentRefCount - 1);
    }
  }

  /**
   * Cleanup unused rules
   */
  cleanup(root?: Document | ShadowRoot): void {
    const registry = this.sheetManager.getRegistry(root || document);
    this.sheetManager.processCleanupQueue(registry);
  }

  /**
   * Schedule cleanup to run in the next microtask
   */
  private scheduleCleanup(registry: any): void {
    if (this.cleanupScheduled) return;
    this.cleanupScheduled = true;
    Promise.resolve().then(() => {
      this.sheetManager.processCleanupQueue(registry);
      this.cleanupScheduled = false;
    });
  }

  /**
   * Inject global CSS rule (legacy method - not supported in direct injector)
   */
  injectGlobal(
    selector: string,
    cssText: string,
    options?: { root?: Document | ShadowRoot },
  ): DisposeFunction {
    console.warn(
      'injectGlobal is not supported in the direct style injector. Use inject() with pre-processed rules instead.',
    );
    return () => {};
  }

  /**
   * Get CSS text from all sheets (for SSR)
   */
  getCssText(options?: { root?: Document | ShadowRoot }): string {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);
    return this.sheetManager.getCssText(registry);
  }

  /**
   * Destroy all resources for a root
   */
  destroy(root?: Document | ShadowRoot): void {
    const targetRoot = root || document;
    this.sheetManager.cleanup(targetRoot);
  }
}
