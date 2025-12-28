/**
 * Pipeline Tests
 *
 * Tests for the new style rendering pipeline.
 */

import { createStateParserContext } from '../states';

import {
  and,
  createMediaDimensionCondition,
  createModifierCondition,
  falseCondition,
  not,
  or,
  trueCondition,
} from './conditions';
import { buildExclusiveConditions, parseStyleEntries } from './exclusive';
import { conditionToCSS } from './materialize';
import { parseStateKey } from './parseStateKey';
import { simplifyCondition } from './simplify';

import { clearPipelineCache, renderStyles } from './index';

describe('ConditionNode operations', () => {
  describe('and()', () => {
    it('should return TRUE for empty args', () => {
      expect(and().kind).toBe('true');
    });

    it('should return child for single arg', () => {
      const mod = createModifierCondition('data-hovered');
      expect(and(mod)).toBe(mod);
    });

    it('should return FALSE when any child is FALSE', () => {
      const mod = createModifierCondition('data-hovered');
      expect(and(mod, falseCondition()).kind).toBe('false');
    });

    it('should skip TRUE children', () => {
      const mod = createModifierCondition('data-hovered');
      const result = and(mod, trueCondition());
      expect(result).toBe(mod);
    });

    it('should flatten nested ANDs', () => {
      const a = createModifierCondition('data-a');
      const b = createModifierCondition('data-b');
      const c = createModifierCondition('data-c');
      const nested = and(a, and(b, c));
      expect(nested.kind).toBe('compound');
      if (nested.kind === 'compound') {
        expect(nested.children.length).toBe(3);
      }
    });
  });

  describe('or()', () => {
    it('should return FALSE for empty args', () => {
      expect(or().kind).toBe('false');
    });

    it('should return child for single arg', () => {
      const mod = createModifierCondition('data-hovered');
      expect(or(mod)).toBe(mod);
    });

    it('should return TRUE when any child is TRUE', () => {
      const mod = createModifierCondition('data-hovered');
      expect(or(mod, trueCondition()).kind).toBe('true');
    });

    it('should skip FALSE children', () => {
      const mod = createModifierCondition('data-hovered');
      const result = or(mod, falseCondition());
      expect(result).toBe(mod);
    });
  });

  describe('not()', () => {
    it('should negate TRUE to FALSE', () => {
      expect(not(trueCondition()).kind).toBe('false');
    });

    it('should negate FALSE to TRUE', () => {
      expect(not(falseCondition()).kind).toBe('true');
    });

    it('should toggle negated flag on state', () => {
      const mod = createModifierCondition(
        'data-hovered',
        undefined,
        '=',
        false,
      );
      const negated = not(mod);
      expect(negated.kind).toBe('state');
      if (negated.kind === 'state') {
        expect(negated.negated).toBe(true);
      }
    });

    it("should apply De Morgan's law to AND", () => {
      const a = createModifierCondition('data-a');
      const b = createModifierCondition('data-b');
      const notAnd = not(and(a, b));
      // NOT(AND(a, b)) = OR(NOT(a), NOT(b))
      expect(notAnd.kind).toBe('compound');
      if (notAnd.kind === 'compound') {
        expect(notAnd.operator).toBe('OR');
        expect(notAnd.children.length).toBe(2);
      }
    });
  });
});

