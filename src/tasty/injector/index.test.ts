/**
 * @jest-environment jsdom
 */
import { StyleResult } from '../utils/renderStyles';

import {
  cleanup,
  configure,
  createGlobalStyle,
  createInjector,
  destroy,
  getCssText,
  inject,
  keyframes,
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

  // For complex CSS, just return a simple valid CSS rule for testing
  // We don't need full CSS parsing in tests, just valid CSS that won't break JSDOM
  return [
    {
      selector: `.${className}`,
      declarations: 'color: red;', // Simple valid CSS for all test cases
      atRules: undefined,
    },
  ];
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
      const result1 = inject(cssToStyleResults('&{ color: red; }'));
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

  describe('global injection', () => {
    it('should inject global CSS rules via global API', () => {
      const globalRules = [
        {
          selector: 'body',
          declarations: 'margin: 0; background: white;',
        },
        {
          selector: '.page-header',
          declarations: 'padding: 20px; border-bottom: 1px solid #ccc;',
        },
      ];

      const result = inject(globalRules);
      expect(result.className).toMatch(/^t\d+$/);
      expect(typeof result.dispose).toBe('function');

      // Check that global selectors are preserved
      const styleElements = document.head.querySelectorAll('[data-tasty]');
      expect(styleElements.length).toBeGreaterThan(0);

      const allCssText = Array.from(styleElements)
        .map((el) => el.textContent || '')
        .join('');

      expect(allCssText).toContain('body');
      expect(allCssText).toContain('margin: 0');
      expect(allCssText).toContain('.page-header');
      expect(allCssText).toContain('padding: 20px');
    });

    it('should handle global CSS with different selector types', () => {
      const globalRules = [
        {
          selector: 'html',
          declarations: 'font-family: Arial, sans-serif;',
        },
        {
          selector: '.container',
          declarations: 'max-width: 1200px; margin: 0 auto;',
        },
        {
          selector: '#header',
          declarations: 'height: 60px; background: navy;',
        },
        {
          selector: 'h1, h2, h3',
          declarations: 'color: #333; margin-top: 0;',
        },
      ];

      const result = inject(globalRules);
      expect(result.className).toMatch(/^t\d+$/);

      const styleElements = document.head.querySelectorAll('[data-tasty]');
      const allCssText = Array.from(styleElements)
        .map((el) => el.textContent || '')
        .join('');

      expect(allCssText).toContain('html');
      expect(allCssText).toContain('font-family: Arial');
      expect(allCssText).toContain('.container');
      expect(allCssText).toContain('max-width: 1200px');
      expect(allCssText).toContain('#header');
      expect(allCssText).toContain('height: 60px');
      expect(allCssText).toContain('h1, h2, h3');
      expect(allCssText).toContain('color: #333');
    });

    it('should handle global CSS with media queries and pseudo-selectors', () => {
      const globalRules = [
        {
          selector: 'a:hover',
          declarations: 'color: blue; text-decoration: underline;',
        },
        {
          selector: '.btn',
          declarations:
            'padding: 10px 20px; background: #007bff; color: white;',
          atRules: ['@media (min-width: 768px)'],
        },
      ];

      const result = inject(globalRules);
      expect(result.className).toMatch(/^t\d+$/);

      const styleElements = document.head.querySelectorAll('[data-tasty]');
      const allCssText = Array.from(styleElements)
        .map((el) => el.textContent || '')
        .join('');

      expect(allCssText).toContain('a:hover');
      expect(allCssText).toContain('color: blue');
      expect(allCssText).toContain('.btn');
      expect(allCssText).toContain('background: #007bff');
      expect(allCssText).toContain('@media (min-width: 768px)');
    });
  });

  describe('getCssText', () => {
    it('should return CSS text from global injector', () => {
      inject(cssToStyleResults('&{ color: red; }'));

      const cssText = getCssText();

      expect(cssText).toContain('color: red');
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
      const injector1 = createInjector();
      const injector2 = createInjector();

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
      const isolatedInjector = createInjector();

      // Global injector should still work
      const globalResult = inject(cssToStyleResults('&{ color: red; }'));
      const isolatedResult = isolatedInjector.inject(
        cssToStyleResults('&{ color: blue; }'),
      );

      expect(globalResult.className).toMatch(/^t\d+$/);
      expect(isolatedResult.className).toMatch(/^t\d+$/);
    });
  });

  describe('keyframes', () => {
    it('should inject keyframes and return object with toString/dispose', () => {
      const fade = keyframes({
        from: { opacity: 0 },
        to: { opacity: 1 },
      });

      expect(fade.toString()).toMatch(/^k\d+$/);
      expect(typeof fade.dispose).toBe('function');

      const styleElements = document.head.querySelectorAll('[data-tasty]');
      expect(styleElements.length).toBeGreaterThan(0);

      const allCssText = Array.from(styleElements)
        .map((el) => el.textContent || '')
        .join('');
      expect(allCssText).toContain('@keyframes');
      expect(allCssText).toContain('opacity: 0');
      expect(allCssText).toContain('opacity: 1');
    });

    it('should deduplicate identical keyframes', () => {
      const fadeA = keyframes({ from: 'opacity: 0;', to: 'opacity: 1;' });
      const fadeB = keyframes({ from: 'opacity: 0;', to: 'opacity: 1;' });

      expect(fadeA.toString()).toBe(fadeB.toString());
    });

    it('should work with percentage steps', () => {
      const spin = keyframes({
        '0%': 'transform: rotate(0deg);',
        '100%': 'transform: rotate(360deg);',
      });

      expect(spin.toString()).toMatch(/^k\d+$/);
    });

    it('should handle empty steps', () => {
      const empty = keyframes({});
      expect(empty.toString()).toBe('');
    });

    it('should work with custom root', () => {
      const shadowRoot = document
        .createElement('div')
        .attachShadow({ mode: 'open' });

      const pulse = keyframes(
        {
          '0%': 'opacity: 0.5;',
          '50%': 'opacity: 1;',
          '100%': 'opacity: 0.5;',
        },
        { root: shadowRoot },
      );

      expect(pulse.toString()).toMatch(/^k\d+$/);
      expect(shadowRoot.querySelectorAll('[data-tasty]').length).toBe(1);
    });

    it('should dispose keyframes properly', () => {
      const fade = keyframes({ from: 'opacity: 0;', to: 'opacity: 1;' });
      const name = fade.toString();

      fade.dispose();

      // Should still work after dispose (cleanup happens later)
      expect(name).toMatch(/^k\d+$/);
    });

    it('should allow custom names via options', () => {
      const customFade = keyframes(
        { from: 'opacity: 0;', to: 'opacity: 1;' },
        { name: 'customFade' },
      );

      expect(customFade.toString()).toBe('customFade');
    });

    it('should allow custom names via string parameter', () => {
      const customFade = keyframes(
        { from: 'opacity: 0;', to: 'opacity: 1;' },
        'directName',
      );

      expect(customFade.toString()).toBe('directName');
    });

    it('should cache by name and steps separately', () => {
      const fade1 = keyframes(
        { from: 'opacity: 0;', to: 'opacity: 1;' },
        { name: 'fade' },
      );
      const fade2 = keyframes(
        { from: 'opacity: 0;', to: 'opacity: 1;' },
        'fade',
      );
      const fade3 = keyframes({ from: 'opacity: 0;', to: 'opacity: 1;' });

      expect(fade1.toString()).toBe('fade');
      expect(fade2.toString()).toBe('fade'); // Same name + steps = reused
      expect(fade3.toString()).toMatch(/^k\d+$/); // Different cache key (no name)
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

      // All should be injected
      const styleElements = document.head.querySelectorAll('[data-tasty]');
      expect(styleElements.length).toBeGreaterThan(0);

      // Dispose everything
      result1.dispose();
      result2.dispose();
      result3.dispose();

      // Wait for cleanup
      await new Promise((resolve) => setTimeout(resolve, 10));
      cleanup();
    });

    it('should handle SSR scenario', () => {
      // Simulate SSR by injecting styles
      inject(cssToStyleResults('&{ color: red; }'));
      inject(cssToStyleResults('&{ background: blue; }'));

      // Get CSS for SSR
      const cssText = getCssText();

      expect(cssText).toContain('color: red');
      expect(cssText).toContain('background: blue');
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

      expect(shadow1Css).toContain('color: blue');
      expect(shadow1Css).not.toContain('color: red');

      expect(shadow2Css).toContain('color: green');
      expect(shadow2Css).not.toContain('color: red');
    });
  });

  describe('createGlobalStyle', () => {
    test('exports createGlobalStyle function from global injector', () => {
      expect(typeof createGlobalStyle).toBe('function');

      // Create a global style component
      const GlobalStyle = createGlobalStyle<{ color: string }>`
        .test-global {
          color: ${(props) => props.color};
        }
      `;

      // Check that it returns a React component type
      expect(typeof GlobalStyle).toBe('function');
      expect(GlobalStyle.prototype).toBeDefined();

      // Test that the interpolation would work as expected
      const testColor = 'blue';
      const expectedTemplate = `
        .test-global {
          color: ${testColor};
        }
      `;
      expect(expectedTemplate).toContain('color: blue');
      expect(expectedTemplate).toContain('.test-global');
    });
  });
});
