/**
 * @jest-environment jsdom
 */
import { configure, resetConfig } from '../config';
import { destroy } from '../injector';
import { Styles } from '../styles/types';

import {
  extractAnimationNamesFromStyles,
  extractLocalKeyframes,
  filterUsedKeyframes,
  hasLocalKeyframes,
  mergeKeyframes,
  replaceAnimationNames,
} from './index';

describe('Keyframes Utilities', () => {
  describe('hasLocalKeyframes', () => {
    it('should return false when no @keyframes defined', () => {
      const styles: Styles = {
        padding: '2x',
        fill: '#purple',
      };
      expect(hasLocalKeyframes(styles)).toBe(false);
    });

    it('should return true when @keyframes is defined', () => {
      const styles: Styles = {
        padding: '2x',
        '@keyframes': {
          fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        },
      };
      expect(hasLocalKeyframes(styles)).toBe(true);
    });
  });

  describe('extractLocalKeyframes', () => {
    it('should return null when no @keyframes defined', () => {
      const styles: Styles = { padding: '2x' };
      expect(extractLocalKeyframes(styles)).toBeNull();
    });

    it('should extract @keyframes from styles', () => {
      const keyframes = {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      };
      const styles: Styles = {
        padding: '2x',
        '@keyframes': keyframes,
      };
      expect(extractLocalKeyframes(styles)).toEqual(keyframes);
    });
  });

  describe('mergeKeyframes', () => {
    it('should return null when both are null', () => {
      expect(mergeKeyframes(null, null)).toBeNull();
    });

    it('should return local when global is null', () => {
      const local = {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
      };
      expect(mergeKeyframes(local, null)).toEqual(local);
    });

    it('should return global when local is null', () => {
      const global = {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
      };
      expect(mergeKeyframes(null, global)).toEqual(global);
    });

    it('should merge with local taking priority', () => {
      const local = {
        fadeIn: { from: { opacity: '0.5' }, to: { opacity: '1' } },
      };
      const global = {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { '0%': { transform: 'translateX(-100%)' } },
      };
      const result = mergeKeyframes(local, global);
      expect(result).toEqual({
        fadeIn: local.fadeIn, // Local wins
        slideIn: global.slideIn,
      });
    });
  });

  describe('extractAnimationNamesFromStyles', () => {
    it('should return empty set when no animation properties', () => {
      const styles: Styles = { padding: '2x' };
      expect(extractAnimationNamesFromStyles(styles)).toEqual(new Set());
    });

    it('should extract animation name from simple string', () => {
      const styles: Styles = { animation: 'fadeIn 300ms ease-in' };
      expect(extractAnimationNamesFromStyles(styles)).toEqual(
        new Set(['fadeIn']),
      );
    });

    it('should extract animation name from animationName property', () => {
      const styles: Styles = { animationName: 'pulse' };
      expect(extractAnimationNamesFromStyles(styles)).toEqual(
        new Set(['pulse']),
      );
    });

    it('should extract multiple animation names', () => {
      const styles: Styles = { animation: 'fadeIn 1s, slideIn 2s ease-out' };
      expect(extractAnimationNamesFromStyles(styles)).toEqual(
        new Set(['fadeIn', 'slideIn']),
      );
    });

    it('should extract from state mappings', () => {
      const styles: Styles = {
        animation: {
          '': 'fadeIn 300ms',
          hovered: 'pulse 1s infinite',
        },
      };
      expect(extractAnimationNamesFromStyles(styles)).toEqual(
        new Set(['fadeIn', 'pulse']),
      );
    });

    it('should extract from responsive arrays', () => {
      const styles: Styles = {
        animation: ['fadeIn 300ms', 'slideIn 500ms'],
      };
      expect(extractAnimationNamesFromStyles(styles)).toEqual(
        new Set(['fadeIn', 'slideIn']),
      );
    });

    it('should extract from nested selectors', () => {
      const styles: Styles = {
        Label: {
          animation: 'fadeIn 300ms',
        },
      };
      expect(extractAnimationNamesFromStyles(styles)).toEqual(
        new Set(['fadeIn']),
      );
    });

    it('should not include CSS keywords', () => {
      const styles: Styles = { animation: 'none' };
      expect(extractAnimationNamesFromStyles(styles)).toEqual(new Set());
    });

    it('should handle complex animation shorthand', () => {
      // animation: name duration timing-function delay iteration-count direction fill-mode play-state
      const styles: Styles = {
        animation: 'bounce 1s ease-in-out 0.5s infinite alternate forwards',
      };
      expect(extractAnimationNamesFromStyles(styles)).toEqual(
        new Set(['bounce']),
      );
    });
  });

  describe('replaceAnimationNames', () => {
    it('should return original when nameMap is empty', () => {
      const declarations = 'animation: fadeIn 300ms;';
      const nameMap = new Map<string, string>();
      expect(replaceAnimationNames(declarations, nameMap)).toBe(declarations);
    });

    it('should return original when no animation property', () => {
      const declarations = 'padding: 10px; color: red;';
      const nameMap = new Map([['fadeIn', 'k0']]);
      expect(replaceAnimationNames(declarations, nameMap)).toBe(declarations);
    });

    it('should replace animation name', () => {
      const declarations = 'animation: fadeIn 300ms ease-in;';
      const nameMap = new Map([['fadeIn', 'k0']]);
      expect(replaceAnimationNames(declarations, nameMap)).toBe(
        'animation: k0 300ms ease-in;',
      );
    });

    it('should replace animation-name', () => {
      const declarations = 'animation-name: pulse;';
      const nameMap = new Map([['pulse', 'k1']]);
      expect(replaceAnimationNames(declarations, nameMap)).toBe(
        'animation-name: k1;',
      );
    });

    it('should replace multiple animation names', () => {
      const declarations = 'animation: fadeIn 1s, slideIn 2s;';
      const nameMap = new Map([
        ['fadeIn', 'k0'],
        ['slideIn', 'k1'],
      ]);
      expect(replaceAnimationNames(declarations, nameMap)).toBe(
        'animation: k0 1s, k1 2s;',
      );
    });

    it('should not replace when names are the same', () => {
      const declarations = 'animation: fadeIn 300ms;';
      const nameMap = new Map([['fadeIn', 'fadeIn']]);
      // Should return original (no modification needed)
      expect(replaceAnimationNames(declarations, nameMap)).toBe(declarations);
    });

    it('should preserve other declarations', () => {
      const declarations = 'padding: 10px; animation: fadeIn 1s; color: red;';
      const nameMap = new Map([['fadeIn', 'k0']]);
      expect(replaceAnimationNames(declarations, nameMap)).toBe(
        'padding: 10px; animation: k0 1s; color: red;',
      );
    });
  });

  describe('filterUsedKeyframes', () => {
    it('should return null when keyframes is null', () => {
      expect(filterUsedKeyframes(null, new Set(['fadeIn']))).toBeNull();
    });

    it('should return null when usedNames is empty', () => {
      const keyframes = { fadeIn: { from: { opacity: '0' } } };
      expect(filterUsedKeyframes(keyframes, new Set())).toBeNull();
    });

    it('should return null when no matching keyframes', () => {
      const keyframes = { fadeIn: { from: { opacity: '0' } } };
      expect(filterUsedKeyframes(keyframes, new Set(['slideIn']))).toBeNull();
    });

    it('should filter to only used keyframes', () => {
      const keyframes = {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { '0%': { transform: 'translateX(-100%)' } },
        pulse: { '0%, 100%': { transform: 'scale(1)' } },
      };
      const result = filterUsedKeyframes(
        keyframes,
        new Set(['fadeIn', 'pulse']),
      );
      expect(result).toEqual({
        fadeIn: keyframes.fadeIn,
        pulse: keyframes.pulse,
      });
    });
  });
});

describe('Global Keyframes Configuration', () => {
  beforeEach(() => {
    resetConfig();
    document.head.querySelectorAll('[data-tasty]').forEach((el) => el.remove());
  });

  afterEach(() => {
    destroy();
    resetConfig();
  });

  it('should store global keyframes via configure', async () => {
    const { hasGlobalKeyframes, getGlobalKeyframes } = await import(
      '../config'
    );

    configure({
      forceTextInjection: true,
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
      },
    });

    expect(hasGlobalKeyframes()).toBe(true);
    expect(getGlobalKeyframes()).toEqual({
      fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
    });
  });

  it('should return false when no keyframes configured', async () => {
    const { hasGlobalKeyframes, getGlobalKeyframes } = await import(
      '../config'
    );

    configure({
      forceTextInjection: true,
    });

    expect(hasGlobalKeyframes()).toBe(false);
    expect(getGlobalKeyframes()).toBeNull();
  });
});
