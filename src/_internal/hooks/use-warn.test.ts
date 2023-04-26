import { renderHook } from '@testing-library/react-hooks';

import { useWarn } from './use-warn';

describe('useWarn()', () => {
  let spy: jest.SpyInstance;

  beforeEach(() => (spy = jest.spyOn(console, 'warn').mockImplementation()));
  afterEach(() => spy.mockRestore());

  it('should warn', () => {
    renderHook(() => useWarn(true, Math.random().toString()));

    expect(spy).toBeCalled();
  });

  it('should not warn', () => {
    renderHook(() => useWarn(false, Math.random().toString()));

    expect(spy).not.toBeCalled();
  });

  it('should warn when condition change to true', () => {
    const { rerender } = renderHook(
      (props) => useWarn(props.condition, Math.random().toString()),
      { initialProps: { condition: false } },
    );

    expect(spy).not.toBeCalled();

    rerender({ condition: true });

    expect(spy).toBeCalled();
  });

  it('should warn only once per message', () => {
    const message = Math.random().toString();
    const { rerender } = renderHook(
      (props) => useWarn(props.condition, message),
      { initialProps: { condition: true } },
    );

    rerender({ condition: false });
    rerender({ condition: true });
    rerender({ condition: false });
    rerender({ condition: true });

    expect(spy).toBeCalledTimes(1);
  });
});
