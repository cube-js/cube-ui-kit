/**
 * @jest-environment jsdom
 */
import { SheetManager } from './sheet-manager';
import { StyleInjectorConfig } from './types';

// Mock CSSStyleSheet for tests
class MockCSSStyleSheet {
  cssRules: any[] = [];

  insertRule(rule: string, index: number = this.cssRules.length) {
    this.cssRules.splice(index, 0, { cssText: rule });
    return index;
  }

  deleteRule(index: number) {
    if (index >= 0 && index < this.cssRules.length) {
      this.cssRules.splice(index, 1);
    }
  }
}

// Mock adoptedStyleSheets support
const mockDocument = {
  ...document,
  adoptedStyleSheets: [] as any[],
  createElement: (tagName: string) => document.createElement(tagName),
  head: document.head,
};

describe('SheetManager', () => {
  let sheetManager: SheetManager;
  let config: StyleInjectorConfig;

  beforeEach(() => {
    config = {
      useAdoptedStyleSheets: true,
      maxRulesPerSheet: 100,
      gcThreshold: 50,
    };
    sheetManager = new SheetManager(config);

    // Clear any existing styles
    document.head.querySelectorAll('[data-tasty]').forEach((el) => el.remove());

    // Mock CSSStyleSheet constructor
    global.CSSStyleSheet = MockCSSStyleSheet as any;
  });

  afterEach(() => {
    // Cleanup
    document.head.querySelectorAll('[data-tasty]').forEach((el) => el.remove());
  });

  describe('getRegistry', () => {
    it('should create new registry for new root', () => {
      const registry = sheetManager.getRegistry(document);

      expect(registry).toBeDefined();
      expect(registry.sheets).toEqual([]);
      expect(registry.cache).toBeInstanceOf(Map);
      expect(registry.refCounts).toBeInstanceOf(Map);
      expect(registry.globalCache).toBeInstanceOf(Map);
      expect(registry.globalRefCounts).toBeInstanceOf(Map);
      expect(registry.deletionQueue).toEqual([]);
    });

    it('should return same registry for same root', () => {
      const registry1 = sheetManager.getRegistry(document);
      const registry2 = sheetManager.getRegistry(document);

      expect(registry1).toBe(registry2);
    });

    it('should create different registries for different roots', () => {
      const registry1 = sheetManager.getRegistry(document);

      // Create mock shadow root
      const shadowRoot = document
        .createElement('div')
        .attachShadow({ mode: 'open' });
      const registry2 = sheetManager.getRegistry(shadowRoot);

      expect(registry1).not.toBe(registry2);
    });
  });

  describe('createSheet', () => {
    it('should create adopted stylesheet when supported', () => {
      const registry = sheetManager.getRegistry(mockDocument);
      const sheet = sheetManager.createSheet(registry, mockDocument);

      expect(sheet.isAdopted).toBe(true);
      expect(sheet.sheet).toBeInstanceOf(MockCSSStyleSheet);
      expect(sheet.ruleCount).toBe(0);
      expect(sheet.holes).toEqual([]);
      expect(registry.sheets).toContain(sheet);
    });

    it('should create style element when adoptedStyleSheets not supported', () => {
      const configWithoutAdopted = { ...config, useAdoptedStyleSheets: false };
      const manager = new SheetManager(configWithoutAdopted);

      const registry = manager.getRegistry(document);
      const sheet = manager.createSheet(registry, document);

      expect(sheet.isAdopted).toBe(false);
      expect(sheet.sheet).toBeInstanceOf(HTMLStyleElement);

      const styleElement = sheet.sheet as HTMLStyleElement;
      expect(styleElement.getAttribute('data-tasty')).toBe('');
      expect(document.head.contains(styleElement)).toBe(true);
    });

    it('should set nonce when provided', () => {
      const configWithNonce = {
        ...config,
        nonce: 'test-nonce',
        useAdoptedStyleSheets: false,
      };
      const manager = new SheetManager(configWithNonce);

      const registry = manager.getRegistry(document);
      const sheet = manager.createSheet(registry, document);

      const styleElement = sheet.sheet as HTMLStyleElement;
      expect(styleElement.nonce).toBe('test-nonce');
    });
  });

  describe('insertRule', () => {
    it('should insert rule into adopted stylesheet', () => {
      const registry = sheetManager.getRegistry(mockDocument);
      const cssText = 'color: red;';

      const ruleInfo = sheetManager.insertRule(registry, cssText, mockDocument);

      expect(ruleInfo.ruleIndex).toBe(0);
      expect(ruleInfo.sheetIndex).toBe(0);
      expect(ruleInfo.cssText).toBe(cssText);
      expect(registry.sheets[0].ruleCount).toBe(1);
    });

    it('should insert rule into style element', () => {
      const configWithoutAdopted = { ...config, useAdoptedStyleSheets: false };
      const manager = new SheetManager(configWithoutAdopted);

      const registry = manager.getRegistry(document);
      const cssText = '.test { color: red; }';

      const ruleInfo = manager.insertRule(registry, cssText, document);

      expect(ruleInfo.ruleIndex).toBe(0);
      expect(ruleInfo.cssText).toBe(cssText);

      const styleElement = registry.sheets[0].sheet as HTMLStyleElement;
      expect(styleElement.sheet?.cssRules.length).toBe(1);
    });

    it('should create new sheet when max rules exceeded', () => {
      const configWithLimit = { ...config, maxRulesPerSheet: 2 };
      const manager = new SheetManager(configWithLimit);

      const registry = manager.getRegistry(mockDocument);

      // Insert rules up to limit
      manager.insertRule(registry, '.rule1 { color: red; }', mockDocument);
      manager.insertRule(registry, '.rule2 { color: blue; }', mockDocument);

      expect(registry.sheets.length).toBe(1);

      // This should create a new sheet
      manager.insertRule(registry, '.rule3 { color: green; }', mockDocument);

      expect(registry.sheets.length).toBe(2);
    });

    it('should reuse holes when available', () => {
      const registry = sheetManager.getRegistry(mockDocument);

      // Insert some rules
      const rule1 = sheetManager.insertRule(
        registry,
        '.rule1 { color: red; }',
        mockDocument,
      );
      const rule2 = sheetManager.insertRule(
        registry,
        '.rule2 { color: blue; }',
        mockDocument,
      );
      const rule3 = sheetManager.insertRule(
        registry,
        '.rule3 { color: green; }',
        mockDocument,
      );

      expect(rule1.ruleIndex).toBe(0);
      expect(rule2.ruleIndex).toBe(1);
      expect(rule3.ruleIndex).toBe(2);

      // Delete middle rule to create a hole
      sheetManager.deleteRule(registry, rule2);

      // Next insertion should reuse the hole
      const rule4 = sheetManager.insertRule(
        registry,
        '.rule4 { color: yellow; }',
        mockDocument,
      );
      expect(rule4.ruleIndex).toBe(1); // Reused hole
    });
  });

  describe('deleteRule', () => {
    it('should delete rule and create hole', () => {
      const registry = sheetManager.getRegistry(mockDocument);

      const rule1 = sheetManager.insertRule(
        registry,
        '.rule1 { color: red; }',
        mockDocument,
      );
      const rule2 = sheetManager.insertRule(
        registry,
        '.rule2 { color: blue; }',
        mockDocument,
      );

      const sheet = registry.sheets[0];
      expect(sheet.holes).toEqual([]);

      sheetManager.deleteRule(registry, rule1);

      expect(sheet.holes).toEqual([0]);
    });

    it('should handle deletion of non-existent rule gracefully', () => {
      const registry = sheetManager.getRegistry(mockDocument);

      const fakeRule = {
        className: 'fake',
        ruleIndex: 999,
        sheetIndex: 999,
        cssText: '.fake { color: red; }',
      };

      expect(() => sheetManager.deleteRule(registry, fakeRule)).not.toThrow();
    });
  });

  describe('findAvailableRuleIndex', () => {
    it('should return hole index when available', () => {
      const registry = sheetManager.getRegistry(mockDocument);
      const sheet = sheetManager.createSheet(registry, mockDocument);

      // Simulate holes
      sheet.holes = [1, 3, 5];
      sheet.ruleCount = 10;

      const index = sheetManager.findAvailableRuleIndex(sheet);
      expect(index).toBe(1); // First hole
    });

    it('should return next rule count when no holes', () => {
      const registry = sheetManager.getRegistry(mockDocument);
      const sheet = sheetManager.createSheet(registry, mockDocument);

      sheet.ruleCount = 5;
      sheet.holes = [];

      const index = sheetManager.findAvailableRuleIndex(sheet);
      expect(index).toBe(5);
    });
  });

  describe('processCleanupQueue', () => {
    it('should delete unreferenced rules from queue', () => {
      const registry = sheetManager.getRegistry(mockDocument);

      // Setup some rules
      const cssText = '.test { color: red; }';
      const ruleInfo = sheetManager.insertRule(registry, cssText, mockDocument);
      const hash = 'test-hash';

      registry.cache.set(hash, [ruleInfo]); // Now expects array
      registry.refCounts.set(hash, 0); // No references
      registry.deletionQueue.push(hash);

      const initialRuleCount = registry.sheets[0].ruleCount;

      sheetManager.processCleanupQueue(registry);

      expect(registry.cache.has(hash)).toBe(false);
      expect(registry.refCounts.has(hash)).toBe(false);
      expect(registry.deletionQueue).toEqual([]);
      expect(registry.sheets[0].holes.length).toBe(1);
    });

    it('should not delete referenced rules', () => {
      const registry = sheetManager.getRegistry(mockDocument);

      const cssText = '.test { color: red; }';
      const ruleInfo = sheetManager.insertRule(registry, cssText, mockDocument);
      const hash = 'test-hash';

      registry.cache.set(hash, [ruleInfo]); // Now expects array
      registry.refCounts.set(hash, 1); // Still referenced
      registry.deletionQueue.push(hash);

      sheetManager.processCleanupQueue(registry);

      expect(registry.cache.has(hash)).toBe(true);
      expect(registry.refCounts.get(hash)).toBe(1);
      expect(registry.deletionQueue).toEqual([]); // Queue cleared but rule kept
    });
  });

  describe('getTotalRuleCount', () => {
    it('should count rules across all sheets minus holes', () => {
      const registry = sheetManager.getRegistry(mockDocument);

      // Create multiple sheets with rules and holes
      const sheet1 = sheetManager.createSheet(registry, mockDocument);
      sheet1.ruleCount = 5;
      sheet1.holes = [1, 3]; // 2 holes

      const sheet2 = sheetManager.createSheet(registry, mockDocument);
      sheet2.ruleCount = 3;
      sheet2.holes = [0]; // 1 hole

      const total = sheetManager.getTotalRuleCount(registry);
      expect(total).toBe(5); // (5-2) + (3-1) = 5
    });
  });

  describe('getCssText', () => {
    it('should return CSS text from all sheets', () => {
      const configWithoutAdopted = { ...config, useAdoptedStyleSheets: false };
      const manager = new SheetManager(configWithoutAdopted);

      const registry = manager.getRegistry(document);

      manager.insertRule(registry, '.rule1 { color: red; }', document);
      manager.insertRule(registry, '.rule2 { color: blue; }', document);

      const cssText = manager.getCssText(registry);

      expect(cssText).toContain('.rule1');
      expect(cssText).toContain('color: red');
      expect(cssText).toContain('.rule2');
      expect(cssText).toContain('color: blue');
    });
  });

  describe('cleanup', () => {
    it('should remove all sheets and clear registry', () => {
      const configWithoutAdopted = { ...config, useAdoptedStyleSheets: false };
      const manager = new SheetManager(configWithoutAdopted);

      const registry = manager.getRegistry(document);

      // Create some sheets
      manager.insertRule(registry, '.test { color: red; }', document);

      expect(document.head.querySelectorAll('[data-tasty]').length).toBe(1);

      manager.cleanup(document);

      expect(document.head.querySelectorAll('[data-tasty]').length).toBe(0);

      // Registry should be cleared (new one created on next access)
      const newRegistry = manager.getRegistry(document);
      expect(newRegistry).not.toBe(registry);
    });
  });
});
