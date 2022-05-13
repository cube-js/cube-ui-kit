import { renderHook } from '@testing-library/react-hooks';
import { useAlert } from './use-alert';

describe('<Alert /> component', () => {
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
});
