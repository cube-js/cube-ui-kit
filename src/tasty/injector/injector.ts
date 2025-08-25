/**
 * Style injector that works with structured style objects
 * Eliminates CSS string parsing for better performance
 */

import { StyleResult } from '../utils/renderStyles';

import { flattenNestedCssForSelector } from './flatten';
import { SheetManager } from './sheet-manager';
import {
  DisposeFunction,
  FlattenedRule,
  InjectResult,
  StyleInjectorConfig,
} from './types';

/**
 * Generate sequential class name with format t{number}
 */
function generateClassName(counter: number): string {
  return `t${counter}`;
}

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

    // Convert to flattened rules
    const flattenedRules = this.convertToFlattenedRules(rules);

    // Try to dedupe by className first — if the same class was already inserted, reuse it
    // Only extract className if it looks like a generated tasty className (t + digits)
    const preExtractedClass = this.extractClassName(rules);
    const generatedClass =
      preExtractedClass && /^t\d+$/.test(preExtractedClass)
        ? preExtractedClass
        : null;

    if (generatedClass && registry.rules.has(generatedClass)) {
      const currentRefCount = registry.refCounts.get(generatedClass) || 0;
      registry.refCounts.set(generatedClass, currentRefCount + 1);

      // Update metrics
      if (registry.metrics) {
        registry.metrics.hits++;
      }

      return {
        className: generatedClass,
        dispose: () => this.dispose(generatedClass, registry),
      };
    }

    // Try to restore from disposed cache if className exists but is not active
    if (generatedClass && !registry.rules.has(generatedClass)) {
      const restored = this.sheetManager.restoreFromDisposedCache(
        registry,
        generatedClass,
      );
      if (restored) {
        const currentRefCount = registry.refCounts.get(generatedClass) || 0;
        registry.refCounts.set(generatedClass, currentRefCount + 1);
        return {
          className: generatedClass,
          dispose: () => this.dispose(generatedClass, registry),
        };
      }
    }

    // No active cache dedupe — rely on provided className or disposed cache only

    // Generate final className - only use extracted className if it's a generated tasty className
    const className = generatedClass
      ? generatedClass
      : generateClassName(registry.classCounter++);

    // If a different pre-extracted class was used in rules, rewrite selectors to the final class
    const rulesToInsert =
      generatedClass && generatedClass !== className
        ? flattenedRules.map((r) => {
            if (r.selector.startsWith('.' + generatedClass)) {
              return {
                ...r,
                selector:
                  '.' + className + r.selector.slice(generatedClass.length + 1),
              } as FlattenedRule;
            }
            return r;
          })
        : flattenedRules;

    // Insert rules using existing sheet manager
    const ruleInfo = this.sheetManager.insertRule(
      registry,
      rulesToInsert,
      className,
      root,
    );

    if (!ruleInfo) {
      // Update metrics
      if (registry.metrics) {
        registry.metrics.misses++;
      }

      return {
        className,
        dispose: () => {},
      };
    }

    // Store in registry
    registry.refCounts.set(className, 1);
    registry.rules.set(className, ruleInfo);

    // Update metrics
    if (registry.metrics) {
      registry.metrics.totalInsertions++;
      registry.metrics.misses++;
    }

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
   * Generate cache key from flattened rules with optimized deduplication
   */
  private generateCacheKey(rules: FlattenedRule[]): string {
    const normalizeSelector = (selector: string): string => {
      const match = selector.match(/^\.[a-zA-Z0-9_-]+(.*)$/);
      return match ? match[1] : selector;
    };

    // Sort rules to ensure consistent cache keys for equivalent rule sets
    const sortedRules = [...rules].sort((a, b) => {
      const aKey = `${normalizeSelector(a.selector)}${
        a.atRules ? a.atRules.join('|') : ''
      }`;
      const bKey = `${normalizeSelector(b.selector)}${
        b.atRules ? b.atRules.join('|') : ''
      }`;
      return aKey.localeCompare(bKey);
    });

    return sortedRules
      .map((rule) => {
        const at =
          rule.atRules && rule.atRules.length
            ? `@${rule.atRules.join('|')}`
            : '';
        const sel = normalizeSelector(rule.selector);
        // Normalize declarations by sorting properties for consistent caching
        const normalizedDeclarations = rule.declarations
          .split(';')
          .filter(Boolean)
          .map((decl) => decl.trim())
          .sort()
          .join(';');
        return `${sel}{${normalizedDeclarations}}${at}`;
      })
      .join('');
  }

  /**
   * Dispose of a className
   */
  private dispose(className: string, registry: any): void {
    const currentRefCount = registry.refCounts.get(className) || 0;
    if (currentRefCount <= 1) {
      // Mark for deletion and schedule cleanup - but keep cache entries for disposal cache
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

    // Use a stable pseudo-className to track these global rules in the registry
    const className = generateClassName(registry.classCounter++);

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

    // Track in registry for ref-counted disposal
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
   * Get CSS only for the provided tasty classNames (e.g., ["t0","t3"])
   */
  getCssTextForClasses(
    classNames: Iterable<string>,
    options?: { root?: Document | ShadowRoot },
  ): string {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);

    const cssChunks: string[] = [];
    for (const cls of classNames) {
      const info =
        registry.rules.get(cls) || registry.disposedCache.get(cls)?.ruleInfo;
      if (info) {
        if (info.cssText && info.cssText.length) {
          cssChunks.push(...info.cssText);
        } else {
          // Fallback: try to read from live sheet by index range
          const sheet = registry.sheets[info.sheetIndex];
          const styleSheet = sheet?.sheet?.sheet;
          if (styleSheet) {
            const start = Math.max(0, info.ruleIndex);
            const end = Math.min(
              styleSheet.cssRules.length - 1,
              (info.endRuleIndex as number) ?? info.ruleIndex,
            );
            for (let i = start; i <= end; i++) {
              const rule = styleSheet.cssRules[i] as CSSRule | undefined;
              if (rule) cssChunks.push(rule.cssText);
            }
          }
        }
      }
    }
    return cssChunks.join('\n');
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(options?: { root?: Document | ShadowRoot }): any {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);
    return this.sheetManager.getMetrics(registry);
  }

  /**
   * Reset cache performance metrics
   */
  resetMetrics(options?: { root?: Document | ShadowRoot }): void {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);
    this.sheetManager.resetMetrics(registry);
  }

  /**
   * Force cleanup of disposed rulesets (useful for memory pressure)
   */
  forceCleanupDisposed(options?: { root?: Document | ShadowRoot }): void {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);

    // Clear any scheduled cleanups and immediately clean those
    for (const [className, timeoutId] of registry.cleanupTimeouts) {
      if (
        this.config.idleCleanup &&
        typeof cancelIdleCallback !== 'undefined'
      ) {
        cancelIdleCallback(timeoutId as unknown as number);
      } else {
        clearTimeout(timeoutId);
      }
      const disposedInfo = registry.disposedCache.get(className);
      if (disposedInfo) {
        this.sheetManager['performActualCleanup'](registry, className);
      }
    }
    registry.cleanupTimeouts.clear();

    // Also cleanup any remaining disposed entries that were not scheduled
    const keys = Array.from(registry.disposedCache.keys());
    for (const cls of keys) {
      this.sheetManager['performActualCleanup'](registry, cls);
    }
  }

  /**
   * Destroy all resources for a root
   */
  destroy(root?: Document | ShadowRoot): void {
    const targetRoot = root || document;
    this.sheetManager.cleanup(targetRoot);
  }
}
