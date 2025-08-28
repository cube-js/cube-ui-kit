/**
 * Style injector that works with structured style objects
 * Eliminates CSS string parsing for better performance
 */

import { StyleResult } from '../utils/renderStyles';

// Simple CSS text to StyleResult converter for injectGlobal backward compatibility
import { SheetManager } from './sheet-manager';
import { InjectResult, StyleInjectorConfig, StyleRule } from './types';

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

    // Rules are now in StyleRule format directly

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

    // Try to restore from unused styles if className exists but is not active
    if (
      generatedClass &&
      registry.rules.has(generatedClass) &&
      !registry.refCounts.has(generatedClass)
    ) {
      const restored = this.sheetManager.restoreFromUnused(
        registry,
        generatedClass,
      );
      if (restored) {
        // Update metrics
        if (registry.metrics) {
          registry.metrics.hits++;
        }

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
        ? rules.map((r) => {
            if (r.selector.startsWith('.' + generatedClass)) {
              return {
                ...r,
                selector:
                  '.' + className + r.selector.slice(generatedClass.length + 1),
              } as StyleRule;
            }
            return r;
          })
        : rules;

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
   * Generate cache key from style rules with optimized deduplication
   */
  private generateCacheKey(rules: StyleRule[]): string {
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
      // Mark as unused immediately
      this.sheetManager.markAsUnused(registry, className);
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
   * Force bulk cleanup of unused styles
   */
  forceBulkCleanup(root?: Document | ShadowRoot): void {
    const registry = this.sheetManager.getRegistry(root || document);
    this.sheetManager['performBulkCleanup'](registry);
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
      const info = registry.rules.get(cls);
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
   * Force cleanup of unused styles (useful for memory pressure)
   */
  forceCleanupUnused(options?: { root?: Document | ShadowRoot }): void {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);
    this.sheetManager['performBulkCleanup'](registry);
  }

  /**
   * Destroy all resources for a root
   */
  destroy(root?: Document | ShadowRoot): void {
    const targetRoot = root || document;
    this.sheetManager.cleanup(targetRoot);
  }
}
