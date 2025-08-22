import { flattenNestedCss, wrapWithAtRules } from './flatten';
import { hashCssText } from './hash';
import { SheetManager } from './sheet-manager';
import {
  DisposeFunction,
  InjectResult,
  RuleInfo,
  StyleInjectorConfig,
} from './types';

export class StyleInjector {
  private sheetManager: SheetManager;
  private cleanupScheduled = false;

  constructor(config: StyleInjectorConfig) {
    this.sheetManager = new SheetManager(config);
  }

  /**
   * Inject CSS and return className with dispose function
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

    // Generate hash for deduplication
    const hash = hashCssText(cssText);
    const className = hash.slice(2); // Remove 't-' prefix for internal use

    // Check if already injected
    let ruleInfos = registry.cache.get(hash);

    if (ruleInfos) {
      // Increment reference count
      const currentCount = registry.refCounts.get(hash) || 0;
      registry.refCounts.set(hash, currentCount + 1);

      return {
        className: hash, // Return full class name with prefix
        dispose: () => this.dispose(hash, registry, false),
      };
    }

    // Flatten nested CSS
    const flattenedRules = flattenNestedCss(cssText, className);

    if (flattenedRules.length === 0) {
      return {
        className: '',
        dispose: () => {},
      };
    }

    try {
      // Inject flattened rules
      const allRuleInfos: RuleInfo[] = [];

      for (const rule of flattenedRules) {
        const baseRule = `${rule.selector} { ${rule.declarations} }`;
        const fullRule = wrapWithAtRules(baseRule, rule.atRules);
        const ruleInfo = this.sheetManager.insertRule(registry, fullRule, root);
        ruleInfo.className = hash;
        allRuleInfos.push(ruleInfo);
      }

      // Store all rule infos
      if (allRuleInfos.length > 0) {
        registry.cache.set(hash, allRuleInfos);
        registry.refCounts.set(hash, 1);
      }

      return {
        className: hash,
        dispose: () => this.dispose(hash, registry, false),
      };
    } catch (error) {
      console.error('Failed to inject CSS:', error);
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

    // Create hash for global rule
    const globalKey = `${selector}:${cssText}`;
    const hash = hashCssText(globalKey);

    // Check if already injected
    let ruleInfos = registry.globalCache.get(hash);

    if (ruleInfos) {
      // Increment reference count
      const currentCount = registry.globalRefCounts.get(hash) || 0;
      registry.globalRefCounts.set(hash, currentCount + 1);

      return () => this.dispose(hash, registry, true);
    }

    try {
      // Handle nested CSS in global rules
      const allRuleInfos: RuleInfo[] = [];

      // Use a special marker for global selector flattening
      const globalMarker = `__GLOBAL_${Date.now()}__`;
      const flattenedRules = flattenNestedCss(cssText, globalMarker);

      if (flattenedRules.length === 0) {
        // Simple case: no nested rules
        const fullRule = `${selector} { ${cssText} }`;
        const ruleInfo = this.sheetManager.insertRule(registry, fullRule, root);
        ruleInfo.className = hash;
        allRuleInfos.push(ruleInfo);
      } else {
        // Process flattened rules
        for (const rule of flattenedRules) {
          // Replace all global marker occurrences with the actual selector
          const finalSelector = rule.selector
            .split(`.${globalMarker}`)
            .join(selector);
          const baseRule = `${finalSelector} { ${rule.declarations} }`;
          const fullRule = wrapWithAtRules(baseRule, rule.atRules);
          const ruleInfo = this.sheetManager.insertRule(
            registry,
            fullRule,
            root,
          );
          ruleInfo.className = hash;
          allRuleInfos.push(ruleInfo);
        }
      }

      // Store all rule infos
      if (allRuleInfos.length > 0) {
        registry.globalCache.set(hash, allRuleInfos);
        registry.globalRefCounts.set(hash, 1);
      }

      return () => this.dispose(hash, registry, true);
    } catch (error) {
      console.error('Failed to inject global CSS:', error);
      return () => {};
    }
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
  private dispose(hash: string, registry: any, isGlobal: boolean): void {
    const refCountsMap = isGlobal
      ? registry.globalRefCounts
      : registry.refCounts;
    const currentCount = refCountsMap.get(hash) || 0;

    if (currentCount <= 1) {
      // Schedule for deletion
      refCountsMap.set(hash, 0);
      registry.deletionQueue.push(hash);
      this.scheduleCleanup(registry);
    } else {
      // Just decrement
      refCountsMap.set(hash, currentCount - 1);
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
    // Always process the queue when scheduled
    // gcThreshold is used only for batching scheduling, not blocking cleanup
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
