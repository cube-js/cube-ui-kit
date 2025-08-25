import { Lru } from '../parser/lru';

import {
  CacheMetrics,
  DisposedRuleInfo,
  FlattenedRule,
  RootRegistry,
  RuleInfo,
  SheetInfo,
  StyleInjectorConfig,
} from './types';

export class SheetManager {
  private rootRegistries = new WeakMap<Document | ShadowRoot, RootRegistry>();
  private config: StyleInjectorConfig;

  constructor(config: StyleInjectorConfig) {
    this.config = config;
  }

  /**
   * Get or create registry for a root (Document or ShadowRoot)
   */
  getRegistry(root: Document | ShadowRoot): RootRegistry {
    let registry = this.rootRegistries.get(root);

    if (!registry) {
      const metrics: CacheMetrics | undefined = this.config.collectMetrics
        ? {
            hits: 0,
            misses: 0,
            disposedHits: 0,
            evictions: 0,
            totalInsertions: 0,
            totalDisposals: 0,
            domCleanups: 0,
            startTime: Date.now(),
          }
        : undefined;

      const disposedCache = new Lru<string, DisposedRuleInfo>(
        this.config.cacheSize || 500,
      );

      registry = {
        sheets: [],
        refCounts: new Map(),
        rules: new Map(),
        deletionQueue: [],
        ruleTextSet: new Set<string>(),
        disposedCache,
        cleanupTimeouts: new Map(),
        metrics,
        classCounter: 0,
      } as unknown as RootRegistry;

      // Perform DOM cleanup only when an item is evicted from the LRU
      disposedCache.setOnEvict((key) => {
        this.performActualCleanup(registry as RootRegistry, key);
        if ((registry as RootRegistry).metrics) {
          (registry as RootRegistry).metrics!.evictions++;
        }
      });

      this.rootRegistries.set(root, registry);
    }

    return registry;
  }

  /**
   * Create a new stylesheet for the registry
   */
  createSheet(registry: RootRegistry, root: Document | ShadowRoot): SheetInfo {
    const sheet = this.createStyleElement(root);

    const sheetInfo: SheetInfo = {
      sheet,
      ruleCount: 0,
      holes: [],
    };

    registry.sheets.push(sheetInfo);
    return sheetInfo;
  }

  /**
   * Create a style element and append to document
   */
  private createStyleElement(root: Document | ShadowRoot): HTMLStyleElement {
    const style =
      (root as Document).createElement?.('style') ||
      document.createElement('style');

    if (this.config.nonce) {
      style.nonce = this.config.nonce;
    }

    style.setAttribute('data-tasty', '');

    // Append to head or shadow root
    if ('head' in root && root.head) {
      root.head.appendChild(style);
    } else if ('appendChild' in root) {
      root.appendChild(style);
    } else {
      document.head.appendChild(style);
    }

    // Verify it was actually added - log only if there's a problem and we're not using forceTextInjection
    if (!style.isConnected && !this.config.forceTextInjection) {
      console.error('SheetManager: Style element failed to connect to DOM!', {
        parentNode: style.parentNode?.nodeName,
        isConnected: style.isConnected,
      });
    }

    return style;
  }

