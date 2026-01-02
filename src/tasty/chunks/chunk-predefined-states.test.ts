/**
 * @jest-environment jsdom
 */
import { clearPipelineCache } from '../pipeline';
import { Styles } from '../styles/types';

import { categorizeStyleKeys } from './definitions';
import { renderStylesForChunk } from './renderChunk';

describe('Chunking with local predefined states', () => {
  // Clear cache between tests to avoid state pollution
  beforeEach(() => {
    clearPipelineCache();
  });
  it('should resolve local predefined states across chunks', () => {
    const styles: Styles = {
      '@mobile': '@media(w < 600px)',
      padding: {
        '': '4x',
        '@mobile': '2x',
      },
      fill: '#purple',
    };

    // Categorize - @mobile goes to misc, padding to dimension, fill to appearance
    const chunks = categorizeStyleKeys(styles as Record<string, unknown>);

    // Verify categorization
    expect(chunks.get('misc')).toContain('@mobile');
    expect(chunks.get('dimension')).toContain('padding');
    expect(chunks.get('appearance')).toContain('fill');

    // Render the dimension chunk (contains padding which references @mobile)
    const dimensionKeys = chunks.get('dimension')!;
    const result = renderStylesForChunk(styles, 'dimension', dimensionKeys);

    // Should have rules with proper media query
    expect(result.rules.length).toBeGreaterThan(0);

    // Check that @mobile was resolved to a media query (not a data attribute)
    const hasMediaRule = result.rules.some((rule) =>
      rule.atRules?.some((ar) => ar.includes('600px')),
    );
    expect(hasMediaRule).toBe(true);

    // Should NOT have data-mobile attribute selector (that would indicate failed resolution)
    const hasDataMobileSelector = result.rules.some((rule) =>
      rule.selector.includes('data-mobile'),
    );
    expect(hasDataMobileSelector).toBe(false);
  });

  it('should resolve local predefined states in subcomponents chunk', () => {
    const styles: Styles = {
      '@compact': '@(w < 400px)',
      Label: {
        padding: {
          '': '2x',
          '@compact': '1x',
        },
      },
    };

    // Categorize
    const chunks = categorizeStyleKeys(styles as Record<string, unknown>);

    // Render the subcomponents chunk (contains Label which references @compact)
    const subcomponentKeys = chunks.get('subcomponents')!;
    const result = renderStylesForChunk(
      styles,
      'subcomponents',
      subcomponentKeys,
    );

    // Should have rules with container query
    expect(result.rules.length).toBeGreaterThan(0);

    // Check that @compact was resolved to a container query
    const hasContainerRule = result.rules.some((rule) =>
      rule.atRules?.some((ar) => ar.includes('@container')),
    );
    expect(hasContainerRule).toBe(true);
  });

  it('should handle multiple local predefined states', () => {
    const styles: Styles = {
      '@mobile': '@media(w < 600px)',
      '@dark': '@root(theme=dark)',
      fill: {
        '': '#white',
        '@dark': '#dark',
      },
      padding: {
        '': '4x',
        '@mobile': '2x',
      },
    };

    const chunks = categorizeStyleKeys(styles as Record<string, unknown>);

    // Render appearance chunk (fill with @dark)
    const appearanceKeys = chunks.get('appearance')!;
    const appearanceResult = renderStylesForChunk(
      styles,
      'appearance',
      appearanceKeys,
    );

    // Should have rules for both default and dark theme
    expect(appearanceResult.rules.length).toBeGreaterThan(0);

    // Render dimension chunk (padding with @mobile)
    const dimensionKeys = chunks.get('dimension')!;
    const dimensionResult = renderStylesForChunk(
      styles,
      'dimension',
      dimensionKeys,
    );

    // Should have media query rules
    const hasMediaRule = dimensionResult.rules.some((rule) =>
      rule.atRules?.some((ar) => ar.includes('600px')),
    );
    expect(hasMediaRule).toBe(true);
  });

  it('should resolve local predefined states for color property', () => {
    // This is the exact pattern from Layout.stories.tsx that was reported as not working
    const styles: Styles = {
      color: {
        '': '#purple',
        '@mobile': '#danger-text',
      },
      '@mobile': '@media(w <= 1000px)',
    };

    const chunks = categorizeStyleKeys(styles as Record<string, unknown>);

    // color goes to appearance chunk (not typography!)
    expect(chunks.get('appearance')).toContain('color');
    // @mobile goes to misc chunk
    expect(chunks.get('misc')).toContain('@mobile');

    // Render the appearance chunk (contains color which references @mobile)
    const appearanceKeys = chunks.get('appearance')!;
    const result = renderStylesForChunk(styles, 'appearance', appearanceKeys);

    // Should have rules
    expect(result.rules.length).toBeGreaterThan(0);

    // Check that @mobile was resolved to a media query (not a data attribute)
    const hasMediaRule = result.rules.some((rule) =>
      rule.atRules?.some((ar) => ar.includes('1000px')),
    );
    expect(hasMediaRule).toBe(true);

    // Should NOT have data-mobile attribute selector (that would indicate failed resolution)
    const hasDataMobileSelector = result.rules.some((rule) =>
      rule.selector.includes('data-mobile'),
    );
    expect(hasDataMobileSelector).toBe(false);
  });
});
