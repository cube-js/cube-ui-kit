/**
 * Tests for Advanced State Mapping functionality
 * See ADVANCED_STATE_MAPPING.md for full specification
 */

import {
  clearGlobalPredefinedStates,
  createStateParserContext,
  expandDimensionShorthands,
  expandTastyUnits,
  extractLocalPredefinedStates,
  extractPredefinedStateRefs,
  getGlobalPredefinedStates,
  isAdvancedState,
  isPredefinedStateRef,
  normalizeStateKey,
  parseAdvancedState,
  resetStylesGenerated,
  setGlobalPredefinedStates,
  StateParserContext,
} from './index';

describe('Advanced State Mapping', () => {
  beforeEach(() => {
    // Reset global state between tests
    clearGlobalPredefinedStates();
    resetStylesGenerated();
  });

  describe('parseAdvancedState', () => {
    const defaultCtx: StateParserContext = {
      localPredefinedStates: {},
      globalPredefinedStates: {},
      isSubElement: false,
    };

    describe('Media Queries', () => {
      it('should parse @media(w < 920px)', () => {
        const result = parseAdvancedState('@media(w < 920px)', defaultCtx);
        expect(result.type).toBe('media');
        expect(result.condition).toBe('width < 920px');
        expect(result.mediaType).toBeUndefined();
      });

      it('should parse @media(width <= 1400px)', () => {
        const result = parseAdvancedState(
          '@media(width <= 1400px)',
          defaultCtx,
        );
        expect(result.type).toBe('media');
        expect(result.condition).toBe('width <= 1400px');
      });

      it('should parse @media(h < 600px) with height shorthand', () => {
        const result = parseAdvancedState('@media(h < 600px)', defaultCtx);
        expect(result.type).toBe('media');
        expect(result.condition).toBe('height < 600px');
      });

      it('should parse @media:print (media type)', () => {
        const result = parseAdvancedState('@media:print', defaultCtx);
        expect(result.type).toBe('media');
        expect(result.mediaType).toBe('print');
        expect(result.condition).toBe('');
      });

      it('should parse @media:screen (media type)', () => {
        const result = parseAdvancedState('@media:screen', defaultCtx);
        expect(result.type).toBe('media');
        expect(result.mediaType).toBe('screen');
      });

      it('should expand tasty units in media queries', () => {
        const result = parseAdvancedState('@media(w < 40x)', defaultCtx);
        expect(result.type).toBe('media');
        expect(result.condition).toBe('width < calc(var(--gap) * 40)');
      });

      it('should handle prefers-color-scheme', () => {
        const result = parseAdvancedState(
          '@media(prefers-color-scheme: dark)',
          defaultCtx,
        );
        expect(result.type).toBe('media');
        expect(result.condition).toBe('prefers-color-scheme: dark');
      });
    });

    describe('Container Queries', () => {
      it('should parse @(w < 600px) (unnamed container)', () => {
        const result = parseAdvancedState('@(w < 600px)', defaultCtx);
        expect(result.type).toBe('container');
        expect(result.condition).toBe('width < 600px');
        expect(result.containerName).toBeUndefined();
      });

      it('should parse @(layout, w < 600px) (named container)', () => {
        const result = parseAdvancedState('@(layout, w < 600px)', defaultCtx);
        expect(result.type).toBe('container');
        expect(result.condition).toBe('width < 600px');
        expect(result.containerName).toBe('layout');
      });

      it('should handle style queries @(layout, $compact)', () => {
        const result = parseAdvancedState('@(layout, $compact)', defaultCtx);
        expect(result.type).toBe('container');
        expect(result.condition).toBe('style(--compact)');
        expect(result.containerName).toBe('layout');
      });

      it('should handle style queries with values @(layout, $variant=compact)', () => {
        const result = parseAdvancedState(
          '@(layout, $variant=compact)',
          defaultCtx,
        );
        expect(result.type).toBe('container');
        expect(result.condition).toBe('style(--variant: "compact")');
      });
    });

    describe('Root States', () => {
      it('should parse @root(prefers-dark-scheme)', () => {
        const result = parseAdvancedState(
          '@root(prefers-dark-scheme)',
          defaultCtx,
        );
        expect(result.type).toBe('root');
        expect(result.condition).toBe('prefers-dark-scheme');
      });

      it('should parse @root(theme=dark)', () => {
        const result = parseAdvancedState('@root(theme=dark)', defaultCtx);
        expect(result.type).toBe('root');
        expect(result.condition).toBe('theme=dark');
      });

      it('should parse @root(.premium-user)', () => {
        const result = parseAdvancedState('@root(.premium-user)', defaultCtx);
        expect(result.type).toBe('root');
        expect(result.condition).toBe('.premium-user');
      });
    });

    describe('Sub-Element Own States', () => {
      it('should parse @own(hovered) in sub-element context', () => {
        const subElementCtx: StateParserContext = {
          ...defaultCtx,
          isSubElement: true,
        };
        const result = parseAdvancedState('@own(hovered)', subElementCtx);
        expect(result.type).toBe('own');
        expect(result.condition).toBe('hovered');
      });

      it('should treat @own() as modifier outside sub-element context', () => {
        const result = parseAdvancedState('@own(hovered)', defaultCtx);
        // Should be treated as modifier and emit warning (tested separately)
        expect(result.type).toBe('modifier');
        expect(result.condition).toBe('hovered');
      });
    });

    describe('Starting Style', () => {
      it('should parse @starting', () => {
        const result = parseAdvancedState('@starting', defaultCtx);
        expect(result.type).toBe('starting');
        expect(result.condition).toBe('');
      });
    });

    describe('Predefined States', () => {
      it('should resolve local predefined states to their underlying type', () => {
        const ctx: StateParserContext = {
          localPredefinedStates: { '@mobile': '@media(w < 920px)' },
          globalPredefinedStates: {},
          isSubElement: false,
        };
        const result = parseAdvancedState('@mobile', ctx);
        // Predefined states resolve to their underlying type (media, container, root, etc.)
        expect(result.type).toBe('media');
        expect(result.condition).toBe('width < 920px'); // Expanded shorthand
        expect(result.raw).toBe('@mobile'); // Original key preserved
      });

      it('should resolve global predefined states to their underlying type', () => {
        const ctx: StateParserContext = {
          localPredefinedStates: {},
          globalPredefinedStates: { '@desktop': '@media(w >= 1024px)' },
          isSubElement: false,
        };
        const result = parseAdvancedState('@desktop', ctx);
        expect(result.type).toBe('media');
        expect(result.condition).toBe('width >= 1024px');
        expect(result.raw).toBe('@desktop');
      });

      it('should prioritize local over global predefined states', () => {
        const ctx: StateParserContext = {
          localPredefinedStates: { '@mobile': '@media(w < 480px)' },
          globalPredefinedStates: { '@mobile': '@media(w < 768px)' },
          isSubElement: false,
        };
        const result = parseAdvancedState('@mobile', ctx);
        expect(result.type).toBe('media');
        expect(result.condition).toBe('width < 480px'); // Uses local definition
        expect(result.raw).toBe('@mobile');
      });
    });

    describe('Regular Modifiers', () => {
      it('should parse regular modifiers as type modifier', () => {
        const result = parseAdvancedState('hovered', defaultCtx);
        expect(result.type).toBe('modifier');
        expect(result.condition).toBe('hovered');
      });
    });
  });

  describe('Helper Functions', () => {
    describe('expandDimensionShorthands', () => {
      it('should expand w to width', () => {
        expect(expandDimensionShorthands('w < 920px')).toBe('width < 920px');
      });

      it('should expand h to height', () => {
        expect(expandDimensionShorthands('h < 600px')).toBe('height < 600px');
      });

      it('should expand is to inline-size', () => {
        expect(expandDimensionShorthands('is < 400px')).toBe(
          'inline-size < 400px',
        );
      });

      it('should expand bs to block-size', () => {
        expect(expandDimensionShorthands('bs < 400px')).toBe(
          'block-size < 400px',
        );
      });

      it('should not expand partial matches', () => {
        expect(expandDimensionShorthands('width < 920px')).toBe(
          'width < 920px',
        );
      });
    });

    describe('expandTastyUnits', () => {
      it('should expand x units', () => {
        expect(expandTastyUnits('40x')).toBe('calc(var(--gap) * 40)');
      });

      it('should expand decimal x units', () => {
        expect(expandTastyUnits('12.5x')).toBe('calc(var(--gap) * 12.5)');
      });

      it('should not affect other units', () => {
        expect(expandTastyUnits('920px')).toBe('920px');
      });
    });

    describe('normalizeStateKey', () => {
      it('should trim whitespace', () => {
        const result = normalizeStateKey('  hovered  ');
        expect(result.key).toBe('hovered');
        expect(result.warnings).toHaveLength(0);
      });

      it('should normalize whitespace-only to empty string with warning', () => {
        const result = normalizeStateKey('   ');
        expect(result.key).toBe('');
        expect(result.warnings).toHaveLength(1);
      });

      it('should remove trailing operators with warning', () => {
        const result = normalizeStateKey('hovered | ');
        expect(result.key).toBe('hovered');
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0]).toContain('trailing operator');
      });

      it('should remove leading operators with warning', () => {
        const result = normalizeStateKey('| pressed');
        expect(result.key).toBe('pressed');
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0]).toContain('leading operator');
      });
    });

    describe('isAdvancedState', () => {
      it('should return true for @ states', () => {
        expect(isAdvancedState('@media(w < 920px)')).toBe(true);
        expect(isAdvancedState('@starting')).toBe(true);
        expect(isAdvancedState('@mobile')).toBe(true);
      });

      it('should return true for negated @ states', () => {
        expect(isAdvancedState('!@media(w < 920px)')).toBe(true);
      });

      it('should return false for regular mods', () => {
        expect(isAdvancedState('hovered')).toBe(false);
        expect(isAdvancedState(':focus')).toBe(false);
      });
    });

    describe('isPredefinedStateRef', () => {
      it('should return true for predefined state references', () => {
        expect(isPredefinedStateRef('@mobile')).toBe(true);
        expect(isPredefinedStateRef('@dark')).toBe(true);
        expect(isPredefinedStateRef('@compact-mode')).toBe(true);
      });

      it('should return false for built-in states', () => {
        expect(isPredefinedStateRef('@starting')).toBe(false);
        expect(isPredefinedStateRef('@media(w < 920px)')).toBe(false);
        expect(isPredefinedStateRef('@root(dark)')).toBe(false);
        expect(isPredefinedStateRef('@own(hovered)')).toBe(false);
        expect(isPredefinedStateRef('@(w < 600px)')).toBe(false);
      });
    });

    describe('extractPredefinedStateRefs', () => {
      it('should extract predefined state references', () => {
        const refs = extractPredefinedStateRefs('@mobile & @dark');
        expect(refs).toContain('@mobile');
        expect(refs).toContain('@dark');
      });

      it('should not extract built-in states', () => {
        const refs = extractPredefinedStateRefs(
          '@starting & @media(w < 920px)',
        );
        expect(refs).not.toContain('@starting');
        expect(refs).toHaveLength(0);
      });

      it('should extract user-defined states that share prefixes with built-ins', () => {
        // These should NOT be excluded just because they share prefixes with @media, @root, @own, @starting
        const refs = extractPredefinedStateRefs(
          '@medium & @medieval & @room & @owned & @starting-point',
        );
        expect(refs).toContain('@medium');
        expect(refs).toContain('@medieval');
        expect(refs).toContain('@room');
        expect(refs).toContain('@owned');
        expect(refs).toContain('@starting-point');
        expect(refs).toHaveLength(5);
      });

      it('should not extract built-in function calls', () => {
        const refs = extractPredefinedStateRefs(
          '@media(w < 600px) & @root(theme=dark) & @own(hovered)',
        );
        expect(refs).toHaveLength(0);
      });
    });
  });

  describe('Predefined States Configuration', () => {
    beforeEach(() => {
      clearGlobalPredefinedStates();
      resetStylesGenerated();
    });

    it('should set global predefined states', () => {
      setGlobalPredefinedStates({
        '@mobile': '@media(w < 920px)',
        '@dark': '@root(theme=dark)',
      });

      const states = getGlobalPredefinedStates();
      expect(states['@mobile']).toBe('@media(w < 920px)');
      expect(states['@dark']).toBe('@root(theme=dark)');
    });

    it('should merge multiple calls to setGlobalPredefinedStates', () => {
      setGlobalPredefinedStates({ '@mobile': '@media(w < 920px)' });
      setGlobalPredefinedStates({ '@dark': '@root(theme=dark)' });

      const states = getGlobalPredefinedStates();
      expect(states['@mobile']).toBe('@media(w < 920px)');
      expect(states['@dark']).toBe('@root(theme=dark)');
    });
  });

  describe('extractLocalPredefinedStates', () => {
    it('should extract local predefined states from styles', () => {
      const styles = {
        '@mobile': '@media(w < 920px)',
        '@compact': 'compact',
        padding: '2x',
        fill: '#purple',
      };

      const localStates = extractLocalPredefinedStates(styles);
      expect(localStates['@mobile']).toBe('@media(w < 920px)');
      // '@compact' has a string value but isn't a valid predefined state definition
    });

    it('should ignore non-string values', () => {
      const styles = {
        '@mobile': '@media(w < 920px)',
        fill: { '': '#white', hovered: '#gray' },
      };

      const localStates = extractLocalPredefinedStates(styles);
      expect(localStates['@mobile']).toBe('@media(w < 920px)');
      expect(Object.keys(localStates)).toHaveLength(1);
    });
  });

  describe('createStateParserContext', () => {
    beforeEach(() => {
      clearGlobalPredefinedStates();
      setGlobalPredefinedStates({ '@global': '@media(w < 1400px)' });
    });

    it('should create context with both local and global states', () => {
      const styles = {
        '@local': '@media(w < 600px)',
        padding: '2x',
      };

      const ctx = createStateParserContext(styles, false);
      expect(ctx.localPredefinedStates['@local']).toBe('@media(w < 600px)');
      expect(ctx.globalPredefinedStates['@global']).toBe('@media(w < 1400px)');
      expect(ctx.isSubElement).toBe(false);
    });

    it('should set isSubElement flag', () => {
      const ctx = createStateParserContext(undefined, true);
      expect(ctx.isSubElement).toBe(true);
    });
  });
});
