/**
 * @jest-environment jsdom
 */
import { SheetManager } from './sheet-manager';
import { StyleInjectorConfig, StyleRule } from './types';

// Helper function to create StyleRule from CSS for testing
function createStyleRule(selector: string, declarations: string): StyleRule {
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
      expect(registry.refCounts).toBeInstanceOf(Map);
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
      const rules = [createStyleRule('.test', 'color: red;')];

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
      const rules = [createStyleRule('.test', 'color: red;')];

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
        [createStyleRule('.rule1', 'color: red;')],
        'rule1',
        document,
      );
      manager.insertRule(
        registry,
        [createStyleRule('.rule2', 'color: blue;')],
        'rule2',
        document,
      );

      expect(registry.sheets.length).toBe(1);

      // This should create a new sheet
      manager.insertRule(
        registry,
        [createStyleRule('.rule3', 'color: green;')],
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
        [createStyleRule('.rule1', 'color: red;')],
        'rule1',
        document,
      );
      const rule2 = sheetManager.insertRule(
        registry,
        [createStyleRule('.rule2', 'color: blue;')],
        'rule2',
        document,
      );
      const rule3 = sheetManager.insertRule(
        registry,
        [createStyleRule('.rule3', 'color: green;')],
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
        [createStyleRule('.rule4', 'color: yellow;')],
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
        [createStyleRule('.rule1', 'color: red;')],
        'rule1',
        document,
      );
      const rule2 = sheetManager.insertRule(
        registry,
        [createStyleRule('.rule2', 'color: blue;')],
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

    it('should correctly adjust indices after non-contiguous deletions', () => {
      // This test verifies the fix for the bug where non-contiguous deletions
      // would corrupt indices of remaining rules. See BUG_INVESTIGATION_REPORT.md
      const registry = sheetManager.getRegistry(document);

      // Insert 8 rules at indices 0-7
      const rules = [];
      for (let i = 0; i < 8; i++) {
        const rule = sheetManager.insertRule(
          registry,
          [createStyleRule(`.rule${i}`, `order: ${i};`)],
          `rule${i}`,
          document,
        );
        rules.push(rule);
        registry.rules.set(`class${i}`, rule!);
      }

      // Verify initial indices
      expect(rules[0]!.indices).toEqual([0]);
      expect(rules[4]!.indices).toEqual([4]);
      expect(rules[7]!.indices).toEqual([7]);

      // Delete rules at non-contiguous indices: 1, 3, 5
      // Before: [0, 1, 2, 3, 4, 5, 6, 7]
      // After:  [0, 2, 4, 6, 7] -> shifted to [0, 1, 2, 3, 4]
      sheetManager.deleteRule(registry, rules[1]!);
      sheetManager.deleteRule(registry, rules[3]!);
      sheetManager.deleteRule(registry, rules[5]!);

      // Verify remaining rules have correctly adjusted indices:
      // rule0: was 0, stays 0 (nothing deleted before it)
      expect(rules[0]!.indices).toEqual([0]);
      expect(rules[0]!.ruleIndex).toBe(0);

      // rule2: was 2, now 1 (1 deletion at index 1 before it)
      expect(rules[2]!.indices).toEqual([1]);
      expect(rules[2]!.ruleIndex).toBe(1);

      // rule4: was 4, now 2 (deletions at 1, 3 before it = 2 shifts)
      expect(rules[4]!.indices).toEqual([2]);
      expect(rules[4]!.ruleIndex).toBe(2);

      // rule6: was 6, now 3 (deletions at 1, 3, 5 before it = 3 shifts)
      expect(rules[6]!.indices).toEqual([3]);
      expect(rules[6]!.ruleIndex).toBe(3);

      // rule7: was 7, now 4 (deletions at 1, 3, 5 before it = 3 shifts)
      expect(rules[7]!.indices).toEqual([4]);
      expect(rules[7]!.ruleIndex).toBe(4);

      // Verify sheet rule count
      expect(registry.sheets[0].ruleCount).toBe(5);
    });

    it('should correctly adjust indices for rules with multiple CSS declarations', () => {
      // Test that multi-rule insertions (multiple indices per RuleInfo) are handled correctly
      const registry = sheetManager.getRegistry(document);

      // Insert rules - some with multiple declarations
      const rule1 = sheetManager.insertRule(
        registry,
        [
          createStyleRule('.rule1', 'color: red;'),
          createStyleRule('.rule1:hover', 'color: blue;'),
        ],
        'rule1',
        document,
      );
      registry.rules.set('class1', rule1!);

      const rule2 = sheetManager.insertRule(
        registry,
        [createStyleRule('.rule2', 'color: green;')],
        'rule2',
        document,
      );
      registry.rules.set('class2', rule2!);

      const rule3 = sheetManager.insertRule(
        registry,
        [
          createStyleRule('.rule3', 'color: yellow;'),
          createStyleRule('.rule3:active', 'color: orange;'),
        ],
        'rule3',
        document,
      );
      registry.rules.set('class3', rule3!);

      // rule1 occupies indices [0, 1], rule2 at [2], rule3 at [3, 4]
      expect(rule1!.indices).toEqual([0, 1]);
      expect(rule2!.indices).toEqual([2]);
      expect(rule3!.indices).toEqual([3, 4]);

      // Delete rule1 (removes indices 0, 1)
      sheetManager.deleteRule(registry, rule1!);

      // rule2: was [2], now [0] (shifted left by 2)
      expect(rule2!.indices).toEqual([0]);
      expect(rule2!.ruleIndex).toBe(0);
      expect(rule2!.endRuleIndex).toBe(0);

      // rule3: was [3, 4], now [1, 2] (shifted left by 2)
      expect(rule3!.indices).toEqual([1, 2]);
      expect(rule3!.ruleIndex).toBe(1);
      expect(rule3!.endRuleIndex).toBe(2);

      expect(registry.sheets[0].ruleCount).toBe(3);
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

  describe('unused tracking and bulk cleanup', () => {
    it('should track unused rules via refCount = 0', () => {
      const registry = sheetManager.getRegistry(document);

      const rules = [createStyleRule('.test', 'color: red;')];
      const ruleInfo = sheetManager.insertRule(
        registry,
        rules,
        'test',
        document,
      );
      const className = 'test-class';

      registry.rules.set(className, ruleInfo!);
      registry.refCounts.set(className, 1);

      // Mark as unused by setting refCount to 0
      registry.refCounts.set(className, 0);

      // Rule should be marked as unused but still in registry.rules
      expect(registry.rules.has(className)).toBe(true);
      // Rule should be unused (refCount = 0)
      expect(registry.refCounts.get(className)).toBe(0);
    });

    it('should reuse unused rules by setting refCount > 0', () => {
      const registry = sheetManager.getRegistry(document);

      const rules = [createStyleRule('.test', 'color: red;')];
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
      registry.refCounts.set(className, 0);

      // Restore by setting refCount to 1
      registry.refCounts.set(className, 1);

      // Rule should be active (refCount > 0)
      expect(registry.refCounts.get(className)).toBe(1);
      expect(registry.rules.has(className)).toBe(true);
    });

    it('should schedule bulk cleanup when threshold is exceeded', (done) => {
      const manager = new SheetManager({ unusedStylesThreshold: 2 });
      const registry = manager.getRegistry(document);

      // Create rules that will trigger bulk cleanup
      for (let i = 0; i < 3; i++) {
        const rules = [createStyleRule(`.test-${i}`, 'color: red;')];
        const ruleInfo = manager.insertRule(
          registry,
          rules,
          `test-${i}`,
          document,
        );
        const className = `test-class-${i}`;

        registry.rules.set(className, ruleInfo!);
        registry.refCounts.set(className, 0); // Mark as unused
      }

      // Check if cleanup should be scheduled
      manager.checkCleanupNeeded(registry);

      // Should have scheduled cleanup check timeout immediately
      expect(registry.cleanupCheckTimeout).toBeTruthy();

      // Wait for async cleanup check to complete
      setTimeout(() => {
        // Should have scheduled bulk cleanup after the check
        expect(registry.bulkCleanupTimeout).toBeTruthy();
        expect(registry.cleanupCheckTimeout).toBe(null);
        done();
      }, 10);
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
        [createStyleRule('.rule1', 'color: red;')],
        'rule1',
        document,
      );
      manager.insertRule(
        registry,
        [createStyleRule('.rule2', 'color: blue;')],
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
        [createStyleRule('.test', 'color: red;')],
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
    it('should use requestIdleCallback when idleCleanup is enabled', (done) => {
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
        [createStyleRule('.test-class', 'color: red;')],
        'test-class',
        document,
      );
      registry.rules.set('test-class', ruleInfo!);
      registry.refCounts.set('test-class', 1);

      // Mark as unused and trigger bulk cleanup scheduling
      registry.refCounts.set('test-class', 0);
      manager.checkCleanupNeeded(registry);

      // Should have scheduled cleanup check timeout immediately
      expect(registry.cleanupCheckTimeout).toBeTruthy();

      // Wait for async cleanup check to complete
      setTimeout(() => {
        expect(mockRequestIdleCallback).toHaveBeenCalled();
        expect(registry.bulkCleanupTimeout).toBe(123);
        expect(registry.cleanupCheckTimeout).toBe(null);

        // Cleanup mocks
        delete (global as any).requestIdleCallback;
        delete (global as any).cancelIdleCallback;
        done();
      }, 10);
    });

    it('should fallback to setTimeout when requestIdleCallback is not available', (done) => {
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
        [createStyleRule('.test-class', 'color: red;')],
        'test-class',
        document,
      );
      registry.rules.set('test-class', ruleInfo!);
      registry.refCounts.set('test-class', 1);

      registry.refCounts.set('test-class', 0);
      manager.checkCleanupNeeded(registry);

      // Should have called setTimeout for cleanup check (0ms) immediately
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 0);
      expect(registry.cleanupCheckTimeout).toBeTruthy();

      // Wait for async cleanup check to complete
      setTimeout(() => {
        // Should have called setTimeout again for bulk cleanup (100ms)
        expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
        expect(registry.bulkCleanupTimeout).toBeTruthy();
        expect(registry.cleanupCheckTimeout).toBe(null);

        mockSetTimeout.mockRestore();
        done();
      }, 10);
    });
  });
});
