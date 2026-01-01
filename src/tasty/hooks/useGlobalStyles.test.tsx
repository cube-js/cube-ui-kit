/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';

import { useGlobalStyles } from './useGlobalStyles';

describe('useGlobalStyles', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should warn and not inject when selector is empty string', () => {
    const { result } = renderHook(() =>
      useGlobalStyles('', {
        padding: '2x',
      }),
    );

    // Should have warned about empty selector
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('selector is required and cannot be empty'),
    );

    // Hook should complete without error (returns void)
    expect(result.current).toBeUndefined();
  });

  it('should not warn when selector is valid', () => {
    renderHook(() =>
      useGlobalStyles('.my-class', {
        padding: '2x',
      }),
    );

    // Should not have warned
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should handle undefined styles without warning', () => {
    renderHook(() => useGlobalStyles('.my-class', undefined));

    // Should not have warned (undefined styles is a valid case)
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should handle empty styles object', () => {
    renderHook(() => useGlobalStyles('.my-class', {}));

    // Should not have warned
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