describe('parseStateKey()', () => {
  it('should parse empty string as TRUE', () => {
    expect(parseStateKey('').kind).toBe('true');
  });

  it('should parse boolean modifier', () => {
    const result = parseStateKey('hovered');
    expect(result.kind).toBe('state');
    if (result.kind === 'state') {
      expect(result.type).toBe('modifier');
      expect((result as any).attribute).toBe('data-hovered');
    }
  });

  it('should parse value modifier', () => {
    const result = parseStateKey('theme=danger');
    expect(result.kind).toBe('state');
    if (result.kind === 'state') {
      expect(result.type).toBe('modifier');
      expect((result as any).attribute).toBe('data-theme');
      expect((result as any).value).toBe('danger');
    }
  });

  it('should parse AND operator', () => {
    const result = parseStateKey('hovered & disabled');
    expect(result.kind).toBe('compound');
    if (result.kind === 'compound') {
      expect(result.operator).toBe('AND');
      expect(result.children.length).toBe(2);
    }
  });

  it('should parse OR operator', () => {
    const result = parseStateKey('hovered | focused');
    expect(result.kind).toBe('compound');
    if (result.kind === 'compound') {
      expect(result.operator).toBe('OR');
      expect(result.children.length).toBe(2);
    }
  });

  it('should parse NOT operator', () => {
    const result = parseStateKey('!disabled');
    expect(result.kind).toBe('state');
    if (result.kind === 'state') {
      expect(result.negated).toBe(true);
    }
  });

  it('should parse @starting', () => {
    const result = parseStateKey('@starting');
    expect(result.kind).toBe('state');
    if (result.kind === 'state') {
      expect(result.type).toBe('starting');
    }
  });

  it('should parse @media:print', () => {
    const result = parseStateKey('@media:print');
    expect(result.kind).toBe('state');
    if (result.kind === 'state') {
      expect(result.type).toBe('media');
      expect((result as any).subtype).toBe('type');
      expect((result as any).mediaType).toBe('print');
    }
  });

  it('should parse @media dimension query', () => {
    const result = parseStateKey('@media(w < 768px)');
    expect(result.kind).toBe('state');
    if (result.kind === 'state') {
      expect(result.type).toBe('media');
      expect((result as any).subtype).toBe('dimension');
      expect((result as any).dimension).toBe('width');
      expect((result as any).upperBound).toBeDefined();
    }
  });

  it('should parse @media range query', () => {
    const result = parseStateKey('@media(600px <= w < 1200px)');
    expect(result.kind).toBe('state');
    if (result.kind === 'state') {
      expect(result.type).toBe('media');
      expect((result as any).lowerBound).toBeDefined();
      expect((result as any).upperBound).toBeDefined();
    }
  });

  it('should parse @root state', () => {
    const result = parseStateKey('@root(theme=dark)');
    expect(result.kind).toBe('state');
    if (result.kind === 'state') {
      expect(result.type).toBe('root');
      expect((result as any).selector).toBe('[data-theme="dark"]');
    }
  });

  it('should parse @own state', () => {
    const result = parseStateKey('@own(hovered)', { isSubElement: true });
    expect(result.kind).toBe('state');
    if (result.kind === 'state') {
      expect(result.type).toBe('own');
    }
  });

  it('should parse container query', () => {
    const result = parseStateKey('@(layout, w < 600px)');
    expect(result.kind).toBe('state');
    if (result.kind === 'state') {
      expect(result.type).toBe('container');
      expect((result as any).containerName).toBe('layout');
    }
  });

  it('should parse container style query', () => {
    const result = parseStateKey('@(layout, $variant=danger)');
    expect(result.kind).toBe('state');
    if (result.kind === 'state') {
      expect(result.type).toBe('container');
      expect((result as any).subtype).toBe('style');
      expect((result as any).property).toBe('variant');
      expect((result as any).propertyValue).toBe('danger');
    }
  });

  it('should parse pseudo-class', () => {
    const result = parseStateKey(':hover');
    expect(result.kind).toBe('state');
    if (result.kind === 'state') {
      expect(result.type).toBe('pseudo');
    }
  });

  it('should parse combined states', () => {
    const result = parseStateKey('@media(w < 768px) & hovered');
    expect(result.kind).toBe('compound');
    if (result.kind === 'compound') {
      expect(result.operator).toBe('AND');
      expect(result.children.length).toBe(2);
    }
  });
});

describe('simplifyCondition()', () => {
  it('should detect A & !A contradiction', () => {
    const a = createModifierCondition('data-hovered');
    const result = simplifyCondition(and(a, not(a)));
    expect(result.kind).toBe('false');
  });

  it('should detect A | !A tautology', () => {
    const a = createModifierCondition('data-hovered');
    const result = simplifyCondition(or(a, not(a)));
    expect(result.kind).toBe('true');
  });

  it('should detect impossible media range', () => {
    const low = createMediaDimensionCondition('width', undefined, {
      value: '400px',
      valueNumeric: 400,
      inclusive: true,
    });
    const high = createMediaDimensionCondition(
      'width',
      { value: '800px', valueNumeric: 800, inclusive: true },
      undefined,
    );
    const result = simplifyCondition(and(low, high));
    expect(result.kind).toBe('false');
  });

  it('should deduplicate terms', () => {
    const a = createModifierCondition('data-hovered');
    const result = simplifyCondition(and(a, a));
    expect(result.kind).toBe('state');
  });

  it('should apply absorption: A & (A | B) → A', () => {
    const a = createModifierCondition('data-a');
    const b = createModifierCondition('data-b');
    const result = simplifyCondition(and(a, or(a, b)));
    expect(result.kind).toBe('state');
    if (result.kind === 'state') {
      expect((result as any).attribute).toBe('data-a');
    }
  });
});

