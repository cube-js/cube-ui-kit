import { cleanup, render } from '@testing-library/react';

import {
  clearGlobalPredefinedStates,
  resetStylesGenerated,
  setGlobalPredefinedStates,
} from './states';
import { tasty } from './tasty';

import { configure } from './index';

describe('Advanced State Mapping - CSS Output', () => {
  beforeEach(() => {
    // Configure injector for test environment with text injection
    configure({
      forceTextInjection: true,
    });
    // Reset state for clean tests
    resetStylesGenerated();
    clearGlobalPredefinedStates();
  });

  afterEach(() => {
    cleanup();
    // Clean up any injected styles
    document.head.querySelectorAll('[data-tasty]').forEach((el) => el.remove());
  });

  describe('@media query states', () => {
    it('should generate CSS with @media wrapper for dimension queries', () => {
      const Element = tasty({
        styles: {
          padding: {
            '': '4x',
            '@media(width <= 920px)': '2x',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should expand dimension shorthands in media queries', () => {
      const Element = tasty({
        styles: {
          padding: {
            '': '4x',
            '@media(w < 600px)': '2x',
            '@media(h > 800px)': '6x',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should generate exclusive CSS for multiple overlapping breakpoints', () => {
      // Exact styles from AdvancedStates.stories.tsx MediaQueries story
      const Element = tasty({
        styles: {
          padding: {
            '': '4x',
            '@media(w < 768px)': '2x',
            '@media(w < 480px)': '1x',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should expand tasty units in media queries', () => {
      const Element = tasty({
        styles: {
          padding: {
            '': '4x',
            '@media(w <= 40x)': '2x',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle @media:type syntax', () => {
      const Element = tasty({
        styles: {
          display: {
            '': 'block',
            '@media:print': 'none',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle media queries with range syntax', () => {
      const Element = tasty({
        styles: {
          columns: {
            '': '1',
            '@media(600px <= w < 900px)': '2',
            '@media(w >= 900px)': '3',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle cascading media queries with overlapping ranges', () => {
      // From ADVANCED_STATE_MAPPING.md spec (lines 1164-1175)
      // Multiple overlapping media queries should generate proper cascading CSS
      const Element = tasty({
        styles: {
          gridTemplateColumns: {
            '': '1fr 1fr 1fr', // for w > 1400px (default)
            '@media(w <= 1400px)': '1fr 1fr', // for 920px < w <= 1400px
            '@media(w <= 920px)': '1fr', // for w <= 920px
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });
  });

  // Note: @container query CSS is not supported by jsdom, so these tests
  // verify the CSS is generated but cannot validate injection works.
  // The CSS generation is tested via unit tests in states/states.test.ts
  describe('@container query states', () => {
    it('should generate CSS with @container wrapper for unnamed queries (jsdom limitation)', () => {
      // jsdom does not support @container CSS syntax
    });

    it('should generate CSS with named container queries (jsdom limitation)', () => {
      // jsdom does not support @container CSS syntax
    });

    it('should handle style queries in container queries (jsdom limitation)', () => {
      // jsdom does not support @container CSS syntax
    });

    it('should handle style queries with equality (jsdom limitation)', () => {
      // jsdom does not support @container CSS syntax
    });
  });

  describe('@root states', () => {
    it('should generate CSS with :root prefix for root states', () => {
      const Element = tasty({
        styles: {
          fill: {
            '': '#white',
            '@root(theme=dark)': '#dark-02',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle class-based root states', () => {
      const Element = tasty({
        styles: {
          fill: {
            '': '#white',
            '@root(.compact-mode)': '#gray-05',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle attribute-based root states', () => {
      const Element = tasty({
        styles: {
          fill: {
            '': '#white',
            '@root([data-high-contrast])': '#black',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });
  });

  // Note: @starting-style CSS is not supported by jsdom
  describe('@starting style states', () => {
    it('should generate CSS with @starting-style wrapper (jsdom limitation)', () => {
      // jsdom does not support @starting-style CSS syntax
    });

    it('should handle multiple properties in starting style (jsdom limitation)', () => {
      // jsdom does not support @starting-style CSS syntax
    });
  });

  describe('predefined states (local)', () => {
    it('should resolve local predefined states to their definitions', () => {
      const Element = tasty({
        styles: {
          '@mobile': '@media(w < 600px)',
          padding: {
            '': '4x',
            '@mobile': '2x',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle multiple local predefined states', () => {
      const Element = tasty({
        styles: {
          '@small': '@media(w < 400px)',
          '@medium': '@media(400px <= w < 800px)',
          '@large': '@media(w >= 800px)',
          padding: {
            '': '2x',
            '@small': '1x',
            '@medium': '3x',
            '@large': '4x',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });
  });

  describe('predefined states (global)', () => {
    beforeEach(() => {
      // Set up global predefined states
      setGlobalPredefinedStates({
        '@mobile': '@media(w < 768px)',
        '@tablet': '@media(768px <= w < 1024px)',
        '@desktop': '@media(w >= 1024px)',
        '@dark': '@root(theme=dark)',
        '@print': '@media:print',
      });
    });

    it('should resolve global predefined states', () => {
      const Element = tasty({
        styles: {
          padding: {
            '': '4x',
            '@mobile': '2x',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle multiple global predefined states', () => {
      const Element = tasty({
        styles: {
          padding: {
            '': '2x',
            '@mobile': '1x',
            '@tablet': '3x',
            '@desktop': '4x',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should prioritize local over global predefined states', () => {
      const Element = tasty({
        styles: {
          // Override global @mobile with local definition
          '@mobile': '@media(w < 480px)',
          padding: {
            '': '4x',
            '@mobile': '2x',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });
  });

  describe('combined advanced states with regular modifiers', () => {
    it('should combine media queries with regular modifiers', () => {
      const Element = tasty({
        styles: {
          padding: {
            '': '4x',
            hovered: '5x',
            '@media(w < 600px)': '2x',
            '@media(w < 600px) & hovered': '3x',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle root states with regular modifiers', () => {
      const Element = tasty({
        styles: {
          fill: {
            '': '#white',
            disabled: '#gray-03',
            '@root(theme=dark)': '#dark-02',
            '@root(theme=dark) & disabled': '#dark-04',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });
  });

  describe('sub-element advanced states', () => {
    it('should apply media queries to sub-element styles', () => {
      const Card = tasty({
        styles: {
          padding: '4x',
          Header: {
            padding: {
              '': '2x',
              '@media(w < 600px)': '1x',
            },
          },
        },
      });

      const { container } = render(<Card />);
      expect(container).toMatchTastySnapshot();
    });

    it('should apply root states to sub-element styles', () => {
      const Card = tasty({
        styles: {
          fill: '#white',
          Header: {
            fill: {
              '': '#gray-02',
              '@root(theme=dark)': '#dark-03',
            },
          },
        },
      });

      const { container } = render(<Card />);
      expect(container).toMatchTastySnapshot();
    });

    it('should apply @own state to sub-element', () => {
      // @own() targets the sub-element's own state, not the parent's
      const Card = tasty({
        styles: {
          fill: '#white',
          Label: {
            color: {
              '': '#dark',
              '@own(hovered)': '#purple',
            },
          },
        },
      });

      const { container } = render(<Card />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle negated @own state', () => {
      // !@own() negates the sub-element's own state
      const Card = tasty({
        styles: {
          Label: {
            opacity: {
              '': '1',
              '!@own(focused)': '0.7',
            },
          },
        },
      });

      const { container } = render(<Card />);
      expect(container).toMatchTastySnapshot();
    });

    it('should combine @own state with parent modifiers', () => {
      // Both parent and own states can be used together
      const Button = tasty({
        styles: {
          Icon: {
            color: {
              '': '#gray',
              disabled: '#light-gray',
              '@own(hovered) & !disabled': '#purple',
            },
          },
        },
      });

      const { container } = render(<Button />);
      expect(container).toMatchTastySnapshot();
    });

    it('should combine @own state with media query', () => {
      // @own() combined with @media
      const Card = tasty({
        styles: {
          Label: {
            fontSize: {
              '': '16px',
              '@own(hovered)': '18px',
              '@media(w < 600px)': '14px',
              '@media(w < 600px) & @own(hovered)': '16px',
            },
          },
        },
      });

      const { container } = render(<Card />);
      expect(container).toMatchTastySnapshot();
    });
  });

  describe('edge cases', () => {
    it('should handle empty default with only advanced state', () => {
      const Element = tasty({
        styles: {
          display: {
            '@media:print': 'none',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle advanced states with fallback color syntax', () => {
      const Element = tasty({
        styles: {
          fill: {
            '': '(#surface, #white)',
            '@root(theme=dark)': '(#dark-surface, #dark-02)',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle advanced states with complex style values', () => {
      const Element = tasty({
        styles: {
          border: {
            '': '1bw solid #border',
            '@root(theme=dark)': '1bw solid #dark-05',
            '@media(w < 600px)': 'none',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });
  });

  describe('complex combinations', () => {
    it('should generate CSS with styles of different types in OR groups', () => {
      const Element = tasty({
        styles: {
          color: {
            '': '#white',
            '(@media(prefers-color-scheme: light) | @media(prefers-color-scheme: no-preference)) | (@root(prefers-schema=light) & @root(schema=system))':
              '#dark',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should generate CSS with styles of different types in OR groups in real world use case', () => {
      const Element = tasty({
        styles: {
          color: {
            '': '#dark',
            '(@media(prefers-color-scheme: dark) & @root(prefers-schema=system)) | (@root(prefers-schema=dark) & @media(prefers-color-scheme: no-preference))':
              '#white',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should support complex predefined states', () => {
      // Define a complex predefined state that combines media queries and root states
      const Element = tasty({
        styles: {
          '@darkMode':
            '(@media(prefers-color-scheme: dark) & @root(prefers-schema=system)) | (@root(prefers-schema=dark) & @media(prefers-color-scheme: no-preference))',

          color: {
            '': '#dark',
            '@darkMode': '#white',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should generate CSS with linked styles with the same set of states', () => {
      const Element = tasty({
        styles: {
          display: {
            '': 'flex',
            '@media(w < 600px)': 'grid',
          },
          hide: {
            '': false,
            '@media(w < 600px)': true,
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should generate CSS with linked styles with a different set of states', () => {
      const Element = tasty({
        styles: {
          display: {
            '': 'flex',
            '@media(w < 1200px)': 'grid',
          },
          hide: {
            '': false,
            '@media(w < 600px)': true,
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle combined media and root states on same property', () => {
      // Multiple advanced states targeting the same property
      // Each should generate its own distinct rule
      const Element = tasty({
        styles: {
          padding: {
            '': '4x',
            '@media(w < 600px)': '2x',
            '@root(theme=dark)': '3x',
            '@media(w >= 1200px)': '6x',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle multiple root states', () => {
      // Both theme and contrast mode as root states
      const Element = tasty({
        styles: {
          fill: {
            '': '#white',
            '@root(theme=dark)': '#dark-02',
            '@root(highContrast)': '#black',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle media queries on different dimensions', () => {
      // Width and height media queries should not interfere
      const Element = tasty({
        styles: {
          padding: {
            '': '4x',
            '@media(w < 600px)': '2x',
            '@media(h < 400px)': '1x',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle advanced states with multiple modifiers', () => {
      // Combining advanced state with boolean modifiers
      const Element = tasty({
        styles: {
          padding: {
            '': '4x',
            hovered: '5x',
            '@media(w < 600px)': '2x',
            '@media(w < 600px) & hovered': '3x',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle root states with pseudo-class modifiers', () => {
      // Root state combined with pseudo-class
      const Element = tasty({
        styles: {
          fill: {
            '': '#white',
            '@root(theme=dark)': '#dark-02',
            '@root(theme=dark) & hovered': '#dark-03',
            hovered: '#gray-01',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle cascading root states with specificity', () => {
      // More specific root states should override less specific
      const Element = tasty({
        styles: {
          fill: {
            '': '#white',
            '@root(theme=dark)': '#dark-02',
            '@root(theme=light)': '#light-01',
            '@root(mode=compact)': '#gray-02',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle sub-elements with multiple advanced states', () => {
      // Sub-element with both media and root states
      const Card = tasty({
        styles: {
          padding: '4x',
          Header: {
            padding: {
              '': '2x',
              '@media(w < 600px)': '1x',
              '@root(theme=dark)': '3x',
            },
          },
        },
      });

      const { container } = render(<Card />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle three-way media query cascade', () => {
      // Three non-overlapping ranges
      const Element = tasty({
        styles: {
          columns: {
            '': '4',
            '@media(w <= 1200px)': '3',
            '@media(w <= 800px)': '2',
            '@media(w <= 400px)': '1',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it('should handle predefined states with modifiers', () => {
      const Element = tasty({
        states: {
          '@compact': '@media(w < 600px)',
        },
        styles: {
          padding: {
            '': '4x',
            '@compact': '2x',
            '@compact & hovered': '3x',
            hovered: '5x',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    // Container query tests - skipped due to jsdom limitations with @container CSS
    it.skip('should handle nested container queries (jsdom limitation)', () => {
      const Element = tasty({
        styles: {
          containerType: 'inline-size',
          containerName: 'card',
          padding: {
            '': '4x',
            '@(card, w < 400px)': '2x',
            '@(card, w >= 400px)': '3x',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });

    it.skip('should handle container style queries (jsdom limitation)', () => {
      const Element = tasty({
        styles: {
          containerType: 'inline-size',
          fill: {
            '': '#white',
            '@(style(--theme: dark))': '#dark-02',
          },
        },
      });

      const { container } = render(<Element />);
      expect(container).toMatchTastySnapshot();
    });
  });
});

// Warning tests are skipped in test environment because isDevEnv() returns false
// and warning logic is cached at module load time. Warning functionality is
// implicitly tested through the successful resolution of predefined states.
// The warning logic itself is a simple console.warn wrapper that doesn't need
// extensive testing.

// Direct renderStyles tests for features that jsdom doesn't support
describe('Advanced State Mapping - renderStyles direct tests', () => {
  // Import renderStyles for direct testing
  const { renderStyles } = require('./pipeline');

  describe('@starting-style tests', () => {
    it('should generate @starting-style at-rule for entry animations', () => {
      const { rules } = renderStyles({
        opacity: {
          '': '1',
          '@starting': '0',
        },
      });

      // Find the starting style rule
      const startingRule = rules.find((r: any) =>
        r.atRules?.includes('@starting-style'),
      );
      expect(startingRule).toBeDefined();
      expect(startingRule.declarations).toContain('opacity: 0');

      // Find the default rule
      const defaultRule = rules.find((r: any) => !r.atRules?.length);
      expect(defaultRule).toBeDefined();
      expect(defaultRule.declarations).toContain('opacity: 1');
    });

    it('should handle @starting with multiple properties', () => {
      const { rules } = renderStyles({
        opacity: {
          '': '1',
          '@starting': '0',
        },
        fill: {
          '': '#white',
          '@starting': '#transparent',
        },
      });

      // Find starting style rules
      const startingRules = rules.filter((r: any) =>
        r.atRules?.includes('@starting-style'),
      );
      expect(startingRules.length).toBeGreaterThan(0);

      // Check declarations include opacity
      const startingDeclarations = startingRules
        .map((r: any) => r.declarations)
        .join(' ');
      expect(startingDeclarations).toContain('opacity: 0');
    });
  });

  describe('@container query tests', () => {
    it('should generate @container at-rule for unnamed queries', () => {
      const { rules } = renderStyles({
        padding: {
          '': '4x',
          '@(w < 400px)': '2x',
        },
      });

      // Find the container query rule
      const containerRule = rules.find((r: any) =>
        r.atRules?.some((at: string) => at.startsWith('@container')),
      );
      expect(containerRule).toBeDefined();
      expect(containerRule.atRules[0]).toBe('@container (width < 400px)');
    });

    it('should generate @container at-rule for named queries', () => {
      const { rules } = renderStyles({
        containerName: 'card',
        containerType: 'inline-size',
        padding: {
          '': '4x',
          '@(card, w >= 600px)': '3x',
        },
      });

      // Find the container query rule
      const containerRule = rules.find((r: any) =>
        r.atRules?.some((at: string) => at.includes('card')),
      );
      expect(containerRule).toBeDefined();
      // The format is "@container name (condition)"
      expect(containerRule.atRules[0]).toBe('@container card (width >= 600px)');
    });

    it('should handle cascading container queries with overlapping ranges', () => {
      const { rules } = renderStyles({
        containerType: 'inline-size',
        gridTemplateColumns: {
          '': '1fr 1fr 1fr', // for w > 800px (default)
          '@(w <= 800px)': '1fr 1fr', // for 400px < w <= 800px
          '@(w <= 400px)': '1fr', // for w <= 400px
        },
      });

      // Check that we have non-overlapping container queries
      const containerRules = rules.filter((r: any) =>
        r.atRules?.some((at: string) => at.startsWith('@container')),
      );

      // Should have 3 container query rules (all non-overlapping)
      // The new pipeline uses exclusive conditions with :not() for non-overlapping
      expect(containerRules.length).toBe(3);

      // Check for non-overlapping patterns - verify unique conditions
      const conditions = containerRules.map((r: any) => r.atRules?.[0]);
      const uniqueConditions = new Set(conditions);
      expect(uniqueConditions.size).toBe(conditions.length);

      // Verify the expected non-overlapping ranges
      // Container conditions with the same name are combined with "and"
      // Note: negated conditions are wrapped in parentheses for valid CSS syntax
      expect(conditions).toContain('@container (width <= 400px)');
      expect(conditions).toContain(
        '@container (not (width <= 400px)) and (width <= 800px)',
      );
      expect(conditions).toContain(
        '@container (not (width <= 400px)) and (not (width <= 800px))',
      );
    });

    it('should detect contradictions in container style queries', () => {
      // @($variant=danger) & @($variant=success) should be impossible
      const { rules } = renderStyles({
        fill: {
          '': '#white',
          '@($variant=danger) & @($variant=success)': '#red', // Impossible
        },
      });

      // Filter to find rules that have POSITIVE style queries (not negated)
      // The impossible combination style(--variant: danger) AND style(--variant: success) should be filtered
      const positiveStyleRules = rules.filter((r: any) =>
        r.atRules?.some(
          (at: string) => at.includes('style(') && !at.includes('not style('),
        ),
      );

      // The impossible combination should be filtered out
      // No positive (non-negated) container style rules should exist
      expect(positiveStyleRules.length).toBe(0);
    });

    it('should allow multiple different style property queries', () => {
      // @($variant=danger) & @($size=large) should work - different properties
      const { rules } = renderStyles({
        fill: {
          '': '#white',
          '@($variant=danger) & @($size=large)': '#red',
        },
      });

      // Find rules that have both positive style queries (either combined or separate at-rules)
      const combinedStyleRules = rules.filter((r: any) => {
        const atRules = r.atRules || [];
        const hasVariant = atRules.some(
          (at: string) =>
            at.includes('style(--variant: danger)') &&
            !at.includes('not style'),
        );
        const hasSize = atRules.some(
          (at: string) =>
            at.includes('style(--size: large)') && !at.includes('not style'),
        );
        return hasVariant && hasSize;
      });

      // Should have at least 1 rule with both style queries
      expect(combinedStyleRules.length).toBeGreaterThan(0);
    });

    it('should handle existence check with value checks for same property', () => {
      // @($variant) is existence check, @($variant=danger) is value check
      // Both should work, with value checks having higher priority
      const { rules } = renderStyles({
        fill: {
          '': '#light',
          '@($variant)': '#purple', // When --variant exists
          '@($variant=danger)': '#danger', // When --variant equals 'danger'
          '@($variant=success)': '#success', // When --variant equals 'success'
        },
      });

      // Each fill rule produces 2 CSS rules (main element + >* for context propagation)
      // So 4 conditions × 2 = 8 rules total
      expect(rules.length).toBe(8);

      // Group rules by their at-rule condition
      const rulesByCondition = new Map<string, any[]>();
      for (const rule of rules) {
        const condition = rule.atRules?.[0] || 'none';
        if (!rulesByCondition.has(condition)) {
          rulesByCondition.set(condition, []);
        }
        rulesByCondition.get(condition)!.push(rule);
      }

      // Should have exactly 4 unique conditions
      const conditions = Array.from(rulesByCondition.keys());
      expect(rulesByCondition.size).toBe(4);

      // 1. Success case: clean style(--variant: success) without negations
      const successCondition = conditions.find(
        (c) => c === '@container style(--variant: success)',
      );
      expect(successCondition).toBeDefined();
      expect(
        rulesByCondition
          .get(successCondition!)![0]
          .declarations.includes('success'),
      ).toBe(true);

      // 2. Danger case: clean style(--variant: danger) without negations
      // (The not style(--variant: success) is removed as redundant)
      const dangerCondition = conditions.find(
        (c) => c === '@container style(--variant: danger)',
      );
      expect(dangerCondition).toBeDefined();
      expect(
        rulesByCondition
          .get(dangerCondition!)![0]
          .declarations.includes('danger'),
      ).toBe(true);

      // 3. Existence case: style(--variant) with negations for specific values
      // (These negations are NOT redundant because style(--variant) doesn't imply a specific value)
      const existenceCondition = conditions.find((c) =>
        c.includes('and style(--variant)'),
      );
      expect(existenceCondition).toBeDefined();
      expect(
        rulesByCondition
          .get(existenceCondition!)![0]
          .declarations.includes('purple'),
      ).toBe(true);

      // 4. Default case: when --variant doesn't exist
      const defaultCondition = conditions.find((c) =>
        c.includes('(not style(--variant))'),
      );
      expect(defaultCondition).toBeDefined();
      expect(
        rulesByCondition
          .get(defaultCondition!)![0]
          .declarations.includes('light'),
      ).toBe(true);
    });

    it('should simplify redundant negations in container style queries', () => {
      // style(--variant: danger) implies NOT style(--variant: success)
      // So we should NOT see both in the same condition
      const { rules } = renderStyles({
        fill: {
          '': '#light',
          '@($variant=danger)': '#danger',
          '@($variant=success)': '#success',
        },
      });

      const fillRules = rules.filter((r: any) =>
        r.declarations.includes('background-color'),
      );

      // Check that the danger rule doesn't have a redundant negation of success
      const dangerRule = fillRules.find(
        (r: any) =>
          r.atRules?.[0]?.includes('style(--variant: danger)') &&
          r.declarations.includes('danger'),
      );
      expect(dangerRule).toBeDefined();

      // The danger condition should NOT include "not style(--variant: success)"
      // because style(--variant: danger) already implies it
      const dangerCondition = dangerRule.atRules?.[0];
      expect(dangerCondition).not.toContain('not style(--variant: success)');
      expect(dangerCondition).not.toContain('(not style');
    });
  });

  describe('edge cases with undefined values', () => {
    it('should not generate CSS when handler receives only undefined/null values', () => {
      // When a handler's lookup styles only have undefined values, skip execution
      const { rules } = renderStyles({
        display: {
          '@media:print': undefined as any,
        },
      });

      // No rules should be generated since display value is undefined
      expect(rules.length).toBe(0);
    });

    it('should handle handler with mixed defined/undefined lookup styles', () => {
      // displayStyle looks up ['display', 'hide']
      // If display has a value and hide is undefined, should still work
      const { rules } = renderStyles({
        display: {
          '': 'flex',
          '@media:print': 'none',
        },
        // hide is not defined
      });

      // Should have 2 rules: default and print
      expect(rules.length).toBe(2);
      expect(rules.some((r: any) => r.atRules?.[0] === '@media print')).toBe(
        true,
      );
    });

    it('should handle style with no default and only conditional state', () => {
      // When no default ('') is provided, only generate CSS for the conditional state
      const { rules } = renderStyles({
        display: {
          '@media:print': 'none',
        },
      });

      // Should only have 1 rule for print media
      expect(rules.length).toBe(1);
      expect(rules[0].atRules?.[0]).toBe('@media print');
    });
  });
});
