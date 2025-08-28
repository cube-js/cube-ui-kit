import { Lru } from '../parser/lru';

import {
  CacheMetrics,
  RootRegistry,
  RuleInfo,
  SheetInfo,
  StyleInjectorConfig,
  StyleRule,
  UnusedRuleInfo,
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
            unusedHits: 0,
            bulkCleanups: 0,
            totalInsertions: 0,
            totalUnused: 0,
            stylesCleanedUp: 0,
            startTime: Date.now(),
          }
        : undefined;

      registry = {
        sheets: [],
        refCounts: new Map(),
        rules: new Map(),
        unusedRules: new Map(),
        ruleTextSet: new Set<string>(),
        bulkCleanupTimeout: null,
        metrics,
        classCounter: 0,
      } as unknown as RootRegistry;

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
    flattenedRules: StyleRule[],
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
      const groupedRules: StyleRule[] = [];
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
        } as StyleRule;
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

        // Conditionally store cssText and track for debug
        if (this.config.debugMode) {
          insertedRuleTexts.push(fullRule);
          try {
            registry.ruleTextSet.add(fullRule);
          } catch (_) {
            // noop: defensive in case ruleTextSet is unavailable
          }
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
        cssText: this.config.debugMode ? insertedRuleTexts : [],
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
    flattenedRules: StyleRule[],
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

        // Prefer index-based deletion when possible
        const startIdx = Math.max(0, ruleInfo.ruleIndex);
        const endIdx = Math.min(
          rules.length - 1,
          Number.isFinite(ruleInfo.endRuleIndex as number)
            ? (ruleInfo.endRuleIndex as number)
            : startIdx - 1,
        );

        if (Number.isFinite(startIdx) && endIdx >= startIdx) {
          for (let idx = endIdx; idx >= startIdx; idx--) {
            if (idx < 0 || idx >= styleSheet.cssRules.length) continue;
            styleSheet.deleteRule(idx);
          }
          sheet.ruleCount = Math.max(
            0,
            sheet.ruleCount - (endIdx - startIdx + 1),
          );
        } else if (this.config.debugMode && texts.length) {
          // Fallback: locate each rule by exact cssText and delete (debug mode only)
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
          sheet.ruleCount = Math.max(0, sheet.ruleCount - texts.length);
        }
      }

      // Remove texts from validation set
      if (this.config.debugMode) {
        try {
          for (const text of texts) {
            registry.ruleTextSet.delete(text);
          }
        } catch (_) {
          // noop
        }
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
   * Mark a ruleset as unused but keep it in the stylesheet
   */
  markAsUnused(registry: RootRegistry, className: string): void {
    const ruleInfo = registry.rules.get(className);
    if (!ruleInfo) return;

    // Mark as unused (but keep in registry.rules)
    const unusedInfo: UnusedRuleInfo = {
      ruleInfo,
      markedUnusedAt: Date.now(),
    };

    registry.unusedRules.set(className, unusedInfo);
    registry.refCounts.delete(className);

    // Update metrics
    if (registry.metrics) {
      registry.metrics.totalUnused++;
    }

    // Schedule bulk cleanup if threshold exceeded
    const threshold = this.config.unusedStylesThreshold || 500;
    if (registry.unusedRules.size >= threshold) {
      this.scheduleBulkCleanup(registry);
    }
  }

  /**
   * Restore a ruleset from unused styles
   */
  restoreFromUnused(
    registry: RootRegistry,
    className: string,
  ): RuleInfo | null {
    const unusedInfo = registry.unusedRules.get(className);
    if (!unusedInfo) return null;

    // Remove from unused rules (rules stays in registry.rules)
    registry.unusedRules.delete(className);
    registry.refCounts.set(className, 1);

    // Update metrics
    if (registry.metrics) {
      registry.metrics.unusedHits++;
    }

    return unusedInfo.ruleInfo;
  }

  /**
   * Schedule bulk cleanup of all unused styles
   */
  private scheduleBulkCleanup(registry: RootRegistry): void {
    // Don't schedule if already scheduled
    if (registry.bulkCleanupTimeout) return;

    const performCleanup = () => {
      this.performBulkCleanup(registry);
      registry.bulkCleanupTimeout = null;
    };

    if (this.config.idleCleanup && typeof requestIdleCallback !== 'undefined') {
      registry.bulkCleanupTimeout = requestIdleCallback(performCleanup);
    } else {
      const delay = this.config.bulkCleanupDelay || 5000;
      registry.bulkCleanupTimeout = setTimeout(performCleanup, delay);
    }
  }

  /**
   * Perform bulk cleanup of all unused styles
   */
  private performBulkCleanup(registry: RootRegistry): void {
    if (registry.unusedRules.size === 0) return;

    const classNamesToCleanup = Array.from(registry.unusedRules.keys());
    let cleanedUpCount = 0;

    // Group by sheet for efficient deletion
    const rulesBySheet = new Map<
      number,
      Array<{ className: string; ruleInfo: RuleInfo }>
    >();

    for (const className of classNamesToCleanup) {
      const unusedInfo = registry.unusedRules.get(className);
      if (!unusedInfo) continue;

      const sheetIndex = unusedInfo.ruleInfo.sheetIndex;
      if (!rulesBySheet.has(sheetIndex)) {
        rulesBySheet.set(sheetIndex, []);
      }
      rulesBySheet
        .get(sheetIndex)!
        .push({ className, ruleInfo: unusedInfo.ruleInfo });
    }

    // Delete rules from each sheet (in reverse order to preserve indices)
    for (const [sheetIndex, rulesInSheet] of rulesBySheet) {
      // Sort by rule index in descending order for safe deletion
      rulesInSheet.sort((a, b) => b.ruleInfo.ruleIndex - a.ruleInfo.ruleIndex);

      for (const { className, ruleInfo } of rulesInSheet) {
        this.deleteRule(registry, ruleInfo);
        registry.rules.delete(className);
        registry.unusedRules.delete(className);
        cleanedUpCount++;
      }
    }

    // Update metrics
    if (registry.metrics) {
      registry.metrics.bulkCleanups++;
      registry.metrics.stylesCleanedUp += cleanedUpCount;
    }
  }

  /**
   * Process the deletion queue for cleanup
   */
  processCleanupQueue(registry: RootRegistry): void {
    // This method is kept for compatibility but the logic has changed
    // We no longer use a deletion queue, instead marking styles as unused immediately
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
        unusedHits: 0,
        bulkCleanups: 0,
        totalInsertions: 0,
        totalUnused: 0,
        stylesCleanedUp: 0,
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

    // Cancel any scheduled bulk cleanup
    if (registry.bulkCleanupTimeout) {
      if (
        this.config.idleCleanup &&
        typeof cancelIdleCallback !== 'undefined'
      ) {
        cancelIdleCallback(registry.bulkCleanupTimeout as unknown as number);
      } else {
        clearTimeout(registry.bulkCleanupTimeout);
      }
      registry.bulkCleanupTimeout = null;
    }

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