describe('buildExclusiveConditions()', () => {
  it('should order entries by priority (highest first)', () => {
    const entries = parseStyleEntries(
      'padding',
      {
        '': '4x',
        hovered: '2x',
      },
      parseStateKey,
    );

    const exclusive = buildExclusiveConditions(entries);

    // parseStyleEntries reverses so highest priority comes first
    // First entry should be hovered (highest priority), last should be default
    expect(exclusive[0].stateKey).toBe('hovered');
    expect(exclusive[1].stateKey).toBe('');
  });

  it('should add negation to lower priority entries', () => {
    const entries = parseStyleEntries(
      'padding',
      {
        '': '4x',
        hovered: '2x',
      },
      parseStateKey,
    );

    const exclusive = buildExclusiveConditions(entries);

    // Default entry should have !hovered exclusive condition
    const defaultEntry = exclusive.find((e) => e.stateKey === '');
    expect(defaultEntry).toBeDefined();
    // The exclusive condition should be a negated state (NOT hovered)
    expect(defaultEntry!.exclusiveCondition.kind).toBe('state');
    if (defaultEntry!.exclusiveCondition.kind === 'state') {
      expect(defaultEntry!.exclusiveCondition.negated).toBe(true);
    }
  });

  it('should filter out impossible combinations', () => {
    const entries = parseStyleEntries(
      'padding',
      {
        '': '4x',
        hovered: '2x',
        'hovered & !hovered': '1x', // Impossible
      },
      parseStateKey,
    );

    const exclusive = buildExclusiveConditions(entries);

    // Should not include the impossible entry
    expect(
      exclusive.find((e) => e.stateKey === 'hovered & !hovered'),
    ).toBeUndefined();
  });
});

describe('conditionToCSS()', () => {
  it('should convert modifier to attribute selector', () => {
    const mod = createModifierCondition('data-hovered');
    const css = conditionToCSS(mod);
    expect(css.variants.length).toBe(1);
    expect(css.variants[0].modifierSelectors).toContain('[data-hovered]');
  });

  it('should convert negated modifier to :not()', () => {
    const mod = createModifierCondition('data-disabled', undefined, '=', true);
    const css = conditionToCSS(mod);
    expect(css.variants.length).toBe(1);
    expect(css.variants[0].modifierSelectors).toContain(
      ':not([data-disabled])',
    );
  });

  it('should convert media query to at-rule', () => {
    const media = createMediaDimensionCondition('width', undefined, {
      value: '768px',
      valueNumeric: 768,
      inclusive: true,
    });
    const css = conditionToCSS(media);
    expect(css.variants.length).toBe(1);
    expect(css.variants[0].mediaConditions.length).toBe(1);
    expect(css.variants[0].mediaConditions[0].condition).toContain('width');
    expect(css.variants[0].mediaConditions[0].subtype).toBe('dimension');
  });

  it('should set startingStyle flag for @starting', () => {
    const result = parseStateKey('@starting');
    const css = conditionToCSS(result);
    expect(css.variants.length).toBe(1);
    expect(css.variants[0].startingStyle).toBe(true);
  });

  it('should set rootPrefix for @root', () => {
    const result = parseStateKey('@root(theme=dark)');
    const css = conditionToCSS(result);
    expect(css.variants.length).toBe(1);
    expect(css.variants[0].rootPrefix).toBe(':root[data-theme="dark"]');
  });
});

describe('Integration: Exclusive conditions for media queries', () => {
  it('should generate non-overlapping media ranges', () => {
    const entries = parseStyleEntries(
      'gridTemplateColumns',
      {
        '': '1fr 1fr 1fr', // Default: w > 1400px
        '@media(w <= 1400px)': '1fr 1fr', // 920px < w <= 1400px
        '@media(w <= 920px)': '1fr', // w <= 920px
      },
      parseStateKey,
    );

    const exclusive = buildExclusiveConditions(entries);

    // Should have 3 non-overlapping entries
    expect(exclusive.length).toBe(3);

    // First (highest priority): w <= 920px
    expect(exclusive[0].stateKey).toBe('@media(w <= 920px)');

    // Second: w <= 1400px & !(w <= 920px) → 920px < w <= 1400px
    expect(exclusive[1].stateKey).toBe('@media(w <= 1400px)');
    expect(exclusive[1].exclusiveCondition.kind).toBe('compound');

    // Third (default): !(w <= 920px) & !(w <= 1400px) → w > 1400px
    expect(exclusive[2].stateKey).toBe('');
  });
});

