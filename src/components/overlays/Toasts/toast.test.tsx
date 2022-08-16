import { Toast } from './Toast';
import { renderWithRoot, screen, wait } from '../../../test';
import { act } from '@testing-library/react';

function TestComponent({ renderNotification = true, ...notificationProps }) {
  return renderNotification ? (
    <Toast description="Test" {...notificationProps} />
  ) : null;
}

describe('useToastsApi', () => {
  beforeEach(() => jest.useFakeTimers('modern'));
  afterEach(() => jest.useRealTimers());

  it('should add and dismiss toast on timeout', async () => {
    const dismiss = jest.fn();
    renderWithRoot(<Toast description="Test" onDismiss={dismiss} />);

    act(() => {
      jest.runAllTimers();
    });

    expect(
      screen.queryByTestId('FloatingNotification'),
    ).not.toBeInTheDocument();

    expect(dismiss).toBeCalledTimes(1);
  });

  it('should not unmount if duration is null', async () => {
    const dismiss = jest.fn();

    renderWithRoot(
      <Toast description="Test" duration={null} onDismiss={dismiss} />,
    );

    act(() => {
      jest.runAllTimers();
    });

    expect(screen.getByTestId('FloatingNotification')).toBeInTheDocument();
    expect(dismiss).not.toBeCalled();
  });

  it('should respect duration prop', async () => {
    jest.useRealTimers();
    const dismiss = jest.fn();

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
