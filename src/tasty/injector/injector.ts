import { flattenNestedCss, flattenNestedCssForSelector } from './flatten';
import { hashCssText } from './hash';
import { SheetManager } from './sheet-manager';
import { DisposeFunction, InjectResult, StyleInjectorConfig } from './types';

export class StyleInjector {
  private sheetManager: SheetManager;
  private cleanupScheduled = false;

  constructor(config: StyleInjectorConfig) {
    this.sheetManager = new SheetManager(config);
  }

  /**
   * Inject CSS and return className with dispose function
   * Simple approach: one CSS block -> one class name
   */
  inject(
    cssText: string,
    options?: { root?: Document | ShadowRoot },
  ): InjectResult {
    const root = options?.root || document;
    const registry = this.sheetManager.getRegistry(root);

    if (!cssText.trim()) {
      return {
        className: '',
        dispose: () => {},
      };
    }

    // Generate stable hash for class name
    const className = hashCssText(cssText);

    // Only log for debugging specific issues
    if (process.env.NODE_ENV === 'development' && cssText.length < 100) {
      console.log('StyleInjector.inject (short CSS):', {
        cssText: cssText.substring(0, 100),
        className,
      });
    }

    // CRITICAL DEBUG: Let's also check if we're getting called at all
    if (!cssText || !cssText.trim()) {
      console.error('StyleInjector: Empty or null CSS text received!');
      return {
        className: '',
        dispose: () => {},
      };
    }

    // Check cache first
    const cachedClassName = registry.cache.get(cssText);
    if (cachedClassName) {
      // Increment reference count
      const currentCount = registry.refCounts.get(cachedClassName) || 0;
      registry.refCounts.set(cachedClassName, currentCount + 1);

      console.log(
        'StyleInjector: Cache hit, returning cached class:',
        cachedClassName,
      );

      return {
        className: cachedClassName,
        dispose: () => this.dispose(cachedClassName, registry),
      };
    }

    // Flatten nested CSS rules
    const flattenedRules = flattenNestedCss(cssText, className);

    // Only log if there are no rules (potential issue)
    if (flattenedRules.length === 0) {
      console.warn('StyleInjector: No rules flattened from CSS:', {
        cssText: cssText.substring(0, 100),
        className,
      });
    }

    if (flattenedRules.length === 0) {
      // Fallback: handle simple CSS that might not have been parsed correctly
      // Try to create a simple rule by wrapping with the base class
      const fallbackRule = {
        selector: `.${className}`,
        declarations: cssText.replace(/[{}]/g, '').replace(/&/g, '').trim(),
        atRules: undefined,
      };

      if (fallbackRule.declarations) {
        if (process.env.NODE_ENV === 'development') {
          console.log('StyleInjector: Using fallback parsing for CSS:', {
            cssText:
              cssText.substring(0, 100) + (cssText.length > 100 ? '...' : ''),
            className,
          });
        }

        const ruleInfo = this.sheetManager.insertRule(
          registry,
          [fallbackRule],
          className,
          root,
        );

        if (ruleInfo) {
          registry.cache.set(cssText, className);
          registry.refCounts.set(className, 1);
          registry.rules.set(className, ruleInfo);

          return {
            className,
            dispose: () => this.dispose(className, registry),
          };
        }
      }

      console.warn('StyleInjector: No valid CSS could be parsed:', {
        cssText: cssText.substring(0, 200),
        className,
      });
      return {
        className: '',
        dispose: () => {},
      };
    }

    // Rules were successfully generated - proceed with insertion

    // Insert all flattened rules as a single block
    const ruleInfo = this.sheetManager.insertRule(
      registry,
      flattenedRules,
      className,
      root,
    );

    if (ruleInfo) {
      // Store in cache and set reference count
      registry.cache.set(cssText, className);
      registry.refCounts.set(className, 1);
      registry.rules.set(className, ruleInfo);

      console.log('StyleInjector: SUCCESS! Returning className:', {
        className,
        cssLength: cssText.length,
      });

      return {
        className,
        dispose: () => this.dispose(className, registry),
      };
    } else {
      console.warn(
        'StyleInjector: FAILED! No ruleInfo returned from SheetManager',
      );
      return {
        className: '',
        dispose: () => {},
      };
    }
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

    if (!cssText.trim() || !selector.trim()) {
      return () => {};
    }

    // Create unique key for global rule
    const globalKey = `${selector}:${cssText}`;
    const className = hashCssText(globalKey);

    // Check cache first
    const cachedClassName = registry.cache.get(globalKey);
    if (cachedClassName) {
      // Increment reference count
      const currentCount = registry.refCounts.get(cachedClassName) || 0;
      registry.refCounts.set(cachedClassName, currentCount + 1);

      return () => this.dispose(cachedClassName, registry);
    }

    // Flatten CSS relative to the provided selector, preserving it as-is
    const flattenedRules = flattenNestedCssForSelector(cssText, selector);

    if (flattenedRules.length === 0) {
      return () => {};
    }

    // Insert global rule
    const ruleInfo = this.sheetManager.insertGlobalRule(
      registry,
      flattenedRules,
      className,
      root,
    );

    if (ruleInfo) {
      // Store in cache
      registry.cache.set(globalKey, className);
      registry.refCounts.set(className, 1);
      registry.rules.set(className, ruleInfo);

      return () => this.dispose(className, registry);
    }

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
   * Dispose a CSS rule (decrement reference count and cleanup if needed)
   */
  private dispose(className: string, registry: any): void {
    const currentCount = registry.refCounts.get(className) || 0;

    if (currentCount <= 1) {
      // Schedule for deletion
      registry.refCounts.set(className, 0);
      registry.deletionQueue.push(className);
      this.scheduleCleanup(registry);
    } else {
      // Just decrement
      registry.refCounts.set(className, currentCount - 1);
    }
  }

  /**
   * Schedule cleanup to run in next microtask
   */
  private scheduleCleanup(registry: any): void {
    if (this.cleanupScheduled) {
      return;
    }

    this.cleanupScheduled = true;

    // Use microtask for cleanup
    Promise.resolve().then(() => {
      this.performCleanup(registry);
      this.cleanupScheduled = false;
    });
  }

  /**
   * Perform cleanup of unused rules
   */
  private performCleanup(registry: any): void {
    this.sheetManager.processCleanupQueue(registry);
  }

  /**
   * Force immediate cleanup
   */
  cleanup(root?: Document | ShadowRoot): void {
    const targetRoot = root || document;
    const registry = this.sheetManager.getRegistry(targetRoot);

    this.sheetManager.processCleanupQueue(registry);
  }

  /**
   * Destroy all resources for a root
   */
  destroy(root?: Document | ShadowRoot): void {
    const targetRoot = root || document;
    this.sheetManager.cleanup(targetRoot);
  }
}
