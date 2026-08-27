import { act, waitFor } from '@testing-library/react';

import { renderHook } from '../../test';

import {
  resolveHighContrast,
  resolveScheme,
  useHighContrast,
  useScheme,
} from './useScheme';

const DARK = '(prefers-color-scheme: dark)';
const MORE_CONTRAST = '(prefers-contrast: more)';

/**
 * A `matchMedia` stub whose answers can be flipped mid-test, dispatching the
 * `change` event the hook subscribes to. jsdom's own implementation always
 * answers `false` and never changes, so the media half is untestable without it.
 */
function stubMatchMedia(initial: Record<string, boolean> = {}) {
  const matches = { ...initial };
  const listeners = new Map<string, Set<() => void>>();

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) =>
      ({
        media: query,
        get matches() {
          return Boolean(matches[query]);
        },
        addEventListener: (_: string, listener: () => void) => {
          const set = listeners.get(query) ?? new Set();

          set.add(listener);
          listeners.set(query, set);
        },
        removeEventListener: (_: string, listener: () => void) => {
          listeners.get(query)?.delete(listener);
        },
      }) as unknown as MediaQueryList,
  });

  return function set(query: string, value: boolean) {
    matches[query] = value;
    listeners.get(query)?.forEach((listener) => listener());
  };
}

describe('useScheme / useHighContrast', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    // The jsdom project shares one environment across a worker, so neither the
    // stub nor the attributes may leak into the rest of the suite.
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
    document.documentElement.removeAttribute('data-scheme');
    document.documentElement.removeAttribute('data-contrast');
  });

  describe('resolveScheme', () => {
    it('falls back to the media query when no attribute is set', () => {
      const set = stubMatchMedia({ [DARK]: true });

      expect(resolveScheme()).toBe('dark');

      set(DARK, false);

      expect(resolveScheme()).toBe('light');
    });

    it('lets the attribute opt-in win over the system preference', () => {
      stubMatchMedia({ [DARK]: true });

      document.documentElement.setAttribute('data-scheme', 'light');

      expect(resolveScheme()).toBe('light');

      document.documentElement.setAttribute('data-scheme', 'dark');

      expect(resolveScheme()).toBe('dark');
    });

    it('reads any other attribute value as light, exactly as `@dark` does', () => {
      stubMatchMedia({ [DARK]: true });

      // `@dark` gates the media fallback on the attribute being *absent*
      // (`!@root(scheme)`), so a present-but-unknown value stays light rather
      // than falling through to the preference.
      document.documentElement.setAttribute('data-scheme', 'sepia');

      expect(resolveScheme()).toBe('light');
    });
  });

  describe('resolveHighContrast', () => {
    it('follows the media query, then the attribute', () => {
      const set = stubMatchMedia({ [MORE_CONTRAST]: true });

      expect(resolveHighContrast()).toBe(true);

      set(MORE_CONTRAST, false);

      expect(resolveHighContrast()).toBe(false);

      document.documentElement.setAttribute('data-contrast', 'high');

      expect(resolveHighContrast()).toBe(true);

      document.documentElement.setAttribute('data-contrast', 'normal');

      expect(resolveHighContrast()).toBe(false);
    });
  });

  it('re-renders when the attribute flips', async () => {
    stubMatchMedia();

    const { result } = renderHook(() => useScheme());

    expect(result.current).toBe('light');

    await act(async () => {
      document.documentElement.setAttribute('data-scheme', 'dark');
    });

    await waitFor(() => expect(result.current).toBe('dark'));

    await act(async () => {
      document.documentElement.removeAttribute('data-scheme');
    });

    await waitFor(() => expect(result.current).toBe('light'));
  });

  it('re-renders when the system preference changes', async () => {
    const set = stubMatchMedia({ [DARK]: false, [MORE_CONTRAST]: false });

    const scheme = renderHook(() => useScheme());
    const contrast = renderHook(() => useHighContrast());

    expect(scheme.result.current).toBe('light');
    expect(contrast.result.current).toBe(false);

    await act(async () => set(DARK, true));

    expect(scheme.result.current).toBe('dark');
    expect(contrast.result.current).toBe(false);

    await act(async () => set(MORE_CONTRAST, true));

    expect(contrast.result.current).toBe(true);
  });

  it('re-attaches its watchers after the last subscriber leaves', async () => {
    stubMatchMedia();

    // The observer and the query listeners are shared and torn down when the
    // listener set empties, so a remount has to build them again.
    renderHook(() => useScheme()).unmount();

    const { result } = renderHook(() => useScheme());

    await act(async () => {
      document.documentElement.setAttribute('data-scheme', 'dark');
    });

    await waitFor(() => expect(result.current).toBe('dark'));
  });
});
