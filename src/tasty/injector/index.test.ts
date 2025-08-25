/**
 * @jest-environment jsdom
 */
import { StyleResult } from '../utils/renderStyles';

import { flattenNestedCss } from './flatten';

import {
  cleanup,
  configure,
  createInjector,
  destroy,
  getCssText,
  inject,
  injectGlobal,
} from './index';

// Helper function to convert CSS string to StyleResult array for testing
function cssToStyleResults(css: string, className = 'test'): StyleResult[] {
  // Handle simple CSS case like '&{ color: red; }'
  if (
    css.includes('&{') &&
    !css.includes('\n') &&
    !css.includes('Title') &&
    !css.includes('@media')
  ) {
    return [
      {
        selector: `.${className}`,
        declarations: css
          .replace(/&\s*\{/, '')
          .replace(/\}$/, '')
          .trim(),
      },
    ];
  }

  // For complex nested CSS, we need to flatten it properly using the flattening logic
  try {
    const flattened = flattenNestedCss(css, className);
    return flattened.map((rule) => ({
      selector: rule.selector,
      declarations: rule.declarations,
      atRules: rule.atRules,
    }));
  } catch (error) {
    // Fallback for malformed CSS
    return [
      {
        selector: `.${className}`,
        declarations: css
          .replace(/&\s*\{/, '')
          .replace(/\}$/, '')
          .replace(/\n/g, ' ')
          .trim(),
      },
    ];
  }
}

/**
 * Comprehensive tests for the Global Style Injector API.
 * Uses forceTextInjection mode for reliable DOM testing in Jest/JSDOM environment.
 */

