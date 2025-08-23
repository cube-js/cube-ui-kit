import { Lru } from '../parser/lru';

import {
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
      registry = {
        sheets: [],
        cache: new Lru<string, string>(this.config.cacheSize || 1000),
        refCounts: new Map(),
        rules: new Map(),
        deletionQueue: [],
        ruleTextSet: new Set<string>(),
        cacheKeysByClassName: new Map(),
      };
      this.rootRegistries.set(root, registry);
    }

    return registry;
  }

  /**
   * Create a new stylesheet for the registry
   */
  createSheet(registry: RootRegistry, root: Document | ShadowRoot): SheetInfo {
    let sheet: CSSStyleSheet | HTMLStyleElement;
    let isAdopted = false;

    // Use style elements by default, adoptedStyleSheets only if explicitly enabled
    if (this.config.useAdoptedStyleSheets && 'adoptedStyleSheets' in root) {
      try {
        sheet = new CSSStyleSheet();
        const adoptedSheets = root.adoptedStyleSheets || [];
        root.adoptedStyleSheets = [...adoptedSheets, sheet];
        isAdopted = true;
      } catch (error) {
        // Fallback to style element
        sheet = this.createStyleElement(root);
      }
    } else {
      sheet = this.createStyleElement(root);
    }

    const sheetInfo: SheetInfo = {
      sheet,
      ruleCount: 0,
      holes: [],
      isAdopted,
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

    // Verify it was actually added - log only if there's a problem
    if (!style.isConnected) {
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
      // Insert each flattened rule individually
      const insertedRuleTexts: string[] = [];
      let currentRuleIndex = ruleIndex;

      // Only log for potential debugging
      if (flattenedRules.length > 10) {
        console.log('SheetManager: Inserting many rules:', {
          className,
          rulesCount: flattenedRules.length,
        });
      }

      for (const rule of flattenedRules) {
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

        // Insert individual rule (no global dedupe to avoid interfering with lifecycle)
        if (targetSheet.isAdopted) {
          const sheet = targetSheet.sheet as CSSStyleSheet;
          const maxIndex = sheet.cssRules.length;
          const safeIndex = Math.min(Math.max(0, currentRuleIndex), maxIndex);
          sheet.insertRule(fullRule, safeIndex);
          currentRuleIndex = safeIndex + 1;
        } else {
          // Use HTMLStyleElement
          const styleElement = targetSheet.sheet as HTMLStyleElement;
          const styleSheet = styleElement.sheet;

          if (styleSheet) {
            const maxIndex = styleSheet.cssRules.length;
            const safeIndex = Math.min(Math.max(0, currentRuleIndex), maxIndex);
            styleSheet.insertRule(fullRule, safeIndex);
            currentRuleIndex = safeIndex + 1;
          } else {
            // Fallback: append to textContent
            styleElement.textContent =
              (styleElement.textContent || '') + '\n' + fullRule;
            currentRuleIndex++;
          }

          // CRITICAL DEBUG: Verify the style element is in DOM only if there are issues
          if (!styleElement.parentNode) {
            console.error(
              'SheetManager: Style element is NOT in DOM! This is the problem!',
              {
                className,
                ruleIndex: currentRuleIndex,
              },
            );
          }
        }

        insertedRuleTexts.push(fullRule);
        // currentRuleIndex already adjusted above
      }

      // Update sheet info based on the number of rules inserted
      const finalRuleIndex = currentRuleIndex - 1;
      if (finalRuleIndex >= targetSheet.ruleCount) {
        targetSheet.ruleCount = finalRuleIndex + 1;
      }

      // Remove from holes if original index was reused
      const holeIndex = targetSheet.holes.indexOf(ruleIndex);
      if (holeIndex !== -1) {
        targetSheet.holes.splice(holeIndex, 1);
      }

      return {
        className,
        ruleIndex,
        sheetIndex,
        cssText: insertedRuleTexts, // store each inserted rule text
        endRuleIndex: finalRuleIndex,
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
      // Remove from dedupe set using stored css texts
      // (no-op since we no longer dedupe globally)

      // Delete rules by matching cssText to avoid stale indices
      const texts = Array.isArray(ruleInfo.cssText)
        ? ruleInfo.cssText.slice()
        : [];

      if (sheet.isAdopted) {
        const cssStyleSheet = sheet.sheet as CSSStyleSheet;
        texts.forEach((text) => {
          const rules = cssStyleSheet.cssRules;
          let idx = -1;
          for (let i = rules.length - 1; i >= 0; i--) {
            if (rules[i].cssText === text) {
              idx = i;
              break;
            }
          }
          if (idx >= 0) {
            cssStyleSheet.deleteRule(idx);
            sheet.holes.push(idx);
          }
        });
      } else {
        const styleElement = sheet.sheet as HTMLStyleElement;
        const styleSheet = styleElement.sheet;
        if (styleSheet) {
          texts.forEach((text) => {
            const rules = styleSheet.cssRules;
            let idx = -1;
            for (let i = rules.length - 1; i >= 0; i--) {
              if ((rules[i] as CSSRule).cssText === text) {
                idx = i;
                break;
              }
            }
            if (idx >= 0) {
              styleSheet.deleteRule(idx);
              sheet.holes.push(idx);
            }
          });
        }
      }

      sheet.holes.sort((a, b) => a - b); // Keep holes sorted
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
      if (sheet.ruleCount < maxRules || sheet.holes.length > 0) {
        return sheet;
      }
    }

    return null; // No available sheet found
  }

  /**
   * Find an available rule index in the sheet (reuse holes first)
   */
  findAvailableRuleIndex(sheet: SheetInfo): number {
    // Reuse holes first (lowest index first)
    if (sheet.holes.length > 0) {
      return sheet.holes[0];
    }

    // Use next available index
    return sheet.ruleCount;
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
        // Safe to delete
        const ruleInfo = registry.rules.get(className);

        if (ruleInfo) {
          this.deleteRule(registry, ruleInfo);
          registry.rules.delete(className);
          registry.refCounts.delete(className);
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
        if (sheet.isAdopted) {
          const cssStyleSheet = sheet.sheet as CSSStyleSheet;
          const rules = Array.from(cssStyleSheet.cssRules);
          cssChunks.push(rules.map((rule) => rule.cssText).join('\n'));
        } else {
          const styleElement = sheet.sheet as HTMLStyleElement;
          if (styleElement.textContent) {
            cssChunks.push(styleElement.textContent);
          } else if (styleElement.sheet) {
            const rules = Array.from(styleElement.sheet.cssRules);
            cssChunks.push(rules.map((rule) => rule.cssText).join('\n'));
          }
        }
      } catch (error) {
        console.warn('Failed to read CSS from sheet:', error);
      }
    }

    return cssChunks.join('\n');
  }

  /**
   * Clean up resources for a root
   */
  cleanup(root: Document | ShadowRoot): void {
    const registry = this.rootRegistries.get(root);

    if (!registry) {
      return;
    }

    // Remove all sheets
    for (const sheet of registry.sheets) {
      try {
        if (sheet.isAdopted) {
          // Remove from adoptedStyleSheets
          const adoptedSheets = root.adoptedStyleSheets || [];
          const index = adoptedSheets.indexOf(sheet.sheet as CSSStyleSheet);
          if (index !== -1) {
            const newSheets = [...adoptedSheets];
            newSheets.splice(index, 1);
            root.adoptedStyleSheets = newSheets;
          }
        } else {
          // Remove style element
          const styleElement = sheet.sheet as HTMLStyleElement;
          if (styleElement.parentNode) {
            styleElement.parentNode.removeChild(styleElement);
          }
        }
      } catch (error) {
        console.warn('Failed to cleanup sheet:', error);
      }
    }

    // Clear registry
    this.rootRegistries.delete(root);
  }
}
