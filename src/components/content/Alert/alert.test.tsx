import { renderHook } from '@testing-library/react';

import { useAlert } from './use-alert';

describe('<Alert /> component', () => {
  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'group').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should correctly render disabled', () => {
    const { result } = renderHook(() =>
      useAlert({ theme: 'danger', isDisabled: true }),
    );

    expect(result.current.theme).toBe('disabled');
  });

  it('should correctly render theme', () => {
    const { result } = renderHook(() => useAlert({ theme: 'danger' }));

    expect(result.current.theme).toBe('danger');
  });

  it('should correctly render type', () => {
    const { result } = renderHook(() => useAlert({ type: 'danger' }));

    expect(result.current.theme).toBe('danger');
  });

  it('should correctly render theme', () => {
    const { result } = renderHook(() =>
      useAlert({ theme: 'danger', type: 'note' }),
    );

    expect(result.current.theme).toBe('danger');
  });

  it('should add qa', () => {
    const { result } = renderHook(() =>
      useAlert({ theme: 'danger', qa: 'test' }),
    );

    expect(result.current.filteredProps.qa).toBe('test');
  });

  it('should default to card shape', () => {
    const { result } = renderHook(() => useAlert({ theme: 'danger' }));

    expect(result.current.mods.shape).toBe('card');
  });

  it('should correctly render sharp shape', () => {
    const { result } = renderHook(() =>
      useAlert({ theme: 'danger', shape: 'sharp' }),
    );

    expect(result.current.mods.shape).toBe('sharp');
  });

  it('should correctly render card shape', () => {
    const { result } = renderHook(() =>
      useAlert({ theme: 'success', shape: 'card' }),
    );

    expect(result.current.mods.shape).toBe('card');
  });
});
