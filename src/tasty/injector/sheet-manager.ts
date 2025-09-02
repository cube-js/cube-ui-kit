import { Lru } from '../parser/lru';
import { createStyle, STYLE_HANDLER_MAP } from '../styles';
import { camelToKebab } from '../utils/case-converter';

import {
  CacheMetrics,
  KeyframesInfo,
  KeyframesSteps,
  RootRegistry,
  RuleInfo,
  SheetInfo,
  StyleInjectorConfig,
  StyleRule,
  UnusedRuleInfo,
} from './types';

import type { StyleHandler } from '../utils/styles';

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
      const metrics: CacheMetrics | undefined = this.config.devMode
        ? {
            hits: 0,
            misses: 0,
            unusedHits: 0,
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
        unusedRules: new Map(),
        ruleTextSet: new Set<string>(),
        bulkCleanupTimeout: null,
        metrics,
        classCounter: 0,
        keyframesCache: new Map(),
        unusedKeyframes: new Map(),
        keyframesCounter: 0,
        injectedProperties: new Set<string>(),
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
                  const maxIdx = styleSheet.cssRules.length;
                  const idx = Math.min(Math.max(0, currentRuleIndex), maxIdx);
                  styleSheet.insertRule(singleRule, idx);
                  if (firstInsertedIndex == null) firstInsertedIndex = idx;
                  lastInsertedIndex = idx;
                  currentRuleIndex = idx + 1;
                  anyInserted = true;
                } catch (_) {
                  // Skip unsupported selector in this engine (e.g., ::-moz-selection in Blink)
                }
              }
              // If none inserted, continue without throwing to avoid aborting the whole batch
              if (!anyInserted) {
                // noop: all selectors invalid here; safe to skip
              }
            } else {
              // Single selector failed — skip it silently (likely unsupported in this engine)
            }
          }
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

      // Update sheet info based on the number of rules inserted
      const finalRuleIndex = currentRuleIndex - 1;
      if (finalRuleIndex >= targetSheet.ruleCount) {
        targetSheet.ruleCount = finalRuleIndex + 1;
      }

      return {
        className,
        ruleIndex: firstInsertedIndex ?? ruleIndex,
        sheetIndex,
        cssText: this.config.devMode ? insertedRuleTexts : undefined,
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
      const texts: string[] =
        this.config.devMode && Array.isArray(ruleInfo.cssText)
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

    const cleanupStartTime = Date.now();
    // Build candidates list with age and sort by oldest first
    const now = Date.now();
    const minAge = Math.max(0, this.config.unusedStylesMinAgeMs || 0);
    const candidates = Array.from(registry.unusedRules.entries())
      .map(([className, info]) => ({
        className,
        info,
        age: now - (info.markedUnusedAt || 0),
      }))
      // Filter out too-fresh entries to avoid racing unmount/mount cycles
      .filter((entry) => entry.age >= minAge)
      // Sort from oldest to newest
      .sort((a, b) => b.age - a.age);

    if (candidates.length === 0) return;

    // Limit deletion scope per run (batch ratio)
    const ratio = this.config.bulkCleanupBatchRatio ?? 0.5;
    const limit = Math.max(
      1,
      Math.floor(candidates.length * Math.min(1, Math.max(0, ratio))),
    );
    const selected = candidates.slice(0, limit);
    let cleanedUpCount = 0;
    let totalCssSize = 0;
    let totalRulesDeleted = 0;

    // Group by sheet for efficient deletion
    const rulesBySheet = new Map<
      number,
      Array<{ className: string; ruleInfo: RuleInfo }>
    >();

    // Calculate CSS size before deletion and group rules
    for (const { className, info: unusedInfo } of selected) {
      const ruleInfo = unusedInfo.ruleInfo;
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
        // SAFETY: Re-check that the rule is still unused at deletion time.
        // Between scheduling and execution a class may have been restored
        // (refCounts set and removed from unusedRules). Skip such entries.
        if (!registry.unusedRules.has(className)) {
          continue;
        }
        if (registry.refCounts.has(className)) {
          // Class became active again; do not delete
          continue;
        }

        // Ensure we delete the same RuleInfo we marked earlier to avoid
        // accidentally deleting updated rules for the same class.
        const currentInfo = registry.rules.get(className);
        if (currentInfo && currentInfo !== ruleInfo) {
          // Rule was replaced; skip deletion of the old reference
          continue;
        }

        // Optional last-resort safety: ensure the sheet element still exists
        const sheetInfo = registry.sheets[ruleInfo.sheetIndex];
        if (!sheetInfo || !sheetInfo.sheet) {
          continue;
        }

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
        }
      }
    } catch (error) {
      console.warn('Failed to delete keyframes:', error);
    }
  }

  /**
   * Mark keyframes as unused
   */
  markKeyframesAsUnused(registry: RootRegistry, name: string): void {
    // Implementation similar to markAsUnused but for keyframes
    const threshold = this.config.unusedStylesThreshold || 500;
    if (registry.unusedKeyframes.size >= threshold) {
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
