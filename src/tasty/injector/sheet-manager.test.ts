/**
 * @jest-environment jsdom
 */
import { SheetManager } from './sheet-manager';
import { FlattenedRule, StyleInjectorConfig } from './types';

// Helper function to create FlattenedRule from CSS for testing
function createFlattenedRule(
  selector: string,
  declarations: string,
): FlattenedRule {
  return {
    selector,
    declarations,
  };
}

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

describe('SheetManager', () => {
  let sheetManager: SheetManager;
  let config: StyleInjectorConfig;

  beforeEach(() => {
    config = {
      maxRulesPerSheet: 100,
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
      expect(registry.refCounts).toBeInstanceOf(Map);
      expect(registry.rules).toBeInstanceOf(Map);
      expect(registry.unusedRules).toBeInstanceOf(Map);
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
    it('should create style element sheet', () => {
      const registry = sheetManager.getRegistry(document);
      const sheet = sheetManager.createSheet(registry, document);

      expect(sheet.sheet).toBeInstanceOf(HTMLStyleElement);
      expect(sheet.ruleCount).toBe(0);
      expect(sheet.holes).toEqual([]);
      expect(registry.sheets).toContain(sheet);
    });

    it('should create style element with proper attributes', () => {
      const registry = sheetManager.getRegistry(document);
      const sheet = sheetManager.createSheet(registry, document);

      expect(sheet.sheet).toBeInstanceOf(HTMLStyleElement);

      const styleElement = sheet.sheet;
      expect(styleElement.getAttribute('data-tasty')).toBe('');
      expect(document.head.contains(styleElement)).toBe(true);
    });

    it('should set nonce when provided', () => {
      const configWithNonce = {
        ...config,
        nonce: 'test-nonce',
      };
      const manager = new SheetManager(configWithNonce);

      const registry = manager.getRegistry(document);
      const sheet = manager.createSheet(registry, document);

      const styleElement = sheet.sheet;
      expect(styleElement.nonce).toBe('test-nonce');
    });
  });

  describe('insertRule', () => {
    it('should insert rule into style element', () => {
      const registry = sheetManager.getRegistry(document);
      const rules = [createFlattenedRule('.test', 'color: red;')];

      const ruleInfo = sheetManager.insertRule(
        registry,
        rules,
        'test',
        document,
      );

      expect(ruleInfo).not.toBeNull();
      expect(ruleInfo!.ruleIndex).toBe(0);
      expect(ruleInfo!.sheetIndex).toBe(0);
      // expect(ruleInfo!.cssText).toEqual(['.test { color: red; }']);
      expect(registry.sheets[0].ruleCount).toBe(1);
    });

    it('should insert multiple rules correctly', () => {
      const registry = sheetManager.getRegistry(document);
      const rules = [createFlattenedRule('.test', 'color: red;')];

      const ruleInfo = sheetManager.insertRule(
        registry,
        rules,
        'test',
        document,
      );

      expect(ruleInfo).not.toBeNull();
      expect(ruleInfo!.ruleIndex).toBe(0);
      // expect(ruleInfo!.cssText).toEqual(['.test { color: red; }']);

      const styleElement = registry.sheets[0].sheet;
      expect(styleElement.sheet?.cssRules.length).toBe(1);
    });

    it('should create new sheet when max rules exceeded', () => {
      const configWithLimit = { ...config, maxRulesPerSheet: 2 };
      const manager = new SheetManager(configWithLimit);

      const registry = manager.getRegistry(document);

      // Insert rules up to limit
      manager.insertRule(
        registry,
        [createFlattenedRule('.rule1', 'color: red;')],
        'rule1',
        document,
      );
      manager.insertRule(
        registry,
        [createFlattenedRule('.rule2', 'color: blue;')],
        'rule2',
        document,
      );

      expect(registry.sheets.length).toBe(1);

      // This should create a new sheet
      manager.insertRule(
        registry,
        [createFlattenedRule('.rule3', 'color: green;')],
        'rule3',
        document,
      );

      expect(registry.sheets.length).toBe(2);
    });

    it('should append rules sequentially', () => {
      const registry = sheetManager.getRegistry(document);

      // Insert some rules
      const rule1 = sheetManager.insertRule(
        registry,
        [createFlattenedRule('.rule1', 'color: red;')],
        'rule1',
        document,
      );
      const rule2 = sheetManager.insertRule(
        registry,
        [createFlattenedRule('.rule2', 'color: blue;')],
        'rule2',
        document,
      );
      const rule3 = sheetManager.insertRule(
        registry,
        [createFlattenedRule('.rule3', 'color: green;')],
        'rule3',
        document,
      );

      expect(rule1!.ruleIndex).toBe(0);
      expect(rule2!.ruleIndex).toBe(1);
      expect(rule3!.ruleIndex).toBe(2);

      // Delete middle rule
      sheetManager.deleteRule(registry, rule2!);

      // Next insertion should append to the end (no hole reuse in CSS)
      const rule4 = sheetManager.insertRule(
        registry,
        [createFlattenedRule('.rule4', 'color: yellow;')],
        'rule4',
        document,
      );
      expect(rule4!.ruleIndex).toBe(2); // Appended after deletion
    });
  });

  describe('deleteRule', () => {
    it('should delete rule and update rule count', () => {
      const registry = sheetManager.getRegistry(document);

      const rule1 = sheetManager.insertRule(
        registry,
        [createFlattenedRule('.rule1', 'color: red;')],
        'rule1',
        document,
      );
      const rule2 = sheetManager.insertRule(
        registry,
        [createFlattenedRule('.rule2', 'color: blue;')],
        'rule2',
        document,
      );

      const sheet = registry.sheets[0];
      expect(sheet.ruleCount).toBe(2);

      sheetManager.deleteRule(registry, rule1!);

      expect(sheet.ruleCount).toBe(1);
    });

    it('should handle deletion of non-existent rule gracefully', () => {
      const registry = sheetManager.getRegistry(document);

      const fakeRule = {
        className: 'fake',
        ruleIndex: 999,
        sheetIndex: 999,
        cssText: ['.fake { color: red; }'],
      };

      expect(() => sheetManager.deleteRule(registry, fakeRule)).not.toThrow();
    });
  });

  describe('findAvailableRuleIndex', () => {
    it('should return next rule count for new rule insertion', () => {
      const registry = sheetManager.getRegistry(document);
      const sheet = sheetManager.createSheet(registry, document);

      sheet.ruleCount = 5;

      const index = sheetManager.findAvailableRuleIndex(sheet);
      expect(index).toBe(5);
    });

    it('should return 0 for empty sheet', () => {
      const registry = sheetManager.getRegistry(document);
      const sheet = sheetManager.createSheet(registry, document);

      expect(sheet.ruleCount).toBe(0);
      const index = sheetManager.findAvailableRuleIndex(sheet);
      expect(index).toBe(0);
    });
  });

  describe('markAsUnused and bulk cleanup', () => {
    it('should mark rule as unused without immediate DOM cleanup', () => {
      const registry = sheetManager.getRegistry(document);

      const rules = [createFlattenedRule('.test', 'color: red;')];
      const ruleInfo = sheetManager.insertRule(
        registry,
        rules,
        'test',
        document,
      );
      const className = 'test-class';

      registry.rules.set(className, ruleInfo!);
      registry.refCounts.set(className, 1);

      sheetManager.markAsUnused(registry, className);

      // Rule should be marked as unused but still in registry.rules
      expect(registry.rules.has(className)).toBe(true);
      expect(registry.unusedRules.has(className)).toBe(true);
      expect(registry.refCounts.has(className)).toBe(false);
    });

    it('should restore from unused rules', () => {
      const registry = sheetManager.getRegistry(document);

      const rules = [createFlattenedRule('.test', 'color: red;')];
      const ruleInfo = sheetManager.insertRule(
        registry,
        rules,
        'test',
        document,
      );
      const className = 'test-class';

      registry.rules.set(className, ruleInfo!);
      registry.refCounts.set(className, 1);

      // Mark as unused
      sheetManager.markAsUnused(registry, className);

      // Restore from unused
      const restored = sheetManager.restoreFromUnused(registry, className);

      expect(restored).toBeTruthy();
      expect(registry.unusedRules.has(className)).toBe(false);
      expect(registry.refCounts.get(className)).toBe(1);
      expect(registry.rules.has(className)).toBe(true);
    });

    it('should schedule bulk cleanup when threshold is exceeded', () => {
      const manager = new SheetManager({ unusedStylesThreshold: 2 });
      const registry = manager.getRegistry(document);

      // Create rules that will trigger bulk cleanup
      for (let i = 0; i < 3; i++) {
        const rules = [createFlattenedRule(`.test-${i}`, 'color: red;')];
        const ruleInfo = manager.insertRule(
          registry,
          rules,
          `test-${i}`,
          document,
        );
        const className = `test-class-${i}`;

        registry.rules.set(className, ruleInfo!);
        registry.refCounts.set(className, 1);
        manager.markAsUnused(registry, className);
      }

      // Should have scheduled bulk cleanup
      expect(registry.bulkCleanupTimeout).toBeTruthy();
    });
  });

  describe('getTotalRuleCount', () => {
    it('should count rules across all sheets minus holes', () => {
      const registry = sheetManager.getRegistry(document);

      // Create multiple sheets with rules and holes
      const sheet1 = sheetManager.createSheet(registry, document);
      sheet1.ruleCount = 5;
      sheet1.holes = [1, 3]; // 2 holes

      const sheet2 = sheetManager.createSheet(registry, document);
      sheet2.ruleCount = 3;
      sheet2.holes = [0]; // 1 hole

      const total = sheetManager.getTotalRuleCount(registry);
      expect(total).toBe(5); // (5-2) + (3-1) = 5
    });
  });

  describe('getCssText', () => {
    it('should return CSS text from all sheets', () => {
      const manager = new SheetManager(config);

      const registry = manager.getRegistry(document);

      manager.insertRule(
        registry,
        [createFlattenedRule('.rule1', 'color: red;')],
        'rule1',
        document,
      );
      manager.insertRule(
        registry,
        [createFlattenedRule('.rule2', 'color: blue;')],
        'rule2',
        document,
      );

      const cssText = manager.getCssText(registry);

      expect(cssText).toContain('.rule1');
      expect(cssText).toContain('color: red');
      expect(cssText).toContain('.rule2');
      expect(cssText).toContain('color: blue');
    });
  });

  describe('cleanup', () => {
    it('should remove all sheets and clear registry', () => {
      const manager = new SheetManager(config);

      const registry = manager.getRegistry(document);

      // Create some sheets
      manager.insertRule(
        registry,
        [createFlattenedRule('.test', 'color: red;')],
        'test',
        document,
      );

      expect(document.head.querySelectorAll('[data-tasty]').length).toBe(1);

      manager.cleanup(document);

      expect(document.head.querySelectorAll('[data-tasty]').length).toBe(0);

      // Registry should be cleared (new one created on next access)
      const newRegistry = manager.getRegistry(document);
      expect(newRegistry).not.toBe(registry);
    });
  });

  describe('bulk cleanup scheduling', () => {
    it('should use requestIdleCallback when idleCleanup is enabled', () => {
      // Mock requestIdleCallback
      const mockRequestIdleCallback = jest.fn((callback) => {
        return 123; // mock handle - don't execute callback immediately
      });
      const mockCancelIdleCallback = jest.fn();

      (global as any).requestIdleCallback = mockRequestIdleCallback;
      (global as any).cancelIdleCallback = mockCancelIdleCallback;

      const manager = new SheetManager({
        idleCleanup: true,
        unusedStylesThreshold: 1,
      });
      const registry = manager.getRegistry(document);

      // Create a rule and mark as unused to trigger bulk cleanup
      const ruleInfo = manager.insertRule(
        registry,
        [createFlattenedRule('.test-class', 'color: red;')],
        'test-class',
        document,
      );
      registry.rules.set('test-class', ruleInfo!);
      registry.refCounts.set('test-class', 1);

      // This should trigger bulk cleanup scheduling
      manager.markAsUnused(registry, 'test-class');

      expect(mockRequestIdleCallback).toHaveBeenCalled();
      expect(registry.bulkCleanupTimeout).toBe(123);

      // Cleanup mocks
      delete (global as any).requestIdleCallback;
      delete (global as any).cancelIdleCallback;
    });

    it('should fallback to setTimeout when requestIdleCallback is not available', () => {
      // Ensure requestIdleCallback is not available
      delete (global as any).requestIdleCallback;

      const manager = new SheetManager({
        idleCleanup: true,
        bulkCleanupDelay: 100,
        unusedStylesThreshold: 1,
      });
      const registry = manager.getRegistry(document);

      // Mock setTimeout
      const mockSetTimeout = jest.spyOn(global, 'setTimeout');

      // Create a rule and mark as unused to trigger bulk cleanup
      const ruleInfo = manager.insertRule(
        registry,
        [createFlattenedRule('.test-class', 'color: red;')],
        'test-class',
        document,
      );
      registry.rules.set('test-class', ruleInfo!);
      registry.refCounts.set('test-class', 1);

      manager.markAsUnused(registry, 'test-class');

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 100);

      mockSetTimeout.mockRestore();
    });
  });
});
