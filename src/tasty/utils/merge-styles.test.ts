import { Styles } from '../styles/types';

import { mergeStyles } from './merge-styles';

describe('mergeStyles', () => {
  describe('basic merging (existing behavior)', () => {
    it('should merge flat styles', () => {
      const result = mergeStyles(
        { fill: '#white', padding: '2x' },
        { fill: '#blue', radius: '1r' },
      );
      expect(result).toEqual({
        fill: '#blue',
        padding: '2x',
        radius: '1r',
      });
    });

    it('should handle undefined/null inputs', () => {
      expect(mergeStyles(undefined, { fill: '#blue' })).toEqual({
        fill: '#blue',
      });
      expect(mergeStyles({ fill: '#blue' }, undefined)).toEqual({
        fill: '#blue',
      });
      expect(mergeStyles(null, { fill: '#blue' })).toEqual({
        fill: '#blue',
      });
    });

    it('should merge multiple style objects', () => {
      const result = mergeStyles(
        { fill: '#white' },
        { padding: '2x' },
        { radius: '1r' },
      );
      expect(result).toEqual({
        fill: '#white',
        padding: '2x',
        radius: '1r',
      });
    });

    it('should deep merge sub-element styles', () => {
      const result = mergeStyles(
        { Title: { preset: 'h3', color: '#dark' } } as Styles,
        { Title: { color: '#blue' } } as Styles,
      );
      expect(result).toEqual({
        Title: { preset: 'h3', color: '#blue' },
      });
    });
  });

  describe('sub-element null/undefined/false semantics', () => {
    it('should keep parent sub-element when child is undefined', () => {
      const result = mergeStyles(
        { Title: { preset: 'h3' } } as Styles,
        { Title: undefined } as Styles,
      );
      expect(result).toEqual({
        Title: { preset: 'h3' },
      });
    });

    it('should remove sub-element when child is null (recipe fills in)', () => {
      const result = mergeStyles(
        { Title: { preset: 'h3' } } as Styles,
        { Title: null } as Styles,
      );
      expect(result.Title).toBeUndefined();
      expect('Title' in result).toBe(false);
    });

    it('should delete sub-element when child is false', () => {
      const result = mergeStyles(
        { Title: { preset: 'h3' } } as Styles,
        { Title: false } as Styles,
      );
      expect(result.Title).toBeUndefined();
      expect('Title' in result).toBe(false);
    });
  });

  describe('regular property null/false semantics', () => {
    it('should remove property when child is null', () => {
      const result = mergeStyles({ fill: '#white', padding: '2x' }, {
        fill: null,
      } as Styles);
      expect(result.padding).toBe('2x');
      expect('fill' in result).toBe(false);
    });

    it('should NOT remove property when child is undefined', () => {
      const result = mergeStyles({ fill: '#white', padding: '2x' }, {
        fill: undefined,
      } as Styles);
      expect(result.fill).toBe('#white');
      expect(result.padding).toBe('2x');
    });

    it('should keep false as tombstone value', () => {
      const result = mergeStyles({ fill: '#white' }, { fill: false } as Styles);
      expect(result.fill).toBe(false);
    });
  });

  describe('extend mode — state map without default key', () => {
    const parentStyles: Styles = {
      fill: {
        '': '#white #primary',
        hovered: '#white #primary-text',
        pressed: '#white #primary',
        disabled: '#white #primary-disabled',
      },
    };

    it('should preserve parent states and append new states', () => {
      const result = mergeStyles(parentStyles, {
        fill: {
          'custom-state': '#custom',
        },
      } as Styles);

      const keys = Object.keys(result.fill as object);
      expect(keys).toEqual([
        '',
        'hovered',
        'pressed',
        'disabled',
        'custom-state',
      ]);
      expect((result.fill as any)['']).toBe('#white #primary');
      expect((result.fill as any).hovered).toBe('#white #primary-text');
      expect((result.fill as any).pressed).toBe('#white #primary');
      expect((result.fill as any).disabled).toBe('#white #primary-disabled');
      expect((result.fill as any)['custom-state']).toBe('#custom');
    });

    it('should override an existing state in place', () => {
      const result = mergeStyles(parentStyles, {
        fill: {
          disabled: '#gray.20',
        },
      } as Styles);

      const keys = Object.keys(result.fill as object);
      expect(keys).toEqual(['', 'hovered', 'pressed', 'disabled']);
      expect((result.fill as any).disabled).toBe('#gray.20');
      expect((result.fill as any)['']).toBe('#white #primary');
    });

    it('should remove a state with null', () => {
      const result = mergeStyles(parentStyles, {
        fill: {
          pressed: null,
        },
      } as Styles);

      const keys = Object.keys(result.fill as object);
      expect(keys).toEqual(['', 'hovered', 'disabled']);
      expect((result.fill as any).pressed).toBeUndefined();
    });

    it('should normalize plain string parent to state map', () => {
      const result = mergeStyles({ fill: '#purple' }, {
        fill: {
          hovered: '#blue',
        },
      } as Styles);

      expect(result.fill).toEqual({
        '': '#purple',
        hovered: '#blue',
      });
    });

    it('should handle boolean parent value', () => {
      const result = mergeStyles(
        { fill: true } as Styles,
        {
          fill: {
            hovered: '#blue',
          },
        } as Styles,
      );

      expect(result.fill).toEqual({
        '': true,
        hovered: '#blue',
      });
    });

    it('should handle false parent value (no parent to extend)', () => {
      const result = mergeStyles(
        { fill: false } as Styles,
        {
          fill: {
            hovered: '#blue',
          },
        } as Styles,
      );

      expect(result.fill).toEqual({
        hovered: '#blue',
      });
    });

    it('should handle number parent value', () => {
      const result = mergeStyles(
        { opacity: 1 } as Styles,
        {
          opacity: {
            hovered: 0.8,
          },
        } as Styles,
      );

      expect(result.opacity).toEqual({
        '': 1,
        hovered: 0.8,
      });
    });

    it('should handle empty parent state map', () => {
      const result = mergeStyles(
        { fill: {} } as Styles,
        {
          fill: {
            hovered: '#blue',
          },
        } as Styles,
      );

      expect(result.fill).toEqual({ hovered: '#blue' });
    });
  });

  describe('replace mode — state map with default key', () => {
    const parentStyles: Styles = {
      fill: {
        '': '#white #primary',
        hovered: '#white #primary-text',
        pressed: '#white #primary',
        disabled: '#white #primary-disabled',
      },
    };

    it('should replace all parent states', () => {
      const result = mergeStyles(parentStyles, {
        fill: {
          '': '#red',
          hovered: '#blue',
        },
      } as Styles);

      const keys = Object.keys(result.fill as object);
      expect(keys).toEqual(['', 'hovered']);
      expect((result.fill as any)['']).toBe('#red');
      expect((result.fill as any).hovered).toBe('#blue');
    });

    it('should cherry-pick parent states with @inherit', () => {
      const result = mergeStyles(parentStyles, {
        fill: {
          '': '#red',
          hovered: '#blue',
          disabled: '@inherit',
        },
      } as Styles);

      const keys = Object.keys(result.fill as object);
      expect(keys).toEqual(['', 'hovered', 'disabled']);
      expect((result.fill as any)['']).toBe('#red');
      expect((result.fill as any).hovered).toBe('#blue');
      expect((result.fill as any).disabled).toBe('#white #primary-disabled');
    });

    it('should strip null entries', () => {
      const result = mergeStyles(parentStyles, {
        fill: {
          '': '#red',
          hovered: '#blue',
          pressed: null,
        },
      } as Styles);

      const keys = Object.keys(result.fill as object);
      expect(keys).toEqual(['', 'hovered']);
    });

    it('should skip @inherit for non-existent parent key', () => {
      const result = mergeStyles(parentStyles, {
        fill: {
          '': '#red',
          nonexistent: '@inherit',
        },
      } as Styles);

      const keys = Object.keys(result.fill as object);
      expect(keys).toEqual(['']);
      expect((result.fill as any).nonexistent).toBeUndefined();
    });

    it('should work when parent has no value for the property', () => {
      const result = mergeStyles({ padding: '2x' }, {
        fill: {
          '': '#white',
          hovered: '#blue',
        },
      } as Styles);

      expect(result.fill).toEqual({
        '': '#white',
        hovered: '#blue',
      });
    });
  });

  describe('@inherit — state repositioning (extend mode)', () => {
    const parentStyles: Styles = {
      fill: {
        '': '#white #primary',
        hovered: '#white #primary-text',
        pressed: '#white #primary',
        disabled: '#white #primary-disabled',
      },
    };

    it('should reposition a parent state to child order', () => {
      const result = mergeStyles(parentStyles, {
        fill: {
          'custom-state': '#custom',
          disabled: '@inherit',
        },
      } as Styles);

      const keys = Object.keys(result.fill as object);
      expect(keys).toEqual([
        '',
        'hovered',
        'pressed',
        'custom-state',
        'disabled',
      ]);
      expect((result.fill as any).disabled).toBe('#white #primary-disabled');
      expect((result.fill as any)['custom-state']).toBe('#custom');
    });

    it('should reposition multiple states', () => {
      const result = mergeStyles(parentStyles, {
        fill: {
          'custom-state': '#custom',
          pressed: '@inherit',
          disabled: '@inherit',
        },
      } as Styles);

      const keys = Object.keys(result.fill as object);
      expect(keys).toEqual([
        '',
        'hovered',
        'custom-state',
        'pressed',
        'disabled',
      ]);
    });

    it('should preserve child declaration order for interleaved new and @inherit entries', () => {
      const result = mergeStyles(parentStyles, {
        fill: {
          newA: '#a',
          pressed: '@inherit',
          newB: '#b',
          disabled: '@inherit',
        },
      } as Styles);

      const keys = Object.keys(result.fill as object);
      expect(keys).toEqual([
        '',
        'hovered',
        'newA',
        'pressed',
        'newB',
        'disabled',
      ]);
    });

    it('should skip @inherit for non-existent parent key', () => {
      const result = mergeStyles(parentStyles, {
        fill: {
          nonexistent: '@inherit',
        },
      } as Styles);

      const keys = Object.keys(result.fill as object);
      expect(keys).toEqual(['', 'hovered', 'pressed', 'disabled']);
      expect((result.fill as any).nonexistent).toBeUndefined();
    });
  });

  describe('extend mode within sub-elements', () => {
    it('should extend state maps inside sub-element blocks', () => {
      const result = mergeStyles(
        {
          Icon: {
            color: {
              '': '#gray',
              disabled: '#light-gray',
            },
          },
        } as Styles,
        {
          Icon: {
            color: {
              loading: '#dark-gray',
            },
          },
        } as Styles,
      );

      const iconStyles = result.Icon as any;
      expect(iconStyles.color).toEqual({
        '': '#gray',
        disabled: '#light-gray',
        loading: '#dark-gray',
      });
    });

    it('should resolve @inherit inside a new sub-element (no parent property)', () => {
      const result = mergeStyles({ fill: '#white' }, {
        Icon: {
          color: {
            hovered: '#blue',
          },
        },
      } as Styles);

      const iconStyles = result.Icon as any;
      expect(iconStyles.color).toEqual({ hovered: '#blue' });
    });
  });

  describe('combined extend + @inherit + null', () => {
    it('should handle extend + remove + reposition together', () => {
      const parentStyles: Styles = {
        fill: {
          '': '#white',
          hovered: '#blue',
          pressed: '#green',
          focused: '#purple',
          disabled: '#gray',
        },
      };

      const result = mergeStyles(parentStyles, {
        fill: {
          pressed: null,
          custom: '#custom',
          disabled: '@inherit',
        },
      } as Styles);

      const keys = Object.keys(result.fill as object);
      expect(keys).toEqual(['', 'hovered', 'focused', 'custom', 'disabled']);
      expect((result.fill as any).pressed).toBeUndefined();
      expect((result.fill as any).disabled).toBe('#gray');
      expect((result.fill as any).custom).toBe('#custom');
    });
  });

  describe('chaining multiple merges', () => {
    it('should support multi-level extension', () => {
      const base: Styles = {
        fill: {
          '': '#white',
          hovered: '#blue',
        },
      };
      const level1: Styles = {
        fill: {
          pressed: '#green',
        },
      } as Styles;
      const level2: Styles = {
        fill: {
          disabled: '#gray',
        },
      } as Styles;

      const result = mergeStyles(base, level1, level2);

      expect(Object.keys(result.fill as object)).toEqual([
        '',
        'hovered',
        'pressed',
        'disabled',
      ]);
    });

    it('should support multi-level @inherit chaining', () => {
      const base: Styles = {
        fill: {
          '': '#white',
          hovered: '#blue',
          disabled: '#gray',
        },
      };
      const level1: Styles = {
        fill: {
          pressed: '#green',
          disabled: '@inherit',
        },
      } as Styles;
      const level2: Styles = {
        fill: {
          loading: '#yellow',
          disabled: '@inherit',
        },
      } as Styles;

      const result = mergeStyles(base, level1, level2);

      const keys = Object.keys(result.fill as object);
      expect(keys).toEqual(['', 'hovered', 'pressed', 'loading', 'disabled']);
      expect((result.fill as any).disabled).toBe('#gray');
    });
  });

  describe('extend mode with no parent value', () => {
    it('should strip @inherit when no parent exists', () => {
      const result = mergeStyles({ padding: '2x' }, {
        fill: {
          hovered: '#blue',
          disabled: '@inherit',
        },
      } as Styles);

      expect(result.fill).toEqual({ hovered: '#blue' });
      expect((result.fill as any).disabled).toBeUndefined();
    });

    it('should strip null entries when no parent exists', () => {
      const result = mergeStyles({}, {
        fill: {
          hovered: '#blue',
          pressed: null,
        },
      } as Styles);

      expect(result.fill).toEqual({ hovered: '#blue' });
    });

    it('should handle extend with all entries removed via null', () => {
      const parentStyles: Styles = {
        fill: {
          '': '#white',
          hovered: '#blue',
        },
      };

      const result = mergeStyles(parentStyles, {
        fill: {
          '': null,
          hovered: null,
        },
      } as Styles);

      expect(result.fill).toEqual({});
    });
  });

  describe('replace mode within sub-elements', () => {
    it('should replace state maps inside sub-element blocks', () => {
      const result = mergeStyles(
        {
          Icon: {
            color: {
              '': '#gray',
              disabled: '#light-gray',
              hovered: '#dark-gray',
            },
          },
        } as Styles,
        {
          Icon: {
            color: {
              '': '#blue',
              disabled: '@inherit',
            },
          },
        } as Styles,
      );

      const iconStyles = result.Icon as any;
      expect(iconStyles.color).toEqual({
        '': '#blue',
        disabled: '#light-gray',
      });
    });
  });
});