  /**
   * Insert CSS rules as a single block
   */
  insertRule(
    registry: RootRegistry,
    flattenedRules: FlattenedRule[],
    className: string,
    root: Document | ShadowRoot,
  ): RuleInfo | null {
    // Find or create a sheet with available space
    let targetSheet = this.findAvailableSheet(registry, root);

    if (!targetSheet) {
      targetSheet = this.createSheet(registry, root);
    }

    const ruleIndex = this.findAvailableRuleIndex(targetSheet);
    const sheetIndex = registry.sheets.indexOf(targetSheet);

    try {
      // Group rules by selector and at-rules to combine declarations
      const groupedRules: FlattenedRule[] = [];
      const groupMap = new Map<
        string,
        {
          idx: number;
          selector: string;
          atRules?: string[];
          declarations: string;
        }
      >();

      const atKey = (at?: string[]) => (at && at.length ? at.join('|') : '');

      flattenedRules.forEach((r) => {
        const key = `${atKey(r.atRules)}||${r.selector}`;
        const existing = groupMap.get(key);
        if (existing) {
          // Append declarations, preserving order
          existing.declarations = existing.declarations
            ? `${existing.declarations} ${r.declarations}`
            : r.declarations;
        } else {
          groupMap.set(key, {
            idx: groupedRules.length,
            selector: r.selector,
            atRules: r.atRules,
            declarations: r.declarations,
          });
          groupedRules.push({ ...r });
        }
      });

      // Normalize groupedRules from map (with merged declarations)
      groupMap.forEach((val) => {
        groupedRules[val.idx] = {
          selector: val.selector,
          atRules: val.atRules,
          declarations: val.declarations,
        } as FlattenedRule;
      });

      // Insert grouped rules
      const insertedRuleTexts: string[] = [];
      let currentRuleIndex = ruleIndex;
      let firstInsertedIndex: number | null = null;
      let lastInsertedIndex: number | null = null;

      for (const rule of groupedRules) {
        const declarations = rule.declarations;
        const baseRule = `${rule.selector} { ${declarations} }`;

        // Wrap with at-rules if present
        let fullRule = baseRule;
        if (rule.atRules && rule.atRules.length > 0) {
          fullRule = rule.atRules.reduce(
            (css, atRule) => `${atRule} { ${css} }`,
            baseRule,
          );
        }

        // Insert individual rule into style element
        const styleElement = targetSheet.sheet;
        const styleSheet = styleElement.sheet;

        if (styleSheet && !this.config.forceTextInjection) {
          const maxIndex = styleSheet.cssRules.length;
          const safeIndex = Math.min(Math.max(0, currentRuleIndex), maxIndex);
          styleSheet.insertRule(fullRule, safeIndex);
          if (firstInsertedIndex == null) firstInsertedIndex = safeIndex;
          lastInsertedIndex = safeIndex;
          currentRuleIndex = safeIndex + 1;
        } else {
          // Use textContent (either as fallback or when forceTextInjection is enabled)
          styleElement.textContent =
            (styleElement.textContent || '') + '\n' + fullRule;
          if (firstInsertedIndex == null) firstInsertedIndex = currentRuleIndex;
          lastInsertedIndex = currentRuleIndex;
          currentRuleIndex++;
        }

        // CRITICAL DEBUG: Verify the style element is in DOM only if there are issues and we're not using forceTextInjection
        if (!styleElement.parentNode && !this.config.forceTextInjection) {
          console.error(
            'SheetManager: Style element is NOT in DOM! This is the problem!',
            {
              className,
              ruleIndex: currentRuleIndex,
            },
          );
        }

        insertedRuleTexts.push(fullRule);
        // Track inserted rule texts for validation/debugging
        try {
          registry.ruleTextSet.add(fullRule);
        } catch (_) {
          // noop: defensive in case ruleTextSet is unavailable
        }
        // currentRuleIndex already adjusted above
      }

      // Update sheet info based on the number of rules inserted
      const finalRuleIndex = currentRuleIndex - 1;
      if (finalRuleIndex >= targetSheet.ruleCount) {
        targetSheet.ruleCount = finalRuleIndex + 1;
      }

      return {
        className,
        ruleIndex: firstInsertedIndex ?? ruleIndex,
        sheetIndex,
        cssText: insertedRuleTexts, // store each inserted rule text
        endRuleIndex: lastInsertedIndex ?? finalRuleIndex,
      };
    } catch (error) {
      console.warn('Failed to insert CSS rules:', error, {
        flattenedRules,
        className,
      });
      return null;
    }
  }

  /**
   * Insert global CSS rules
   */
  insertGlobalRule(
    registry: RootRegistry,
    flattenedRules: FlattenedRule[],
    className: string,
    root: Document | ShadowRoot,
  ): RuleInfo | null {
    // For now, global rules are handled the same way as regular rules
    return this.insertRule(registry, flattenedRules, className, root);
  }

