import { paddingStyle } from './padding';

describe('paddingStyle', () => {
  describe('basic functionality', () => {
    it('returns empty object when no padding properties are provided', () => {
      expect(paddingStyle({})).toEqual({});
    });

    it('handles boolean true value', () => {
      const result = paddingStyle({ padding: true });
      expect(result).toEqual({
        padding: 'var(--gap)',
      });
    });

    it('handles number value', () => {
      const result = paddingStyle({ padding: 16 });
      expect(result).toEqual({
        padding: '16px',
      });
    });

    it('handles single string value', () => {
      const result = paddingStyle({ padding: '2x' });
      expect(result).toEqual({
        padding: 'calc(2 * var(--gap))',
      });
    });

    it('handles two-value string (vertical horizontal)', () => {
      const result = paddingStyle({ padding: '2x 3x' });
      expect(result).toEqual({
        padding: 'calc(2 * var(--gap)) calc(3 * var(--gap))',
      });
    });

    it('handles four-value string (top right bottom left)', () => {
      const result = paddingStyle({ padding: '1x 2x 3x 4x' });
      expect(result).toEqual({
        padding:
          'var(--gap) calc(2 * var(--gap)) calc(3 * var(--gap)) calc(4 * var(--gap))',
      });
    });
  });

  describe('directional padding', () => {
    it('handles directional padding - top only', () => {
      const result = paddingStyle({ padding: '2x top' });
      expect(result).toEqual({
        padding: 'calc(2 * var(--gap)) 0 0 0',
      });
    });

    it('handles directional padding - left and right', () => {
      const result = paddingStyle({ padding: '3x left right' });
      expect(result).toEqual({
        padding: '0 calc(3 * var(--gap))',
      });
    });

    it('handles directional padding - bottom only', () => {
      const result = paddingStyle({ padding: '1x bottom' });
      expect(result).toEqual({
        padding: '0 0 var(--gap) 0',
      });
    });
  });

  describe('paddingBlock and paddingInline', () => {
    it('handles paddingBlock (top and bottom)', () => {
      const result = paddingStyle({ paddingBlock: '2x' });
      expect(result).toEqual({
        padding: 'calc(2 * var(--gap)) 0',
      });
    });

    it('handles paddingInline (left and right)', () => {
      const result = paddingStyle({ paddingInline: '4x' });
      expect(result).toEqual({
        padding: '0 calc(4 * var(--gap))',
      });
    });

    it('handles boolean and number values for logical properties', () => {
      const result = paddingStyle({
        paddingBlock: true,
        paddingInline: 8,
      });
      expect(result).toEqual({
        padding: 'var(--gap) 8px',
      });
    });
  });

  describe('individual direction properties', () => {
    it('handles individual direction properties', () => {
      const result = paddingStyle({
        paddingTop: '1x',
        paddingRight: '2x',
        paddingBottom: '3x',
        paddingLeft: '4x',
      });
      expect(result).toEqual({
        padding:
          'var(--gap) calc(2 * var(--gap)) calc(3 * var(--gap)) calc(4 * var(--gap))',
      });
    });

    it('handles boolean and number values for individual directions', () => {
      const result = paddingStyle({
        paddingTop: true,
        paddingRight: 12,
        paddingBottom: '2x',
        paddingLeft: false,
      });
      expect(result).toEqual({
        padding: 'var(--gap) 12px calc(2 * var(--gap)) 0',
      });
    });
  });

  describe('priority system', () => {
    it('padding (low) < paddingBlock/paddingInline (medium)', () => {
      const result = paddingStyle({
        padding: '1x',
        paddingBlock: '2x',
        paddingInline: '3x',
      });
      expect(result).toEqual({
        padding: 'calc(2 * var(--gap)) calc(3 * var(--gap))',
      });
    });

    it('paddingBlock/paddingInline (medium) < individual directions (high)', () => {
      const result = paddingStyle({
        paddingBlock: '2x',
        paddingInline: '3x',
        paddingTop: '4x',
        paddingRight: '5x',
      });
      expect(result).toEqual({
        padding:
          'calc(4 * var(--gap)) calc(5 * var(--gap)) calc(2 * var(--gap)) calc(3 * var(--gap))',
      });
    });

    it('complete priority chain: padding < paddingBlock/Inline < individual', () => {
      const result = paddingStyle({
        padding: '1x',
        paddingBlock: '2x',
        paddingInline: '3x',
        paddingTop: '4x',
        paddingRight: '5x',
      });
      expect(result).toEqual({
        padding:
          'calc(4 * var(--gap)) calc(5 * var(--gap)) calc(2 * var(--gap)) calc(3 * var(--gap))',
      });
    });

    it('example from requirements: padding="1x" paddingRight="2x"', () => {
      const result = paddingStyle({
        padding: '1x',
        paddingRight: '2x',
      });
      expect(result).toEqual({
        padding: 'var(--gap) calc(2 * var(--gap)) var(--gap) var(--gap)',
      });
    });

    it('example from requirements: padding="1x" paddingBlock="2x"', () => {
      const result = paddingStyle({
        padding: '1x',
        paddingBlock: '2x',
      });
      expect(result).toEqual({
        padding: 'calc(2 * var(--gap)) var(--gap)',
      });
    });
  });

  describe('edge cases', () => {
    it('handles null and undefined values', () => {
      const result = paddingStyle({
        padding: undefined,
        paddingBlock: undefined,
        paddingTop: undefined,
      });
      expect(result).toEqual({});
    });

    it('handles empty string values', () => {
      const result = paddingStyle({
        padding: '',
        paddingBlock: '',
        paddingTop: '2x',
      });
      expect(result).toEqual({
        padding: 'calc(2 * var(--gap)) 0 0 0',
      });
    });

    it('handles zero values', () => {
      const result = paddingStyle({
        padding: 0,
        paddingTop: '1x',
      });
      expect(result).toEqual({
        padding: 'var(--gap) 0px 0px 0px',
      });
    });

    it('handles mixed types', () => {
      const result = paddingStyle({
        padding: true,
        paddingBlock: 16,
        paddingLeft: '3x',
      });
      expect(result).toEqual({
        padding: '16px var(--gap) 16px calc(3 * var(--gap))',
      });
    });
  });

  describe('directional padding with priority', () => {
    it('respects individual directions over directional padding', () => {
      const result = paddingStyle({
        padding: '2x top bottom',
        paddingTop: '5x',
      });
      expect(result).toEqual({
        padding: 'calc(5 * var(--gap)) 0 calc(2 * var(--gap)) 0',
      });
    });

    it('combines directional padding with logical properties', () => {
      const result = paddingStyle({
        padding: '1x top',
        paddingInline: '3x',
      });
      expect(result).toEqual({
        padding: 'var(--gap) calc(3 * var(--gap)) 0 calc(3 * var(--gap))',
      });
    });
  });

  describe('output optimization', () => {
    it('outputs single value when all sides are equal', () => {
      expect(paddingStyle({ padding: '2x' })).toEqual({
        padding: 'calc(2 * var(--gap))',
      });
      expect(paddingStyle({ padding: 16 })).toEqual({
        padding: '16px',
      });
    });

    it('outputs two values when vertical and horizontal are equal', () => {
      expect(paddingStyle({ padding: '1x 2x' })).toEqual({
        padding: 'var(--gap) calc(2 * var(--gap))',
      });
      expect(paddingStyle({ paddingBlock: '1x', paddingInline: '2x' })).toEqual(
        {
          padding: 'var(--gap) calc(2 * var(--gap))',
        },
      );
    });

    it('outputs four values when three values differ', () => {
      expect(paddingStyle({ padding: '1x 2x 3x' })).toEqual({
        padding:
          'var(--gap) calc(2 * var(--gap)) calc(3 * var(--gap)) calc(2 * var(--gap))',
      });
    });
  });
});