describe('Global Style Injector API', () => {
  beforeEach(() => {
    // Clear any existing styles
    document.head.querySelectorAll('[data-tasty]').forEach((el) => el.remove());

    // Reset global injector by configuring fresh with text injection enabled
    configure({
      forceTextInjection: true, // Explicitly enable for reliable DOM testing
    });
  });

  afterEach(() => {
    destroy(); // Clean up after each test
  });

  describe('configure', () => {
    it('should configure global injector with default values', () => {
      configure();

      // Should be able to use injector after configuration
      const result = inject(cssToStyleResults('&{ color: red; }'));
      expect(result.className).toMatch(/^t\d+$/);
    });

    it('should configure global injector with custom values', () => {
      configure({
        nonce: 'test-nonce',
      });

      const result = inject(cssToStyleResults('&{ color: red; }'));
      expect(result.className).toMatch(/^t\d+$/);

      const styleElement = document.head.querySelector(
        '[data-tasty]',
      ) as HTMLStyleElement;
      expect(styleElement.nonce).toBe('test-nonce');
    });

    it('should replace existing global injector when reconfigured', () => {
      // First configuration
      configure({ cacheSize: 500 });
      const result1 = inject(cssToStyleResults('&{ color: red; }'));

      // Reconfigure
      configure({});
      const result2 = inject(cssToStyleResults('&{ color: blue; }'));

      expect(result1.className).toMatch(/^t\d+$/);
      expect(result2.className).toMatch(/^t\d+$/);
    });
  });

  describe('inject', () => {
    it('should inject CSS using global injector', () => {
      const css = '&{ color: red; padding: 10px; }';
      const result = inject(cssToStyleResults(css));

      expect(result.className).toMatch(/^t\d+$/);
      expect(typeof result.dispose).toBe('function');

      const styleElements = document.head.querySelectorAll('[data-tasty]');
      expect(styleElements.length).toBe(1);
    });

    it('should auto-configure if not configured', () => {
      // Don't call configure() first
      const result = inject(cssToStyleResults('&{ color: red; }'));

      expect(result.className).toMatch(/^t\d+$/);
    });

    it('should support custom root', () => {
      const shadowRoot = document
        .createElement('div')
        .attachShadow({ mode: 'open' });

      const result = inject(cssToStyleResults('&{ color: red; }'), {
        root: shadowRoot,
      });

      expect(result.className).toMatch(/^t\d+$/);
      expect(document.head.querySelectorAll('[data-tasty]').length).toBe(0);
      expect(shadowRoot.querySelectorAll('[data-tasty]').length).toBe(1);
    });
  });

  describe('injectGlobal', () => {
    it('should inject global CSS using global injector', () => {
      const dispose = injectGlobal('body', 'background: white; margin: 0;');

      expect(typeof dispose).toBe('function');

      const styleElements = document.head.querySelectorAll('[data-tasty]');
      expect(styleElements.length).toBeGreaterThan(0);

      const allCssText = Array.from(styleElements)
        .map((el) => el.textContent || '')
        .join('');
      expect(allCssText).toContain('body');
      expect(allCssText).toContain('background: white');
    });

    it('should auto-configure if not configured', () => {
      const dispose = injectGlobal('body', 'margin: 0;');

      expect(typeof dispose).toBe('function');
    });
  });

  describe('getCssText', () => {
    it('should return CSS text from global injector', () => {
      inject(cssToStyleResults('&{ color: red; }'));
      injectGlobal('body', 'margin: 0;');

      const cssText = getCssText();

      expect(cssText).toContain('color: red');
      expect(cssText).toContain('body');
      expect(cssText).toContain('margin: 0');
    });

    it('should return empty string when no styles', () => {
      const cssText = getCssText();
      expect(cssText.trim()).toBe('');
    });

    it('should auto-configure if not configured', () => {
      const cssText = getCssText();
      expect(cssText).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('should cleanup global injector', async () => {
      const result = inject(cssToStyleResults('&{ color: red; }'));
      result.dispose();

      cleanup();

      // Cleanup should have processed
    });

    it('should auto-configure if not configured', () => {
      expect(() => cleanup()).not.toThrow();
    });
  });

  describe('destroy', () => {
    it('should destroy global injector resources', () => {
      inject(cssToStyleResults('&{ color: red; }'));
      injectGlobal('body', 'margin: 0;');

      expect(
        document.head.querySelectorAll('[data-tasty]').length,
      ).toBeGreaterThan(0);

      destroy();

      expect(document.head.querySelectorAll('[data-tasty]').length).toBe(0);
    });

    it('should auto-configure if not configured', () => {
      expect(() => destroy()).not.toThrow();
    });
  });

  describe('createInjector', () => {
    it('should create isolated injector instance', () => {
      const injector1 = createInjector({ cacheSize: 500 });
      const injector2 = createInjector({ cacheSize: 1000 });

      expect(injector1).not.toBe(injector2);

      // Both should work independently
      const result1 = injector1.inject(cssToStyleResults('&{ color: red; }'));
      const result2 = injector2.inject(cssToStyleResults('&{ color: blue; }'));

      expect(result1.className).toMatch(/^t\d+$/);
      expect(result2.className).toMatch(/^t\d+$/);
    });

    it('should use default config when no config provided', () => {
      const injector = createInjector();

      const result = injector.inject(cssToStyleResults('&{ color: red; }'));
      expect(result.className).toMatch(/^t\d+$/);
    });

    it('should not affect global injector', () => {
      configure({ cacheSize: 500 });

      const isolatedInjector = createInjector({ cacheSize: 2000 });

      // Global injector should still work
      const globalResult = inject(cssToStyleResults('&{ color: red; }'));
      const isolatedResult = isolatedInjector.inject(
        cssToStyleResults('&{ color: blue; }'),
      );

      expect(globalResult.className).toMatch(/^t\d+$/);
      expect(isolatedResult.className).toMatch(/^t\d+$/);
    });
  });

  describe('integration', () => {
    it('should work with multiple injections and disposals', async () => {
      const css1 = '&{ color: red; }';
      const css2 = '&{ background: blue; }';

      const result1 = inject(cssToStyleResults(css1));
      const result2 = inject(cssToStyleResults(css2));
      const result3 = inject(cssToStyleResults(css1)); // Duplicate

      // Without active cache, duplicates may produce new classes
      expect(result1.className).toMatch(/^t\d+$/);
      expect(result3.className).toMatch(/^t\d+$/);

      const dispose1 = injectGlobal('body', 'margin: 0;');
      const dispose2 = injectGlobal('.header', 'font-size: 24px;');

      // All should be injected
      const styleElements = document.head.querySelectorAll('[data-tasty]');
      expect(styleElements.length).toBeGreaterThan(0);

      // Dispose everything
      result1.dispose();
      result2.dispose();
      result3.dispose();
      dispose1();
      dispose2();

      // Wait for cleanup
      await new Promise((resolve) => setTimeout(resolve, 10));
      cleanup();
    });

    it('should handle SSR scenario', () => {
      // Simulate SSR by injecting styles
      inject(cssToStyleResults('&{ color: red; }'));
      inject(cssToStyleResults('&{ background: blue; }'));
      injectGlobal('body', 'margin: 0; font-family: Arial;');
      injectGlobal('.container', 'max-width: 1200px;');

      // Get CSS for SSR
      const cssText = getCssText();

      expect(cssText).toContain('color: red');
      expect(cssText).toContain('background: blue');
      expect(cssText).toContain('body');
      expect(cssText).toContain('margin: 0');
      expect(cssText).toContain('font-family: Arial');
      expect(cssText).toContain('.container');
      expect(cssText).toContain('max-width: 1200px');
    });

    it('should handle multiple roots', () => {
      const shadowRoot1 = document
        .createElement('div')
        .attachShadow({ mode: 'open' });
      const shadowRoot2 = document
        .createElement('div')
        .attachShadow({ mode: 'open' });

      // Inject into different roots
      inject(cssToStyleResults('&{ color: red; }')); // document
      inject(cssToStyleResults('&{ color: blue; }'), { root: shadowRoot1 });
      inject(cssToStyleResults('&{ color: green; }'), { root: shadowRoot2 });

      injectGlobal('body', 'margin: 0;'); // document
      injectGlobal('.shadow1', 'background: yellow;', { root: shadowRoot1 });
      injectGlobal('.shadow2', 'background: purple;', { root: shadowRoot2 });

      // Each root should have its own styles
      expect(
        document.head.querySelectorAll('[data-tasty]').length,
      ).toBeGreaterThan(0);
      expect(
        shadowRoot1.querySelectorAll('[data-tasty]').length,
      ).toBeGreaterThan(0);
      expect(
        shadowRoot2.querySelectorAll('[data-tasty]').length,
      ).toBeGreaterThan(0);

      // CSS text should be different for each root
      const documentCss = getCssText();
      const shadow1Css = getCssText({ root: shadowRoot1 });
      const shadow2Css = getCssText({ root: shadowRoot2 });

      expect(documentCss).toContain('color: red');
      expect(documentCss).toContain('body');
      expect(documentCss).not.toContain('background: yellow');

      expect(shadow1Css).toContain('color: blue');
      expect(shadow1Css).toContain('background: yellow');
      expect(shadow1Css).not.toContain('color: red');

      expect(shadow2Css).toContain('color: green');
      expect(shadow2Css).toContain('background: purple');
      expect(shadow2Css).not.toContain('color: red');
    });
  });
});
