import { Lru } from '../parser/lru';
import { createStyle, STYLE_HANDLER_MAP } from '../styles';
import { camelToKebab } from '../utils/case-converter';

import {
  CacheMetrics,
  KeyframesInfo,
  KeyframesSteps,
  RawCSSInfo,
  RawCSSResult,
  RootRegistry,
  RuleInfo,
  SheetInfo,
  StyleInjectorConfig,
  StyleRule,
} from './types';

import type { StyleHandler } from '../utils/styles';

export class SheetManager {
  private rootRegistries = new WeakMap<Document | ShadowRoot, RootRegistry>();
  private config: StyleInjectorConfig;
  /** Dedicated style elements for raw CSS per root */
  private rawStyleElements = new WeakMap<
    Document | ShadowRoot,
    HTMLStyleElement
  >();
  /** Tracking for raw CSS blocks per root */
  private rawCSSBlocks = new WeakMap<
    Document | ShadowRoot,
    Map<string, RawCSSInfo>
  >();
  /** Counter for generating unique raw CSS IDs */
  private rawCSSCounter = 0;

  constructor(config: StyleInjectorConfig) {
    this.config = config;
  }

  /**
   * Get or create registry for a root (Document or ShadowRoot)
   */
  getRegistry(root: Document | ShadowRoot): RootRegistry {
    let registry = this.rootRegistries.get(root);

    if (!registry) {
      const metrics: CacheMetrics | undefined = this.config.devMode
        ? {
            hits: 0,
            misses: 0,
            bulkCleanups: 0,
            totalInsertions: 0,
            totalUnused: 0,
            stylesCleanedUp: 0,
            cleanupHistory: [],
            startTime: Date.now(),
          }
        : undefined;

      registry = {
        sheets: [],
        refCounts: new Map(),
        rules: new Map(),
        cacheKeyToClassName: new Map(),
        ruleTextSet: new Set<string>(),
        bulkCleanupTimeout: null,
        cleanupCheckTimeout: null,
        metrics,
        classCounter: 0,
        keyframesCache: new Map(),
        keyframesNameToContent: new Map(),
        keyframesCounter: 0,
        injectedProperties: new Map<string, string>(),
        globalRules: new Map(),
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
      const insertedIndices: number[] = []; // Track exact indices
      // Calculate rule index atomically right before insertion to prevent race conditions
      let currentRuleIndex = this.findAvailableRuleIndex(targetSheet);
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
          // Calculate index atomically for each rule to prevent concurrent insertion races
          const maxIndex = styleSheet.cssRules.length;
          const atomicRuleIndex = this.findAvailableRuleIndex(targetSheet);
          const safeIndex = Math.min(Math.max(0, atomicRuleIndex), maxIndex);

          // Helper: split comma-separated selectors safely (ignores commas inside [] () " ')
          const splitSelectorsSafely = (selectorList: string): string[] => {
            const parts: string[] = [];
            let buf = '';
            let depthSq = 0; // [] depth
            let depthPar = 0; // () depth
            let inStr: '"' | "'" | '' = '';
            for (let i = 0; i < selectorList.length; i++) {
              const ch = selectorList[i];
              if (inStr) {
                if (ch === inStr && selectorList[i - 1] !== '\\') {
                  inStr = '';
                }
                buf += ch;
                continue;
              }
              if (ch === '"' || ch === "'") {
                inStr = ch as '"' | "'";
                buf += ch;
                continue;
              }
              if (ch === '[') depthSq++;
              else if (ch === ']') depthSq = Math.max(0, depthSq - 1);
              else if (ch === '(') depthPar++;
              else if (ch === ')') depthPar = Math.max(0, depthPar - 1);

              if (ch === ',' && depthSq === 0 && depthPar === 0) {
                const part = buf.trim();
                if (part) parts.push(part);
                buf = '';
              } else {
                buf += ch;
              }
            }
            const tail = buf.trim();
            if (tail) parts.push(tail);
            return parts;
          };

          try {
            styleSheet.insertRule(fullRule, safeIndex);
            // Update sheet ruleCount immediately to prevent concurrent race conditions
            targetSheet.ruleCount++;
            insertedIndices.push(safeIndex); // Track this index
            if (firstInsertedIndex == null) firstInsertedIndex = safeIndex;
            lastInsertedIndex = safeIndex;
            currentRuleIndex = safeIndex + 1;
          } catch (e) {
            // If the browser rejects the combined selector (e.g., vendor pseudo-elements),
            // try to split and insert each selector independently. Skip unsupported ones.
            const selectors = splitSelectorsSafely(rule.selector);
            if (selectors.length > 1) {
              let anyInserted = false;
              for (const sel of selectors) {
                const singleBase = `${sel} { ${declarations} }`;
                let singleRule = singleBase;
                if (rule.atRules && rule.atRules.length > 0) {
                  singleRule = rule.atRules.reduce(
                    (css, atRule) => `${atRule} { ${css} }`,
                    singleBase,
                  );
                }

                try {
                  // Calculate index atomically for each individual selector insertion
                  const maxIdx = styleSheet.cssRules.length;
                  const atomicIdx = this.findAvailableRuleIndex(targetSheet);
                  const idx = Math.min(Math.max(0, atomicIdx), maxIdx);
                  styleSheet.insertRule(singleRule, idx);
                  // Update sheet ruleCount immediately
                  targetSheet.ruleCount++;
                  insertedIndices.push(idx); // Track this index
                  if (firstInsertedIndex == null) firstInsertedIndex = idx;
                  lastInsertedIndex = idx;
                  currentRuleIndex = idx + 1;
                  anyInserted = true;
                } catch (singleErr) {
                  // Skip unsupported selector in this engine (e.g., ::-moz-selection in Blink)
                  if (process.env.NODE_ENV !== 'production') {
                    console.warn(
                      '[tasty] Browser rejected CSS rule:',
                      singleRule,
                      singleErr,
                    );
                  }
                }
              }
              // If none inserted, continue without throwing to avoid aborting the whole batch
              if (!anyInserted) {
                // noop: all selectors invalid here; safe to skip
              }
            } else {
              // Single selector failed — skip it silently (likely unsupported in this engine)
              if (process.env.NODE_ENV !== 'production') {
                console.warn('[tasty] Browser rejected CSS rule:', fullRule, e);
              }
            }
          }
        } else {
          // Use textContent (either as fallback or when forceTextInjection is enabled)
          // Calculate index atomically for textContent insertion too
          const atomicRuleIndex = this.findAvailableRuleIndex(targetSheet);
          styleElement.textContent =
            (styleElement.textContent || '') + '\n' + fullRule;
          // Update sheet ruleCount immediately
          targetSheet.ruleCount++;
          insertedIndices.push(atomicRuleIndex); // Track this index
          if (firstInsertedIndex == null) firstInsertedIndex = atomicRuleIndex;
          lastInsertedIndex = atomicRuleIndex;
          currentRuleIndex = atomicRuleIndex + 1;
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

        // Dev-only: store cssText for debugging tools
        if (this.config.devMode) {
          insertedRuleTexts.push(fullRule);
          try {
            registry.ruleTextSet.add(fullRule);
          } catch (_) {
            // noop: defensive in case ruleTextSet is unavailable
          }
        }
        // currentRuleIndex already adjusted above
      }

      // Sheet ruleCount is now updated immediately after each insertion
      // No need for deferred update logic

      if (insertedIndices.length === 0) {
        return null;
      }

      return {
        className,
        ruleIndex: firstInsertedIndex ?? 0,
        sheetIndex,
        cssText: this.config.devMode ? insertedRuleTexts : undefined,
        endRuleIndex: lastInsertedIndex ?? firstInsertedIndex ?? 0,
        indices: insertedIndices,
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
    globalKey: string,
    root: Document | ShadowRoot,
  ): RuleInfo | null {
    // Insert the rule using the same mechanism as regular rules
    const ruleInfo = this.insertRule(registry, flattenedRules, globalKey, root);

    // Track global rules for index adjustment
    if (ruleInfo) {
      registry.globalRules.set(globalKey, ruleInfo);
    }

    return ruleInfo;
  }

  /**
   * Delete a global CSS rule by key
   */
  public deleteGlobalRule(registry: RootRegistry, globalKey: string): void {
    const ruleInfo = registry.globalRules.get(globalKey);
    if (!ruleInfo) {
      return;
    }

    // Delete the rule using the standard deletion mechanism
    this.deleteRule(registry, ruleInfo);

    // Remove from global rules tracking
    registry.globalRules.delete(globalKey);
  }

  /**
   * Adjust rule indices after deletion to account for shifting
   */
  private adjustIndicesAfterDeletion(
    registry: RootRegistry,
    sheetIndex: number,
    startIdx: number,
    endIdx: number,
    deleteCount: number,
    deletedRuleInfo: RuleInfo,
    deletedIndices?: number[],
  ): void {
    try {
      const sortedDeleted =
        deletedIndices && deletedIndices.length > 0
          ? [...deletedIndices].sort((a, b) => a - b)
          : null;
      const countDeletedBefore = (sorted: number[], idx: number): number => {
        let shift = 0;
        for (const delIdx of sorted) {
          if (delIdx < idx) shift++;
          else break;
        }
        return shift;
      };
      // Helper function to adjust a single RuleInfo
      const adjustRuleInfo = (info: RuleInfo): void => {
        if (info === deletedRuleInfo) return; // Skip the deleted rule
        if (info.sheetIndex !== sheetIndex) return; // Different sheet

        if (!info.indices || info.indices.length === 0) {
          return;
        }

        if (sortedDeleted) {
          // Adjust each index based on how many deleted indices are before it
          info.indices = info.indices.map((idx) => {
            return idx - countDeletedBefore(sortedDeleted, idx);
          });
        } else {
          // Contiguous deletion: shift indices after the deleted range
          info.indices = info.indices.map((idx) =>
            idx > endIdx ? Math.max(0, idx - deleteCount) : idx,
          );
        }

        // Update ruleIndex and endRuleIndex to match adjusted indices
        if (info.indices.length > 0) {
          info.ruleIndex = Math.min(...info.indices);
          info.endRuleIndex = Math.max(...info.indices);
        }
      };

      // Adjust active rules
      for (const info of registry.rules.values()) {
        adjustRuleInfo(info);
      }

      // Adjust global rules
      for (const info of registry.globalRules.values()) {
        adjustRuleInfo(info);
      }

      // No need to separately adjust unused rules since they're part of the rules Map

      // Adjust keyframes indices stored in cache
      for (const entry of registry.keyframesCache.values()) {
        const ki = entry.info as KeyframesInfo;
        if (ki.sheetIndex !== sheetIndex) continue;
        if (sortedDeleted) {
          const shift = countDeletedBefore(sortedDeleted, ki.ruleIndex);
          if (shift > 0) {
            ki.ruleIndex = Math.max(0, ki.ruleIndex - shift);
          }
        } else if (ki.ruleIndex > endIdx) {
          ki.ruleIndex = Math.max(0, ki.ruleIndex - deleteCount);
        }
      }
    } catch (_) {
      // Defensive: do not let index adjustments crash cleanup
    }
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
      const texts: string[] =
        this.config.devMode && Array.isArray(ruleInfo.cssText)
          ? ruleInfo.cssText.slice()
          : [];

      const styleElement = sheet.sheet;
      const styleSheet = styleElement.sheet;

      if (styleSheet) {
        const rules = styleSheet.cssRules;

        // Use exact indices if available, otherwise fall back to range
        if (ruleInfo.indices && ruleInfo.indices.length > 0) {
          // NEW: Delete using exact tracked indices
          const sortedIndices = [...ruleInfo.indices].sort((a, b) => b - a); // Sort descending
          const deletedIndices: number[] = [];

          for (const idx of sortedIndices) {
            if (idx >= 0 && idx < styleSheet.cssRules.length) {
              try {
                styleSheet.deleteRule(idx);
                deletedIndices.push(idx);
              } catch (e) {
                console.warn(`Failed to delete rule at index ${idx}:`, e);
              }
            }
          }

          sheet.ruleCount = Math.max(
            0,
            sheet.ruleCount - deletedIndices.length,
          );

          // Adjust indices for all other rules
          if (deletedIndices.length > 0) {
            this.adjustIndicesAfterDeletion(
              registry,
              ruleInfo.sheetIndex,
              Math.min(...deletedIndices),
              Math.max(...deletedIndices),
              deletedIndices.length,
              ruleInfo,
              deletedIndices,
            );
          }
        } else {
          // FALLBACK: Use old range-based deletion for backwards compatibility
          const startIdx = Math.max(0, ruleInfo.ruleIndex);
          const endIdx = Math.min(
            rules.length - 1,
            Number.isFinite(ruleInfo.endRuleIndex as number)
              ? (ruleInfo.endRuleIndex as number)
              : startIdx,
          );

          if (Number.isFinite(startIdx) && endIdx >= startIdx) {
            const deleteCount = endIdx - startIdx + 1;
            for (let idx = endIdx; idx >= startIdx; idx--) {
              if (idx < 0 || idx >= styleSheet.cssRules.length) continue;
              styleSheet.deleteRule(idx);
            }
            sheet.ruleCount = Math.max(0, sheet.ruleCount - deleteCount);

            // After deletion, all subsequent rule indices shift left by deleteCount.
            // We must adjust stored indices for all other RuleInfo within the same sheet.
            this.adjustIndicesAfterDeletion(
              registry,
              ruleInfo.sheetIndex,
              startIdx,
              endIdx,
              deleteCount,
              ruleInfo,
            );
          }
        }
      }

      // Dev-only: remove cssText entries from validation set
      if (this.config.devMode && texts.length) {
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
   * Schedule bulk cleanup of all unused styles (non-stacking)
   */
  private scheduleBulkCleanup(registry: RootRegistry): void {
    // Clear any existing timeout to prevent stacking
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
   * Force cleanup of unused styles
   */
  public forceCleanup(registry: RootRegistry): void {
    this.performBulkCleanup(registry, true);
  }

  /**
   * Perform bulk cleanup of all unused styles
   */
  private performBulkCleanup(registry: RootRegistry, cleanupAll = false): void {
    const cleanupStartTime = Date.now();

    // Calculate unused rules dynamically: rules that have refCount = 0
    const unusedClassNames = Array.from(registry.refCounts.entries())
      .filter(([, refCount]) => refCount === 0)
      .map(([className]) => className);

    if (unusedClassNames.length === 0) return;

    // Build candidates list - no age filtering needed
    const candidates = unusedClassNames.map((className) => {
      const ruleInfo = registry.rules.get(className)!; // We know it exists
      return {
        className,
        ruleInfo,
      };
    });

    if (candidates.length === 0) return;

    // Limit deletion scope per run (batch ratio) unless cleanupAll is true
    let selected = candidates;
    if (!cleanupAll) {
      const ratio = this.config.bulkCleanupBatchRatio ?? 0.5;
      const limit = Math.max(
        1,
        Math.floor(candidates.length * Math.min(1, Math.max(0, ratio))),
      );
      selected = candidates.slice(0, limit);
    }

    let cleanedUpCount = 0;
    let totalCssSize = 0;
    let totalRulesDeleted = 0;

    // Group by sheet for efficient deletion
    const rulesBySheet = new Map<
      number,
      Array<{ className: string; ruleInfo: RuleInfo }>
    >();

    // Calculate CSS size before deletion and group rules
    for (const { className, ruleInfo } of selected) {
      const sheetIndex = ruleInfo.sheetIndex;

      // Dev-only metrics: estimate CSS size and rule count if available
      if (this.config.devMode && Array.isArray(ruleInfo.cssText)) {
        const cssSize = ruleInfo.cssText.reduce(
          (total, css) => total + css.length,
          0,
        );
        totalCssSize += cssSize;
        totalRulesDeleted += ruleInfo.cssText.length;
      }

      if (!rulesBySheet.has(sheetIndex)) {
        rulesBySheet.set(sheetIndex, []);
      }
      rulesBySheet.get(sheetIndex)!.push({ className, ruleInfo });
    }

    // Delete rules from each sheet (in reverse order to preserve indices)
    for (const [sheetIndex, rulesInSheet] of rulesBySheet) {
      // Sort by rule index in descending order for safe deletion
      rulesInSheet.sort((a, b) => b.ruleInfo.ruleIndex - a.ruleInfo.ruleIndex);

      for (const { className, ruleInfo } of rulesInSheet) {
        // SAFETY 1: Double-check refCount is still 0
        const currentRefCount = registry.refCounts.get(className) || 0;
        if (currentRefCount > 0) {
          // Class became active again; do not delete
          continue;
        }

        // SAFETY 2: Ensure rule wasn't replaced
        // Between scheduling and execution a class may have been replaced with a new RuleInfo
        const currentInfo = registry.rules.get(className);
        if (currentInfo !== ruleInfo) {
          // Rule was replaced; skip deletion of the old reference
          continue;
        }

        // SAFETY 3: Verify the sheet element is still valid and accessible
        const sheetInfo = registry.sheets[ruleInfo.sheetIndex];
        if (!sheetInfo || !sheetInfo.sheet) {
          // Sheet was removed or corrupted; skip this rule
          continue;
        }

        // SAFETY 4: Verify the stylesheet itself is accessible
        const styleSheet = sheetInfo.sheet.sheet;
        if (!styleSheet) {
          // Stylesheet not available; skip this rule
          continue;
        }

        // SAFETY 5: Verify rule index is still within valid range
        const maxRuleIndex = styleSheet.cssRules.length - 1;
        const startIdx = ruleInfo.ruleIndex;
        const endIdx = ruleInfo.endRuleIndex ?? ruleInfo.ruleIndex;

        if (startIdx < 0 || endIdx > maxRuleIndex || startIdx > endIdx) {
          // Rule indices are out of bounds; skip this rule
          continue;
        }

        // All safety checks passed - proceed with deletion
        this.deleteRule(registry, ruleInfo);
        registry.rules.delete(className);
        registry.refCounts.delete(className);

        // Clean up cache key mappings that point to this className
        const keysToDelete: string[] = [];
        for (const [
          key,
          mappedClassName,
        ] of registry.cacheKeyToClassName.entries()) {
          if (mappedClassName === className) {
            keysToDelete.push(key);
          }
        }
        for (const key of keysToDelete) {
          registry.cacheKeyToClassName.delete(key);
        }
        cleanedUpCount++;
      }
    }

    // Update metrics
    if (registry.metrics) {
      registry.metrics.bulkCleanups++;
      registry.metrics.stylesCleanedUp += cleanedUpCount;

      // Add detailed cleanup stats to history
      registry.metrics.cleanupHistory.push({
        timestamp: cleanupStartTime,
        classesDeleted: cleanedUpCount,
        cssSize: totalCssSize,
        rulesDeleted: totalRulesDeleted,
      });
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
    if (!registry.metrics) return null;

    // Calculate unusedHits on demand - only count CSS rules since keyframes are disposed immediately
    const unusedRulesCount = Array.from(registry.refCounts.values()).filter(
      (count) => count === 0,
    ).length;

    return {
      ...registry.metrics,
      unusedHits: unusedRulesCount,
    };
  }

  /**
   * Reset cache performance metrics
   */
  resetMetrics(registry: RootRegistry): void {
    if (registry.metrics) {
      registry.metrics = {
        hits: 0,
        misses: 0,
        bulkCleanups: 0,
        totalInsertions: 0,
        totalUnused: 0,
        stylesCleanedUp: 0,
        cleanupHistory: [],
        startTime: Date.now(),
      };
    }
  }

  /**
   * Convert keyframes steps to CSS string
   */
  private stepsToCSS(steps: KeyframesSteps): string {
    const rules: string[] = [];

    for (const [key, value] of Object.entries(steps)) {
      // Support raw CSS strings for backwards compatibility
      if (typeof value === 'string') {
        rules.push(`${key} { ${value.trim()} }`);
        continue;
      }

      // Treat value as a style map and process via tasty style handlers
      const styleMap = (value || {}) as Record<string, any>;

      // Build a deterministic handler queue based on present style keys
      const styleNames = Object.keys(styleMap).sort();
      const handlerQueue: StyleHandler[] = [];
      const seenHandlers = new Set<StyleHandler>();

      styleNames.forEach((styleName) => {
        let handlers = STYLE_HANDLER_MAP[styleName];
        if (!handlers) {
          // Create a default handler for unknown styles (maps to kebab-case CSS or custom props)
          handlers = STYLE_HANDLER_MAP[styleName] = [createStyle(styleName)];
        }

        handlers.forEach((handler) => {
          if (!seenHandlers.has(handler)) {
            seenHandlers.add(handler);
            handlerQueue.push(handler);
          }
        });
      });

      // Accumulate declarations (ordered). We intentionally ignore `$` selector fan-out
      // and any responsive/state bindings for keyframes.
      const declarationPairs: Array<{ prop: string; value: string }> = [];

      handlerQueue.forEach((handler) => {
        const lookup = handler.__lookupStyles;
        const filteredMap = lookup.reduce(
          (acc, name) => {
            const v = styleMap[name];
            if (v !== undefined) acc[name] = v;
            return acc;
          },
          {} as Record<string, any>,
        );

        const result = handler(filteredMap as any);
        if (!result) return;

        const results = Array.isArray(result) ? result : [result];
        results.forEach((cssMap) => {
          if (!cssMap || typeof cssMap !== 'object') return;
          const { $, ...props } = cssMap as Record<string, any>;

          Object.entries(props).forEach(([prop, val]) => {
            if (val == null || val === '') return;

            if (Array.isArray(val)) {
              // Multiple values for the same property -> emit in order
              val.forEach((v) => {
                if (v != null && v !== '') {
                  declarationPairs.push({ prop, value: String(v) });
                }
              });
            } else {
              declarationPairs.push({ prop, value: String(val) });
            }
          });
        });
      });

      // Fallback: if nothing produced (e.g., empty object), generate empty block
      const declarations = declarationPairs
        .map((d) => `${d.prop}: ${d.value}`)
        .join('; ');

      rules.push(`${key} { ${declarations.trim()} }`);
    }

    return rules.join(' ');
  }

  /**
   * Insert keyframes rule
   */
  insertKeyframes(
    registry: RootRegistry,
    steps: KeyframesSteps,
    name: string,
    root: Document | ShadowRoot,
  ): KeyframesInfo | null {
    let targetSheet = this.findAvailableSheet(registry, root);
    if (!targetSheet) {
      targetSheet = this.createSheet(registry, root);
    }

    const ruleIndex = this.findAvailableRuleIndex(targetSheet);
    const sheetIndex = registry.sheets.indexOf(targetSheet);

    try {
      const cssSteps = this.stepsToCSS(steps);
      const fullRule = `@keyframes ${name} { ${cssSteps} }`;

      const styleElement = targetSheet.sheet;
      const styleSheet = styleElement.sheet;

      if (styleSheet && !this.config.forceTextInjection) {
        const safeIndex = Math.min(
          Math.max(0, ruleIndex),
          styleSheet.cssRules.length,
        );
        styleSheet.insertRule(fullRule, safeIndex);
      } else {
        styleElement.textContent =
          (styleElement.textContent || '') + '\n' + fullRule;
      }

      targetSheet.ruleCount++;

      return {
        name,
        ruleIndex,
        sheetIndex,
        cssText: this.config.devMode ? fullRule : undefined,
      };
    } catch (error) {
      console.warn('Failed to insert keyframes:', error);
      return null;
    }
  }

  /**
   * Delete keyframes rule
   */
  deleteKeyframes(registry: RootRegistry, info: KeyframesInfo): void {
    const sheet = registry.sheets[info.sheetIndex];
    if (!sheet) return;

    try {
      const styleElement = sheet.sheet;
      const styleSheet = styleElement.sheet;

      if (styleSheet) {
        if (
          info.ruleIndex >= 0 &&
          info.ruleIndex < styleSheet.cssRules.length
        ) {
          styleSheet.deleteRule(info.ruleIndex);
          sheet.ruleCount = Math.max(0, sheet.ruleCount - 1);

          // Adjust indices for all other rules in the same sheet
          // This is critical - when a keyframe rule is deleted, all rules
          // with higher indices shift down by 1
          this.adjustIndicesAfterDeletion(
            registry,
            info.sheetIndex,
            info.ruleIndex,
            info.ruleIndex,
            1,
            // Create a dummy RuleInfo to satisfy the function signature
            {
              className: '',
              ruleIndex: info.ruleIndex,
              sheetIndex: info.sheetIndex,
            } as RuleInfo,
            [info.ruleIndex],
          );
        }
      }
    } catch (error) {
      console.warn('Failed to delete keyframes:', error);
    }
  }

  /**
   * Schedule async cleanup check (non-stacking)
   */
  public checkCleanupNeeded(registry: RootRegistry): void {
    // Clear any existing check timeout to prevent stacking
    if (registry.cleanupCheckTimeout) {
      clearTimeout(registry.cleanupCheckTimeout);
      registry.cleanupCheckTimeout = null;
    }

    // Schedule the actual check with setTimeout(..., 0)
    registry.cleanupCheckTimeout = setTimeout(() => {
      this.performCleanupCheck(registry);
      registry.cleanupCheckTimeout = null;
    }, 0);
  }

  /**
   * Perform the actual cleanup check (called asynchronously)
   */
  private performCleanupCheck(registry: RootRegistry): void {
    // Count unused rules (refCount = 0) - keyframes are disposed immediately
    const unusedRulesCount = Array.from(registry.refCounts.values()).filter(
      (count) => count === 0,
    ).length;
    const threshold = this.config.unusedStylesThreshold || 500;

    if (unusedRulesCount >= threshold) {
      this.scheduleBulkCleanup(registry);
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

    // Cancel any scheduled cleanup check
    if (registry.cleanupCheckTimeout) {
      clearTimeout(registry.cleanupCheckTimeout);
      registry.cleanupCheckTimeout = null;
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

    // Clean up raw CSS style element
    const rawStyleElement = this.rawStyleElements.get(root);
    if (rawStyleElement?.parentNode) {
      rawStyleElement.parentNode.removeChild(rawStyleElement);
    }
    this.rawStyleElements.delete(root);
    this.rawCSSBlocks.delete(root);
  }

  /**
   * Get or create a dedicated style element for raw CSS
   * Raw CSS is kept separate from tasty-managed sheets to avoid index conflicts
   */
  private getOrCreateRawStyleElement(
    root: Document | ShadowRoot,
  ): HTMLStyleElement {
    let styleElement = this.rawStyleElements.get(root);

    if (!styleElement) {
      styleElement =
        (root as Document).createElement?.('style') ||
        document.createElement('style');

      if (this.config.nonce) {
        styleElement.nonce = this.config.nonce;
      }

      styleElement.setAttribute('data-tasty-raw', '');

      // Append to head or shadow root
      if ('head' in root && root.head) {
        root.head.appendChild(styleElement);
      } else if ('appendChild' in root) {
        root.appendChild(styleElement);
      } else {
        document.head.appendChild(styleElement);
      }

      this.rawStyleElements.set(root, styleElement);
      this.rawCSSBlocks.set(root, new Map());
    }

    return styleElement;
  }

  /**
   * Inject raw CSS text directly without parsing
   * Returns a dispose function to remove the injected CSS
   */
  injectRawCSS(css: string, root: Document | ShadowRoot): RawCSSResult {
    if (!css.trim()) {
      return { dispose: () => {} };
    }

    const styleElement = this.getOrCreateRawStyleElement(root);
    const blocksMap = this.rawCSSBlocks.get(root)!;

    // Generate unique ID for this block
    const id = `raw_${this.rawCSSCounter++}`;

    // Calculate offsets
    const currentContent = styleElement.textContent || '';
    const startOffset = currentContent.length;
    const cssWithNewline = (currentContent ? '\n' : '') + css;
    const endOffset = startOffset + cssWithNewline.length;

    // Append CSS
    styleElement.textContent = currentContent + cssWithNewline;

    // Track the block
    const info: RawCSSInfo = {
      id,
      css,
      startOffset,
      endOffset,
    };
    blocksMap.set(id, info);

    return {
      dispose: () => {
        this.disposeRawCSS(id, root);
      },
    };
  }

  /**
   * Remove a raw CSS block by ID
   */
  private disposeRawCSS(id: string, root: Document | ShadowRoot): void {
    const styleElement = this.rawStyleElements.get(root);
    const blocksMap = this.rawCSSBlocks.get(root);

    if (!styleElement || !blocksMap) {
      return;
    }

    const info = blocksMap.get(id);
    if (!info) {
      return;
    }

    // Remove from tracking
    blocksMap.delete(id);

    // Rebuild the CSS content from remaining blocks
    // This is simpler and more reliable than trying to splice strings
    const remainingBlocks = Array.from(blocksMap.values());

    if (remainingBlocks.length === 0) {
      styleElement.textContent = '';
    } else {
      // Rebuild with remaining CSS blocks in order of their original insertion
      // Sort by original startOffset to maintain order
      remainingBlocks.sort((a, b) => a.startOffset - b.startOffset);
      const newContent = remainingBlocks.map((block) => block.css).join('\n');
      styleElement.textContent = newContent;

      // Update offsets for remaining blocks
      let offset = 0;
      for (const block of remainingBlocks) {
        block.startOffset = offset;
        block.endOffset = offset + block.css.length;
        offset = block.endOffset + 1; // +1 for newline
      }
    }
  }

  /**
   * Get the raw CSS content for SSR
   */
  getRawCSSText(root: Document | ShadowRoot): string {
    const styleElement = this.rawStyleElements.get(root);
    return styleElement?.textContent || '';
  }
}
