import { paddingStyle } from './padding';

describe('paddingStyle', () => {
  describe('basic functionality', () => {
    it('returns empty object when no padding properties are provided', () => {
      expect(paddingStyle({})).toEqual({});
    });

    it('handles boolean true value', () => {
      const result = paddingStyle({ padding: true });
      expect(result).toEqual({
        'padding-top': 'var(--gap)',
        'padding-right': 'var(--gap)',
        'padding-bottom': 'var(--gap)',
        'padding-left': 'var(--gap)',
      });
    });

    it('handles number value', () => {
      const result = paddingStyle({ padding: 16 });
      expect(result).toEqual({
        'padding-top': '16px',
        'padding-right': '16px',
        'padding-bottom': '16px',
        'padding-left': '16px',
      });
    });

    it('handles single string value', () => {
      const result = paddingStyle({ padding: '2x' });
      expect(result).toEqual({
        'padding-top': 'calc(2 * var(--gap))',
        'padding-right': 'calc(2 * var(--gap))',
        'padding-bottom': 'calc(2 * var(--gap))',
        'padding-left': 'calc(2 * var(--gap))',
      });
    });

    it('handles two-value string (vertical horizontal)', () => {
      const result = paddingStyle({ padding: '2x 3x' });
      expect(result).toEqual({
        'padding-top': 'calc(2 * var(--gap))',
        'padding-right': 'calc(3 * var(--gap))',
        'padding-bottom': 'calc(2 * var(--gap))',
        'padding-left': 'calc(3 * var(--gap))',
      });
    });

    it('handles four-value string (top right bottom left)', () => {
      const result = paddingStyle({ padding: '1x 2x 3x 4x' });
      expect(result).toEqual({
        'padding-top': 'var(--gap)',
        'padding-right': 'calc(2 * var(--gap))',
        'padding-bottom': 'calc(3 * var(--gap))',
        'padding-left': 'calc(4 * var(--gap))',
      });
    });
  });

  describe('directional padding', () => {
    it('handles directional padding - top only', () => {
      const result = paddingStyle({ padding: '2x top' });
      expect(result).toEqual({
        'padding-top': 'calc(2 * var(--gap))',
        'padding-right': '0',
        'padding-bottom': '0',
        'padding-left': '0',
      });
    });

    it('handles directional padding - left and right', () => {
      const result = paddingStyle({ padding: '3x left right' });
      expect(result).toEqual({
        'padding-top': '0',
        'padding-right': 'calc(3 * var(--gap))',
        'padding-bottom': '0',
        'padding-left': 'calc(3 * var(--gap))',
      });
    });

    it('handles directional padding - bottom only', () => {
      const result = paddingStyle({ padding: '1x bottom' });
      expect(result).toEqual({
        'padding-top': '0',
        'padding-right': '0',
        'padding-bottom': 'var(--gap)',
        'padding-left': '0',
      });
    });
  });

  describe('paddingBlock and paddingInline', () => {
    it('handles paddingBlock (top and bottom)', () => {
      const result = paddingStyle({ paddingBlock: '2x' });
      expect(result).toEqual({
        'padding-top': 'calc(2 * var(--gap))',
        'padding-right': '0',
        'padding-bottom': 'calc(2 * var(--gap))',
        'padding-left': '0',
      });
    });

    it('handles paddingBlock with two values', () => {
      const result = paddingStyle({ paddingBlock: '1x 3x' });
      expect(result).toEqual({
        'padding-top': 'var(--gap)',
        'padding-right': '0',
        'padding-bottom': 'calc(3 * var(--gap))',
        'padding-left': '0',
      });
    });

    it('handles paddingInline (left and right)', () => {
      const result = paddingStyle({ paddingInline: '4x' });
      expect(result).toEqual({
        'padding-top': '0',
        'padding-right': 'calc(4 * var(--gap))',
        'padding-bottom': '0',
        'padding-left': 'calc(4 * var(--gap))',
      });
    });

    it('handles paddingInline with two values', () => {
      const result = paddingStyle({ paddingInline: '2x 5x' });
      expect(result).toEqual({
        'padding-top': '0',
        'padding-right': 'calc(5 * var(--gap))',
        'padding-bottom': '0',
        'padding-left': 'calc(2 * var(--gap))',
      });
    });

    it('handles boolean and number values for logical properties', () => {
      const result = paddingStyle({
        paddingBlock: true,
        paddingInline: 8,
      });
      expect(result).toEqual({
        'padding-top': 'var(--gap)',
        'padding-bottom': 'var(--gap)',
        'padding-left': '8px',
        'padding-right': '8px',
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
        'padding-top': 'var(--gap)',
        'padding-right': 'calc(2 * var(--gap))',
        'padding-bottom': 'calc(3 * var(--gap))',
        'padding-left': 'calc(4 * var(--gap))',
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
        'padding-top': 'var(--gap)',
        'padding-right': '12px',
        'padding-bottom': 'calc(2 * var(--gap))',
        'padding-left': '0',
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
        'padding-top': 'calc(2 * var(--gap))', // overridden by paddingBlock
        'padding-right': 'calc(3 * var(--gap))', // overridden by paddingInline
        'padding-bottom': 'calc(2 * var(--gap))', // overridden by paddingBlock
        'padding-left': 'calc(3 * var(--gap))', // overridden by paddingInline
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
        'padding-top': 'calc(4 * var(--gap))', // overridden by paddingTop
        'padding-right': 'calc(5 * var(--gap))', // overridden by paddingRight
        'padding-bottom': 'calc(2 * var(--gap))', // from paddingBlock
        'padding-left': 'calc(3 * var(--gap))', // from paddingInline
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
        'padding-top': 'calc(4 * var(--gap))', // highest: individual direction
        'padding-right': 'calc(5 * var(--gap))', // highest: individual direction
        'padding-bottom': 'calc(2 * var(--gap))', // medium: paddingBlock
        'padding-left': 'calc(3 * var(--gap))', // medium: paddingInline
      });
    });

    it('example from requirements: padding="1x" paddingRight="2x"', () => {
      const result = paddingStyle({
        padding: '1x',
        paddingRight: '2x',
      });
      expect(result).toEqual({
        'padding-top': 'var(--gap)',
        'padding-right': 'calc(2 * var(--gap))', // overridden by paddingRight
        'padding-bottom': 'var(--gap)',
        'padding-left': 'var(--gap)',
      });
    });

    it('example from requirements: padding="1x" paddingBlock="2x"', () => {
      const result = paddingStyle({
        padding: '1x',
        paddingBlock: '2x',
      });
      expect(result).toEqual({
        'padding-top': 'calc(2 * var(--gap))', // overridden by paddingBlock
        'padding-right': 'var(--gap)',
        'padding-bottom': 'calc(2 * var(--gap))', // overridden by paddingBlock
        'padding-left': 'var(--gap)',
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
        'padding-top': 'calc(2 * var(--gap))',
        'padding-right': '0',
        'padding-bottom': '0',
        'padding-left': '0',
      });
    });

    it('handles zero values', () => {
      const result = paddingStyle({
        padding: 0,
        paddingTop: '1x',
      });
      expect(result).toEqual({
        'padding-top': 'var(--gap)', // overridden by paddingTop
        'padding-right': '0px',
        'padding-bottom': '0px',
        'padding-left': '0px',
      });
    });

    it('handles mixed types', () => {
      const result = paddingStyle({
        padding: true,
        paddingBlock: 16,
        paddingLeft: '3x',
      });
      expect(result).toEqual({
        'padding-top': '16px', // overridden by paddingBlock
        'padding-right': 'var(--gap)', // from padding
        'padding-bottom': '16px', // overridden by paddingBlock
        'padding-left': 'calc(3 * var(--gap))', // overridden by paddingLeft
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
        'padding-top': 'calc(5 * var(--gap))', // overridden by paddingTop
        'padding-right': '0',
        'padding-bottom': 'calc(2 * var(--gap))', // from directional padding
        'padding-left': '0',
      });
    });

    it('combines directional padding with logical properties', () => {
      const result = paddingStyle({
        padding: '1x top',
        paddingInline: '3x',
      });
      expect(result).toEqual({
        'padding-top': 'var(--gap)', // from directional padding
        'padding-right': 'calc(3 * var(--gap))', // from paddingInline
        'padding-bottom': '0',
        'padding-left': 'calc(3 * var(--gap))', // from paddingInline
      });
    });
  });
});
