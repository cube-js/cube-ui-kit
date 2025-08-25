/**
 * Style injector that works with structured style objects
 * Eliminates CSS string parsing for better performance
 */

import { StyleResult } from '../utils/renderStyles';

import { flattenNestedCssForSelector } from './flatten';
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

    // Check cache; ensure cached class still has rules
    const existingClassName = registry.cache.get(cacheKey);
    if (existingClassName && registry.rules.has(existingClassName)) {
      const currentRefCount = registry.refCounts.get(existingClassName) || 0;
      registry.refCounts.set(existingClassName, currentRefCount + 1);

      return {
        className: existingClassName,
        dispose: () => this.dispose(existingClassName, registry),
      };
    }

    // If cache is stale (className missing rules), remove mapping
    if (existingClassName && !registry.rules.has(existingClassName)) {
      registry.cache.set(cacheKey, undefined as unknown as string);
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
    registry.cacheKeysByClassName.set(className, cacheKey);
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
      // Mark for deletion and schedule cleanup; also remove cache binding
      registry.refCounts.set(className, 0);
      registry.deletionQueue.push(className);
      const cacheKey = registry.cacheKeysByClassName.get(className);
      if (cacheKey) {
        // Delete cache entry to force fresh insert next time with same key
        registry.cache.delete(cacheKey);
        registry.cacheKeysByClassName.delete(className);
      }
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
   * Inject global CSS rule
   */
  injectGlobal(
    selector: string,
    cssText: string,
    options?: { root?: Document | ShadowRoot },
  ): DisposeFunction {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);

    if (!cssText || !selector) {
      return () => {};
    }

    // Create a deterministic key for caching/deduplication
    const cacheKey = `G|${selector}|${cssText}`;
    const existingClassName = registry.cache.get(cacheKey);

    if (existingClassName && registry.rules.has(existingClassName)) {
      const currentRefCount = registry.refCounts.get(existingClassName) || 0;
      registry.refCounts.set(existingClassName, currentRefCount + 1);
      return () => this.dispose(existingClassName, registry);
    }

    // Use a stable pseudo-className to track these global rules in the registry
    const className = hashCssText(cacheKey);

    // Flatten nested CSS against the provided selector (handles &, .Class, SubElement, etc.)
    const flattenedRules: FlattenedRule[] = flattenNestedCssForSelector(
      cssText,
      selector,
    );

    // Insert the rules as a block using the sheet manager, just like normal rules
    const ruleInfo = this.sheetManager.insertGlobalRule(
      registry,
      flattenedRules,
      className,
      root,
    );

    if (!ruleInfo) {
      return () => {};
    }

    // Track in caches and registry for ref-counted disposal
    registry.cache.set(cacheKey, className);
    registry.cacheKeysByClassName.set(className, cacheKey);
    registry.refCounts.set(className, 1);
    registry.rules.set(className, ruleInfo);

    return () => this.dispose(className, registry);
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
