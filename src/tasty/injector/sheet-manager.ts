import {
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
        cache: new Map(),
        refCounts: new Map(),
        globalCache: new Map(),
        globalRefCounts: new Map(),
        deletionQueue: [],
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

    // Try to use adoptedStyleSheets if available and enabled
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

    return style;
  }

  /**
   * Insert a CSS rule into the appropriate sheet
   */
  insertRule(
    registry: RootRegistry,
    cssText: string,
    root: Document | ShadowRoot,
  ): RuleInfo {
    // Find or create a sheet with available space
    let targetSheet = this.findAvailableSheet(registry, root);

    if (!targetSheet) {
      targetSheet = this.createSheet(registry, root);
    }

    const ruleIndex = this.findAvailableRuleIndex(targetSheet);
    const sheetIndex = registry.sheets.indexOf(targetSheet);

    try {
      if (targetSheet.isAdopted) {
        // Use CSSStyleSheet.insertRule
        const sheet = targetSheet.sheet as CSSStyleSheet;
        sheet.insertRule(cssText, ruleIndex);
      } else {
        // Use HTMLStyleElement
        const styleElement = targetSheet.sheet as HTMLStyleElement;
        const styleSheet = styleElement.sheet;

        if (styleSheet) {
          styleSheet.insertRule(cssText, ruleIndex);
        } else {
          // Fallback: append to textContent
          styleElement.textContent =
            (styleElement.textContent || '') + '\n' + cssText;
        }
      }

      // Update sheet info
      if (ruleIndex >= targetSheet.ruleCount) {
        targetSheet.ruleCount = ruleIndex + 1;
      }

      // Remove from holes if it was a reused index
      const holeIndex = targetSheet.holes.indexOf(ruleIndex);
      if (holeIndex !== -1) {
        targetSheet.holes.splice(holeIndex, 1);
      }

      return {
        className: '', // Will be set by caller
        ruleIndex,
        sheetIndex,
        cssText,
      };
    } catch (error) {
      console.warn('Failed to insert CSS rule:', error);
      throw error;
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
      if (sheet.isAdopted) {
        const cssStyleSheet = sheet.sheet as CSSStyleSheet;
        cssStyleSheet.deleteRule(ruleInfo.ruleIndex);
      } else {
        const styleElement = sheet.sheet as HTMLStyleElement;
        const styleSheet = styleElement.sheet;

        if (styleSheet) {
          styleSheet.deleteRule(ruleInfo.ruleIndex);
        }
      }

      // Mark this index as available for reuse
      sheet.holes.push(ruleInfo.ruleIndex);
      sheet.holes.sort((a, b) => a - b); // Keep holes sorted
    } catch (error) {
      console.warn('Failed to delete CSS rule:', error);
    }
  }

  /**
   * Delete multiple CSS rules
   */
  deleteRules(registry: RootRegistry, ruleInfos: RuleInfo[]): void {
    for (const ruleInfo of ruleInfos) {
      this.deleteRule(registry, ruleInfo);
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
      // No limit, use the last sheet or create new one
      return registry.sheets[registry.sheets.length - 1] || null;
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

    for (const cssTextHash of toDelete) {
      // Check if still referenced
      const refCount = registry.refCounts.get(cssTextHash) || 0;
      const globalRefCount = registry.globalRefCounts.get(cssTextHash) || 0;

      if (refCount <= 0 && globalRefCount <= 0) {
        // Safe to delete
        const ruleInfos =
          registry.cache.get(cssTextHash) ||
          registry.globalCache.get(cssTextHash);

        if (ruleInfos) {
          this.deleteRules(registry, ruleInfos);
          registry.cache.delete(cssTextHash);
          registry.globalCache.delete(cssTextHash);
          registry.refCounts.delete(cssTextHash);
          registry.globalRefCounts.delete(cssTextHash);
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