  /**
   * Delete a CSS rule from the sheet
   */
  deleteRule(registry: RootRegistry, ruleInfo: RuleInfo): void {
    const sheet = registry.sheets[ruleInfo.sheetIndex];

    if (!sheet) {
      return;
    }

    try {
      const texts = Array.isArray(ruleInfo.cssText)
        ? ruleInfo.cssText.slice()
        : [];

      const styleElement = sheet.sheet;
      const styleSheet = styleElement.sheet;

      if (styleSheet) {
        const rules = styleSheet.cssRules;

        // Try safe contiguous deletion only if the expected block matches exactly
        const expectedCount = texts.length;
        const startIdx = Math.max(0, ruleInfo.ruleIndex);
        const endIdxFromTexts = startIdx + Math.max(0, expectedCount - 1);
        const canAttemptContiguous =
          Number.isFinite(startIdx) &&
          expectedCount > 0 &&
          endIdxFromTexts < rules.length;

        let contiguousMatches = false;
        if (canAttemptContiguous) {
          contiguousMatches = true;
          for (let j = 0; j < expectedCount; j++) {
            if ((rules[startIdx + j] as CSSRule).cssText !== texts[j]) {
              contiguousMatches = false;
              break;
            }
          }
        }

        if (contiguousMatches) {
          for (let idx = startIdx + expectedCount - 1; idx >= startIdx; idx--) {
            if (idx < 0 || idx >= styleSheet.cssRules.length) continue;
            styleSheet.deleteRule(idx);
          }
        } else {
          // Fallback: locate each rule by exact cssText and delete
          for (const text of texts) {
            let idx = -1;
            for (let i = styleSheet.cssRules.length - 1; i >= 0; i--) {
              if ((styleSheet.cssRules[i] as CSSRule).cssText === text) {
                idx = i;
                break;
              }
            }
            if (idx >= 0) {
              styleSheet.deleteRule(idx);
            }
          }
        }

        // Update rule count to reflect deleted rules
        sheet.ruleCount = Math.max(0, sheet.ruleCount - texts.length);
      }

      // Remove texts from validation set
      try {
        for (const text of texts) {
          registry.ruleTextSet.delete(text);
        }
      } catch (_) {
        // noop
      }
    } catch (error) {
      console.warn('Failed to delete CSS rule:', error);
    }
  }

  /**
   * Find a sheet with available space or return null
   */
  private findAvailableSheet(
    registry: RootRegistry,
    root: Document | ShadowRoot,
  ): SheetInfo | null {
    const maxRules = this.config.maxRulesPerSheet;

    if (!maxRules) {
      // No limit, use the last sheet if it exists
      const lastSheet = registry.sheets[registry.sheets.length - 1];
      return lastSheet || null;
    }

    // Find sheet with space
    for (const sheet of registry.sheets) {
      if (sheet.ruleCount < maxRules) {
        return sheet;
      }
    }

    return null; // No available sheet found
  }

  /**
   * Find an available rule index in the sheet
   */
  findAvailableRuleIndex(sheet: SheetInfo): number {
    // Always append to the end - CSS doesn't have holes
    return sheet.ruleCount;
  }

  /**
   * Move a ruleset to disposed cache for potential reuse
   */
  moveToDisposedCache(registry: RootRegistry, className: string): void {
    const ruleInfo = registry.rules.get(className);
    if (!ruleInfo) return;

    // Move to disposed cache
    const disposedInfo: DisposedRuleInfo = {
      ruleInfo,
      disposedAt: Date.now(),
      recentlyUsed: false,
    };

    registry.disposedCache.set(className, disposedInfo);

    // Remove from active registry
    registry.rules.delete(className);
    registry.refCounts.delete(className);

    // Update metrics
    if (registry.metrics) {
      registry.metrics.totalDisposals++;
    }

    // If we have a disposed LRU cache, don't schedule DOM cleanup.
    // Cleanup will occur on LRU eviction or via manual forceCleanup.
    if ((this.config.cacheSize || 0) > 0) {
      return;
    }

    // Schedule lazy cleanup if configured (legacy behavior when no cache)
    if (this.config.idleCleanup && typeof requestIdleCallback !== 'undefined') {
      // Use requestIdleCallback for cleanup when available and enabled
      const timeoutId = requestIdleCallback(() => {
        this.performActualCleanup(registry, className);
      }) as ReturnType<typeof requestIdleCallback>;

      registry.cleanupTimeouts.set(className, timeoutId);
    } else {
      const cleanupDelay = this.config.cleanupDelay || 5000;
      if (cleanupDelay > 0) {
        const timeoutId = setTimeout(() => {
          this.performActualCleanup(registry, className);
        }, cleanupDelay);

        registry.cleanupTimeouts.set(className, timeoutId);
      } else {
        // Immediate cleanup
        this.performActualCleanup(registry, className);
      }
    }
  }

