import { render, renderHook } from '../../test';

import { useWarn } from './use-warn';

jest.unmock('./use-warn');

describe('useWarn()', () => {
  let spy: jest.SpyInstance;

  beforeEach(() => (spy = jest.spyOn(console, 'warn').mockImplementation()));
  afterEach(() => spy.mockRestore());

  it('should warn', () => {
    const key = Math.random().toString();
    renderHook(() =>
      useWarn(true, {
        args: [Math.random().toString()],
        key,
      }),
    );

    expect(spy).toBeCalled();
  });

  it('should not warn', () => {
    renderHook(() =>
      useWarn(false, { key: Math.random().toString(), args: [] }),
    );

    expect(spy).not.toBeCalled();
  });

  it('should warn when condition change to true', () => {
    const { rerender } = renderHook(
      (props) =>
        useWarn(props.condition, {
          key: Math.random().toString(),
          args: [],
        }),
      { initialProps: { condition: false } },
    );

    expect(spy).not.toBeCalled();

    rerender({ condition: true });

    expect(spy).toBeCalled();
  });

  it('should warn only once per message', () => {
    const message = Math.random().toString();
    const { rerender } = renderHook(
      (props) =>
        useWarn(props.condition, {
          key: message,
          args: [message],
        }),
      { initialProps: { condition: true } },
    );

    rerender({ condition: false });
    rerender({ condition: true });
    rerender({ condition: false });
    rerender({ condition: true });

    expect(spy).toBeCalledTimes(1);
  });

  it('should warn once per component', () => {
    const Component = () => {
      useWarn(true, {
        once: false,
        key: Math.random().toString(),
        args: [],
      });
      return null;
    };

    render(
      <>
        <Component />
        <Component />
      </>,
    );

    expect(spy).toBeCalledTimes(2);
  });

  it('should warn once per component even after rerender', () => {
    const Component = () => {
      useWarn(true, {
        once: false,
        key: Math.random().toString(),
        args: [],
      });
      return null;
    };

    const { rerender } = render(<Component />);

    rerender(<Component />);

    expect(spy).toBeCalledTimes(1);
  });
});
