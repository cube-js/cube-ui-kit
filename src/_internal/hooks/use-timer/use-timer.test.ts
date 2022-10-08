import { renderHook } from '@testing-library/react-hooks';

import { useTimer } from './use-timer';
import { Timer } from './timer';

describe('useTimer', () => {
  const callback = jest.fn();

  beforeAll(() => {
    jest.useFakeTimers('modern');
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should trigger callback', async () => {
    const { result } = renderHook(useTimer, {
      initialProps: { callback, delay: 100 },
    });

    jest.runAllTimers();

    expect(callback).toBeCalledTimes(1);
    expect(result.current.timer?.status).toBe('stopped');
  });

  it('should override with custom timer', async () => {
    const dummyCallback = jest.fn();
    const timer = new Timer(callback, 100);

    const { result } = renderHook(useTimer, {
      initialProps: {
        callback: dummyCallback,
        delay: 100,
        timer,
      },
    });

    jest.runAllTimers();

    expect(result.current.timer).toBe(timer);
    expect(dummyCallback).not.toBeCalled();
    expect(callback).toBeCalled();
  });

  it('should not call callback after unmount', async () => {
    const { unmount, result } = renderHook(useTimer, {
      initialProps: { callback, delay: 10 },
    });

    unmount();

    jest.runAllTimers();

    expect(result.current.timer?.status).toBe('stopped');
    expect(callback).toBeCalledTimes(0);
  });

  it('should not run when disabled', async () => {
    const { result } = renderHook(useTimer, {
      initialProps: { callback, delay: 10, isDisabled: true },
    });

    expect(result.current.timer?.status).toBe('stopped');

    jest.runAllTimers();

    expect(callback).not.toBeCalled();
    expect(result.current.timer?.status).toBe('stopped');
  });

  it('should stop timer after', async () => {
    const { result, rerender } = renderHook(useTimer, {
      initialProps: { callback, delay: 10, isDisabled: false },
    });

    expect(result.current.timer?.status).toBe('running');

    rerender({ isDisabled: true });

    jest.runAllTimers();

    expect(callback).not.toBeCalled();
    expect(result.current.timer?.status).toBe('stopped');
  });
});