  /**
   * Restore a ruleset from disposed cache
   */
  restoreFromDisposedCache(
    registry: RootRegistry,
    className: string,
  ): RuleInfo | null {
    const disposedInfo = registry.disposedCache.get(className);
    if (!disposedInfo) return null;

    // Cancel any scheduled cleanup
    const timeoutId = registry.cleanupTimeouts.get(className);
    if (timeoutId) {
      if (
        this.config.idleCleanup &&
        typeof cancelIdleCallback !== 'undefined'
      ) {
        cancelIdleCallback(timeoutId as unknown as number);
      } else {
        clearTimeout(timeoutId);
      }
      registry.cleanupTimeouts.delete(className);
    }

    // Restore to active registry
    registry.rules.set(className, disposedInfo.ruleInfo);
    registry.refCounts.set(className, 1);

    // Remove from disposed cache
    registry.disposedCache.delete(className);

    // Mark as recently used for optimization
    disposedInfo.recentlyUsed = true;

    // Update metrics
    if (registry.metrics) {
      registry.metrics.disposedHits++;
    }

    return disposedInfo.ruleInfo;
  }

  /**
   * Actually remove CSS rules from DOM (lazy cleanup)
   */
  private performActualCleanup(
    registry: RootRegistry,
    className: string,
  ): void {
    const disposedInfo = registry.disposedCache.get(className);
    if (!disposedInfo) return;

    // Remove from DOM
    this.deleteRule(registry, disposedInfo.ruleInfo);

    // Remove from disposed cache
    registry.disposedCache.delete(className);

    // Clean up timeout tracking
    registry.cleanupTimeouts.delete(className);

    // Update metrics
    if (registry.metrics) {
      registry.metrics.domCleanups++;
    }
  }

  /**
   * Process the deletion queue for cleanup
   */
  processCleanupQueue(registry: RootRegistry): void {
    const { deletionQueue } = registry;

    if (deletionQueue.length === 0) {
      return;
    }

    // Process deletions
    const toDelete = [...deletionQueue];
    deletionQueue.length = 0; // Clear queue

    for (const className of toDelete) {
      // Check if still referenced
      const refCount = registry.refCounts.get(className) || 0;

      if (refCount <= 0) {
        // Move to disposed cache
        const ruleInfo = registry.rules.get(className);
        if (ruleInfo) {
          this.moveToDisposedCache(registry, className);
        }
      }
    }
  }

  /**
   * Get total number of rules across all sheets
   */
  getTotalRuleCount(registry: RootRegistry): number {
    return registry.sheets.reduce(
      (total, sheet) => total + sheet.ruleCount - sheet.holes.length,
      0,
    );
  }

  /**
   * Get CSS text from all sheets (for SSR)
   */
  getCssText(registry: RootRegistry): string {
    const cssChunks: string[] = [];

    for (const sheet of registry.sheets) {
      try {
        const styleElement = sheet.sheet;
        if (styleElement.textContent) {
          cssChunks.push(styleElement.textContent);
        } else if (styleElement.sheet) {
          const rules = Array.from(styleElement.sheet.cssRules);
          cssChunks.push(rules.map((rule) => rule.cssText).join('\n'));
        }
      } catch (error) {
        console.warn('Failed to read CSS from sheet:', error);
      }
    }

    return cssChunks.join('\n');
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(registry: RootRegistry): CacheMetrics | null {
    return registry.metrics || null;
  }

  /**
   * Reset cache performance metrics
   */
  resetMetrics(registry: RootRegistry): void {
    if (registry.metrics) {
      registry.metrics = {
        hits: 0,
        misses: 0,
        disposedHits: 0,
        evictions: 0,
        totalInsertions: 0,
        totalDisposals: 0,
        domCleanups: 0,
        startTime: Date.now(),
      };
    }
  }

  /**
   * Clean up resources for a root
   */
  cleanup(root: Document | ShadowRoot): void {
    const registry = this.rootRegistries.get(root);

    if (!registry) {
      return;
    }

    // Clear all cleanup timeouts
    for (const timeoutId of registry.cleanupTimeouts.values()) {
      if (
        this.config.idleCleanup &&
        typeof cancelIdleCallback !== 'undefined'
      ) {
        cancelIdleCallback(timeoutId as unknown as number);
      } else {
        clearTimeout(timeoutId);
      }
    }
    registry.cleanupTimeouts.clear();

    // Remove all sheets
    for (const sheet of registry.sheets) {
      try {
        // Remove style element
        const styleElement = sheet.sheet;
        if (styleElement.parentNode) {
          styleElement.parentNode.removeChild(styleElement);
        }
      } catch (error) {
        console.warn('Failed to cleanup sheet:', error);
      }
    }

    // Clear registry
    this.rootRegistries.delete(root);
  }
}
