import { act } from '@testing-library/react';

import { renderWithRoot, screen, wait } from '../../../test';

import { Toast } from './Toast';

function TestComponent({ renderNotification = true, ...notificationProps }) {
  return renderNotification ? (
    <Toast description="Test" {...notificationProps} />
  ) : null;
}

describe('useToastsApi', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('should add and dismiss toast on timeout', async () => {
    const dismiss = vi.fn();
    renderWithRoot(<Toast description="Test" onDismiss={dismiss} />);

    act(() => {
      vi.runAllTimers();
    });

    expect(
      screen.queryByTestId('FloatingNotification'),
    ).not.toBeInTheDocument();

    expect(dismiss).toBeCalledTimes(1);
  });

  it('should not unmount if duration is null', async () => {
    const dismiss = vi.fn();

    renderWithRoot(
      <Toast description="Test" duration={null} onDismiss={dismiss} />,
    );

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByTestId('FloatingNotification')).toBeInTheDocument();
    expect(dismiss).not.toBeCalled();
  });

  it('should respect duration prop', async () => {
    vi.useRealTimers();
    const dismiss = vi.fn();

    renderWithRoot(
      <Toast description="Test" duration={10} onDismiss={dismiss} />,
    );

    await act(async () => {
      await wait(100);
    });

    expect(dismiss).toBeCalled();
    expect(
      screen.queryByTestId('FloatingNotification'),
    ).not.toBeInTheDocument();
  });

  it('should unmount component by default', () => {
    const { getByTestId, rerender } = renderWithRoot(<TestComponent />);

    const notification = getByTestId('FloatingNotification');

    rerender(
      <TestComponent disableRemoveOnUnmount renderNotification={false} />,
    );

    expect(notification).not.toBeInTheDocument();
  });

  it('should keep notification if disableRemoveOnUnmount set to true', () => {
    const { rerender, getByTestId } = renderWithRoot(
      <TestComponent disableRemoveOnUnmount />,
    );

    const notification = getByTestId('FloatingNotification');

    rerender(
      <TestComponent disableRemoveOnUnmount renderNotification={false} />,
    );

    expect(notification).toBeInTheDocument();
  });
});
