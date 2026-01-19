// @ts-nocheck
import { displayStyle } from './display';

describe('displayStyle', () => {
  describe('basic display and hide', () => {
    it('returns undefined when no props provided', () => {
      expect(displayStyle({})).toBeUndefined();
    });

    it('returns display value when provided', () => {
      expect(displayStyle({ display: 'flex' })).toEqual({ display: 'flex' });
    });

    it('returns display: none when hide is true', () => {
      expect(displayStyle({ hide: true })).toEqual({ display: 'none' });
    });

    it('hide takes precedence over display', () => {
      expect(displayStyle({ display: 'flex', hide: true })).toEqual({
        display: 'none',
      });
    });
  });

  describe('overflow and whiteSpace pass-through', () => {
    it('passes through overflow when provided', () => {
      expect(displayStyle({ overflow: 'auto' })).toEqual({ overflow: 'auto' });
    });

    it('passes through whiteSpace when provided', () => {
      expect(displayStyle({ whiteSpace: 'pre-wrap' })).toEqual({
        'white-space': 'pre-wrap',
      });
    });

    it('combines display, overflow, and whiteSpace', () => {
      expect(
        displayStyle({
          display: 'block',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }),
      ).toEqual({
        display: 'block',
        overflow: 'hidden',
        'white-space': 'nowrap',
      });
    });
  });

  describe('textOverflow - single line ellipsis', () => {
    it('handles ellipsis modifier', () => {
      const result = displayStyle({ textOverflow: 'ellipsis' });
      expect(result).toEqual({
        overflow: 'hidden',
        'text-overflow': 'ellipsis',
        'white-space': 'nowrap',
      });
    });

    it('handles clip modifier', () => {
      const result = displayStyle({ textOverflow: 'clip' });
      expect(result).toEqual({
        overflow: 'hidden',
        'text-overflow': 'clip',
        'white-space': 'nowrap',
      });
    });
  });

  describe('textOverflow - multi-line clamping', () => {
    it('handles ellipsis with line count (ellipsis / 2)', () => {
      const result = displayStyle({ textOverflow: 'ellipsis / 2' });
      expect(result).toEqual({
        overflow: 'hidden',
        'text-overflow': 'ellipsis',
        display: '-webkit-box',
        '-webkit-box-orient': 'vertical',
        '-webkit-line-clamp': 2,
        'line-clamp': 2,
      });
    });

    it('handles ellipsis with 3 lines', () => {
      const result = displayStyle({ textOverflow: 'ellipsis / 3' });
      expect(result).toEqual({
        overflow: 'hidden',
        'text-overflow': 'ellipsis',
        display: '-webkit-box',
        '-webkit-box-orient': 'vertical',
        '-webkit-line-clamp': 3,
        'line-clamp': 3,
      });
    });

    it('handles clip with line count', () => {
      const result = displayStyle({ textOverflow: 'clip / 2' });
      expect(result).toEqual({
        overflow: 'hidden',
        'text-overflow': 'clip',
        display: '-webkit-box',
        '-webkit-box-orient': 'vertical',
        '-webkit-line-clamp': 2,
        'line-clamp': 2,
      });
    });
  });

  describe('textOverflow - reset', () => {
    it('handles boolean true as reset to initial', () => {
      const result = displayStyle({ textOverflow: true });
      expect(result).toEqual({ 'text-overflow': 'initial' });
    });

    it('handles "initial" string as reset', () => {
      const result = displayStyle({ textOverflow: 'initial' });
      expect(result).toEqual({ 'text-overflow': 'initial' });
    });

    it('handles false as no-op', () => {
      const result = displayStyle({ textOverflow: false });
      expect(result).toBeUndefined();
    });
  });

  describe('textOverflow - priority over user values', () => {
    it('textOverflow overflow takes precedence over user overflow', () => {
      const result = displayStyle({
        textOverflow: 'ellipsis',
        overflow: 'auto',
      });
      expect(result!['overflow']).toBe('hidden');
    });

    it('textOverflow white-space takes precedence over user whiteSpace', () => {
      const result = displayStyle({
        textOverflow: 'ellipsis',
        whiteSpace: 'pre-wrap',
      });
      expect(result!['white-space']).toBe('nowrap');
    });

    it('multi-line textOverflow display takes precedence over user display', () => {
      const result = displayStyle({
        textOverflow: 'ellipsis / 2',
        display: 'flex',
      });
      expect(result!['display']).toBe('-webkit-box');
    });

    it('hide still takes precedence over textOverflow display', () => {
      const result = displayStyle({
        textOverflow: 'ellipsis / 2',
        hide: true,
      });
      expect(result!['display']).toBe('none');
    });
  });

  describe('textOverflow - user values preserved when not overridden', () => {
    it('preserves user display with single-line textOverflow', () => {
      const result = displayStyle({
        textOverflow: 'ellipsis',
        display: 'flex',
      });
      expect(result!['display']).toBe('flex');
    });

    it('preserves user overflow when textOverflow is reset', () => {
      const result = displayStyle({
        textOverflow: true,
        overflow: 'auto',
      });
      expect(result!['overflow']).toBe('auto');
    });
  });
});