describe('renderStyles integration', () => {
  it('should handle radius with value mapping', () => {
    const styles = {
      radius: {
        '': true,
        'type=link & !focused': 0,
      },
    };

    const result = renderStyles(styles, '.test');

    // Should have border-radius rules
    expect(result.length).toBeGreaterThan(0);
    const hasRadius = result.some((r) =>
      r.declarations.includes('border-radius'),
    );
    expect(hasRadius).toBe(true);
  });

  it('should handle simple radius value', () => {
    const styles = {
      radius: '1r',
    };

    const result = renderStyles(styles, '.test');

    expect(result.length).toBeGreaterThan(0);
    const hasRadius = result.some((r) =>
      r.declarations.includes('border-radius'),
    );
    expect(hasRadius).toBe(true);
  });

  it('should handle priority order for boolean vs value selectors', () => {
    const styles = {
      color: {
        'theme=danger': 'red',
        theme: 'blue', // Higher priority (later in object)
      },
    };

    const result = renderStyles(styles, '.test');

    // With exclusive conditions: theme=danger gets exclusive condition:
    // theme=danger & NOT(theme) which simplifies to FALSE (impossible)
    // because [data-theme="danger"] implies [data-theme]
    // So only the higher priority rule (theme → blue) should be generated
    expect(result.length).toBe(1);
    expect(result[0].declarations).toContain('blue');
  });

  it('should generate OR selectors for exclusive conditions', () => {
    const styles = {
      color: {
        '': 'black',
        'hovered | focused': 'red',
      },
    };

    const result = renderStyles(styles, '.test');

    // Should have rules for:
    // 1. hovered | focused → red
    // 2. !hovered & !focused → black (exclusive)
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('should resolve local predefined states', () => {
    const styles = {
      '@mobile': '@media(w <= 1000px)',
      color: {
        '': 'purple',
        '@mobile': 'red',
      },
    };

    const result = renderStyles(styles, '.test');

    // Should generate a media query rule for the @mobile condition
    const mediaRule = result.find((r) => r.atRules?.length);
    expect(mediaRule).toBeDefined();
    expect(mediaRule!.atRules![0]).toContain('width');
    expect(mediaRule!.atRules![0]).toContain('1000px');
  });
});

describe('Complex OR conditions with mixed types', () => {
  it('should detect media feature contradictions', () => {
    // @media(light) & !@media(light) should simplify to FALSE
    const light = parseStateKey('@media(prefers-color-scheme: light)', {});
    const notLight = not(light);
    const contradiction = and(light, notLight);
    const simplified = simplifyCondition(contradiction);

    expect(simplified.kind).toBe('false');
  });

  it('should analyze OR condition with mixed media and root states', () => {
    // Parse the complex condition
    const darkCondition = parseStateKey(
      '(@media(prefers-color-scheme: light) | @media(prefers-color-scheme: no-preference)) | (@root(prefers-schema=light) & @root(prefers-schema=system))',
      {},
    );

    // Get CSS components for the dark condition
    const darkCSS = conditionToCSS(darkCondition);

    // Negate and simplify for the white (default) condition
    const whiteCondition = not(darkCondition);
    const simplifiedWhite = simplifyCondition(whiteCondition);

    const whiteCSS = conditionToCSS(simplifiedWhite);

    // The dark condition should have 3 variants (2 media + 1 root)
    expect(darkCSS.variants.length).toBe(3);

    // The white condition should properly negate the OR
    // NOT(A | B | C) = NOT(A) & NOT(B) & NOT(C)
    // where C = (root1 & root2), so NOT(C) = NOT(root1) | NOT(root2)
    // Final: NOT(media1) & NOT(media2) & (NOT(root1) | NOT(root2))
    // In DNF: 2 terms
    expect(whiteCSS.variants.length).toBe(2);
  });

  it('should render correct CSS for complex OR with mixed types', () => {
    // Clear cache to ensure fresh computation
    clearPipelineCache();

    const styles = {
      color: {
        '': '#white',
        '(@media(prefers-color-scheme: light) | @media(prefers-color-scheme: no-preference)) | (@root(prefers-schema=light) & @root(prefers-schema=system))':
          '#dark',
      },
    };

    const result = renderStyles(styles, '.test');

    // Check that dark rules exist for each OR branch
    const darkRules = result.filter((r) => r.declarations.includes('dark'));
    expect(darkRules.length).toBeGreaterThanOrEqual(3);

    // Check that white (default) condition has root prefix variants
    const whiteRules = result.filter((r) => r.declarations.includes('white'));
    expect(whiteRules.length).toBeGreaterThanOrEqual(2);
    expect(
      whiteRules.some((r) =>
        r.selector.includes(':root:not([data-prefers-schema="light"])'),
      ),
    ).toBe(true);
    expect(
      whiteRules.some((r) =>
        r.selector.includes(':root:not([data-prefers-schema="system"])'),
      ),
    ).toBe(true);
  });
});
