import { marginStyle } from './margin';

describe('marginStyle', () => {
  describe('basic functionality', () => {
    it('returns empty object when no margin properties are provided', () => {
      expect(marginStyle({})).toEqual({});
    });

    it('handles boolean true value', () => {
      const result = marginStyle({ margin: true });
      expect(result).toEqual({
        'margin-top': 'var(--gap)',
        'margin-right': 'var(--gap)',
        'margin-bottom': 'var(--gap)',
        'margin-left': 'var(--gap)',
      });
    });

    it('handles number value', () => {
      const result = marginStyle({ margin: 16 });
      expect(result).toEqual({
        'margin-top': '16px',
        'margin-right': '16px',
        'margin-bottom': '16px',
        'margin-left': '16px',
      });
    });

    it('handles single string value', () => {
      const result = marginStyle({ margin: '2x' });
      expect(result).toEqual({
        'margin-top': 'calc(2 * var(--gap))',
        'margin-right': 'calc(2 * var(--gap))',
        'margin-bottom': 'calc(2 * var(--gap))',
        'margin-left': 'calc(2 * var(--gap))',
      });
    });

    it('handles two-value string (vertical horizontal)', () => {
      const result = marginStyle({ margin: '2x 3x' });
      expect(result).toEqual({
        'margin-top': 'calc(2 * var(--gap))',
        'margin-right': 'calc(3 * var(--gap))',
        'margin-bottom': 'calc(2 * var(--gap))',
        'margin-left': 'calc(3 * var(--gap))',
      });
    });

    it('handles four-value string (top right bottom left)', () => {
      const result = marginStyle({ margin: '1x 2x 3x 4x' });
      expect(result).toEqual({
        'margin-top': 'var(--gap)',
        'margin-right': 'calc(2 * var(--gap))',
        'margin-bottom': 'calc(3 * var(--gap))',
        'margin-left': 'calc(4 * var(--gap))',
      });
    });
  });

  describe('directional margin', () => {
    it('handles directional margin - top only', () => {
      const result = marginStyle({ margin: '2x top' });
      expect(result).toEqual({
        'margin-top': 'calc(2 * var(--gap))',
      });
    });

    it('handles directional margin - left and right', () => {
      const result = marginStyle({ margin: '3x left right' });
      expect(result).toEqual({
        'margin-left': 'calc(3 * var(--gap))',
        'margin-right': 'calc(3 * var(--gap))',
      });
    });

    it('handles directional margin - bottom only', () => {
      const result = marginStyle({ margin: '1x bottom' });
      expect(result).toEqual({
        'margin-bottom': 'var(--gap)',
      });
    });
  });

  describe('marginBlock and marginInline', () => {
    it('handles marginBlock (top and bottom)', () => {
      const result = marginStyle({ marginBlock: '2x' });
      expect(result).toEqual({
        'margin-top': 'calc(2 * var(--gap))',
        'margin-bottom': 'calc(2 * var(--gap))',
      });
    });

    it('handles marginBlock with two values', () => {
      const result = marginStyle({ marginBlock: '1x 3x' });
      expect(result).toEqual({
        'margin-top': 'var(--gap)',
        'margin-bottom': 'calc(3 * var(--gap))',
      });
    });

    it('handles marginInline (left and right)', () => {
      const result = marginStyle({ marginInline: '4x' });
      expect(result).toEqual({
        'margin-left': 'calc(4 * var(--gap))',
        'margin-right': 'calc(4 * var(--gap))',
      });
    });

    it('handles marginInline with two values', () => {
      const result = marginStyle({ marginInline: '2x 5x' });
      expect(result).toEqual({
        'margin-left': 'calc(2 * var(--gap))',
        'margin-right': 'calc(5 * var(--gap))',
      });
    });

    it('handles boolean and number values for logical properties', () => {
      const result = marginStyle({
        marginBlock: true,
        marginInline: 8,
      });
      expect(result).toEqual({
        'margin-top': 'var(--gap)',
        'margin-bottom': 'var(--gap)',
        'margin-left': '8px',
        'margin-right': '8px',
      });
    });
  });

  describe('individual direction properties', () => {
    it('handles individual direction properties', () => {
      const result = marginStyle({
        marginTop: '1x',
        marginRight: '2x',
        marginBottom: '3x',
        marginLeft: '4x',
      });
      expect(result).toEqual({
        'margin-top': 'var(--gap)',
        'margin-right': 'calc(2 * var(--gap))',
        'margin-bottom': 'calc(3 * var(--gap))',
        'margin-left': 'calc(4 * var(--gap))',
      });
    });

    it('handles boolean and number values for individual directions', () => {
      const result = marginStyle({
        marginTop: true,
        marginRight: 12,
        marginBottom: '2x',
        marginLeft: false,
      });
      expect(result).toEqual({
        'margin-top': 'var(--gap)',
        'margin-right': '12px',
        'margin-bottom': 'calc(2 * var(--gap))',
      });
    });
  });

  describe('priority system', () => {
    it('margin (low) < marginBlock/marginInline (medium)', () => {
      const result = marginStyle({
        margin: '1x',
        marginBlock: '2x',
        marginInline: '3x',
      });
      expect(result).toEqual({
        'margin-top': 'calc(2 * var(--gap))', // overridden by marginBlock
        'margin-right': 'calc(3 * var(--gap))', // overridden by marginInline
        'margin-bottom': 'calc(2 * var(--gap))', // overridden by marginBlock
        'margin-left': 'calc(3 * var(--gap))', // overridden by marginInline
      });
    });

    it('marginBlock/marginInline (medium) < individual directions (high)', () => {
      const result = marginStyle({
        marginBlock: '2x',
        marginInline: '3x',
        marginTop: '4x',
        marginRight: '5x',
      });
      expect(result).toEqual({
        'margin-top': 'calc(4 * var(--gap))', // overridden by marginTop
        'margin-right': 'calc(5 * var(--gap))', // overridden by marginRight
        'margin-bottom': 'calc(2 * var(--gap))', // from marginBlock
        'margin-left': 'calc(3 * var(--gap))', // from marginInline
      });
    });

    it('complete priority chain: margin < marginBlock/Inline < individual', () => {
      const result = marginStyle({
        margin: '1x',
        marginBlock: '2x',
        marginInline: '3x',
        marginTop: '4x',
        marginRight: '5x',
      });
      expect(result).toEqual({
        'margin-top': 'calc(4 * var(--gap))', // highest: individual direction
        'margin-right': 'calc(5 * var(--gap))', // highest: individual direction
        'margin-bottom': 'calc(2 * var(--gap))', // medium: marginBlock
        'margin-left': 'calc(3 * var(--gap))', // medium: marginInline
      });
    });

    it('example: margin="1x" marginRight="2x"', () => {
      const result = marginStyle({
        margin: '1x',
        marginRight: '2x',
      });
      expect(result).toEqual({
        'margin-top': 'var(--gap)',
        'margin-right': 'calc(2 * var(--gap))', // overridden by marginRight
        'margin-bottom': 'var(--gap)',
        'margin-left': 'var(--gap)',
      });
    });

    it('example: margin="1x" marginBlock="2x"', () => {
      const result = marginStyle({
        margin: '1x',
        marginBlock: '2x',
      });
      expect(result).toEqual({
        'margin-top': 'calc(2 * var(--gap))', // overridden by marginBlock
        'margin-right': 'var(--gap)',
        'margin-bottom': 'calc(2 * var(--gap))', // overridden by marginBlock
        'margin-left': 'var(--gap)',
      });
    });
  });

  describe('edge cases', () => {
    it('handles null and undefined values', () => {
      const result = marginStyle({
        margin: undefined,
        marginBlock: undefined,
        marginTop: undefined,
      });
      expect(result).toEqual({});
    });

    it('handles empty string values', () => {
      const result = marginStyle({
        margin: '',
        marginBlock: '',
        marginTop: '2x',
      });
      expect(result).toEqual({
        'margin-top': 'calc(2 * var(--gap))',
      });
    });

    it('handles zero values', () => {
      const result = marginStyle({
        margin: 0,
        marginTop: '1x',
      });
      expect(result).toEqual({
        'margin-top': 'var(--gap)', // overridden by marginTop
        'margin-right': '0px',
        'margin-bottom': '0px',
        'margin-left': '0px',
      });
    });

    it('handles mixed types', () => {
      const result = marginStyle({
        margin: true,
        marginBlock: 16,
        marginLeft: '3x',
      });
      expect(result).toEqual({
        'margin-top': '16px', // overridden by marginBlock
        'margin-right': 'var(--gap)', // from margin
        'margin-bottom': '16px', // overridden by marginBlock
        'margin-left': 'calc(3 * var(--gap))', // overridden by marginLeft
      });
    });

    it('handles negative values', () => {
      const result = marginStyle({
        margin: '-1x',
        marginTop: -8,
      });
      expect(result).toEqual({
        'margin-top': '-8px', // overridden by marginTop
        'margin-right': 'calc(-1 * var(--gap))',
        'margin-bottom': 'calc(-1 * var(--gap))',
        'margin-left': 'calc(-1 * var(--gap))',
      });
    });
  });

  describe('directional margin with priority', () => {
    it('respects individual directions over directional margin', () => {
      const result = marginStyle({
        margin: '2x top bottom',
        marginTop: '5x',
      });
      expect(result).toEqual({
        'margin-top': 'calc(5 * var(--gap))', // overridden by marginTop
        'margin-bottom': 'calc(2 * var(--gap))', // from directional margin
      });
    });

    it('combines directional margin with logical properties', () => {
      const result = marginStyle({
        margin: '1x top',
        marginInline: '3x',
      });
      expect(result).toEqual({
        'margin-top': 'var(--gap)', // from directional margin
        'margin-left': 'calc(3 * var(--gap))', // from marginInline
        'margin-right': 'calc(3 * var(--gap))', // from marginInline
      });
    });
  });

  describe('auto values', () => {
    it('handles auto values for centering', () => {
      const result = marginStyle({
        marginInline: 'auto',
      });
      expect(result).toEqual({
        'margin-left': 'auto',
        'margin-right': 'auto',
      });
    });

    it('handles mixed auto and specific values', () => {
      const result = marginStyle({
        margin: '1x auto',
      });
      expect(result).toEqual({
        'margin-top': 'var(--gap)',
        'margin-right': 'auto',
        'margin-bottom': 'var(--gap)',
        'margin-left': 'auto',
      });
    });
  });
});
