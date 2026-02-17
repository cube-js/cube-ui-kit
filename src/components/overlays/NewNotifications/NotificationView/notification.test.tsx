import {
  cleanup,
  getByTestId,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Timer } from '../../../../_internal';
import { act } from '../../../../test';

import { NotificationAction } from './NotificationAction';
import { NotificationView } from './NotificationView';

describe('<Notification />', () => {
  afterEach(() => {
    vi.useRealTimers();
  });
  it('should stop timer on hover', async () => {
    const onClose = vi.fn();

    render(
      <NotificationView description="test" duration={50} onClose={onClose} />,
    );

    await act(() => userEvent.hover(screen.getByTestId('notification')));
    vi.useFakeTimers();
    vi.runAllTimers();

    expect(onClose).not.toBeCalled();
  });

  it('should resume timer on unhover', async () => {
    const onClose = vi.fn();

    render(
      <NotificationView description="test" duration={10} onDismiss={onClose} />,
    );

    const notification = screen.getByTestId('notification');

    await act(() => userEvent.hover(notification));

    vi.useFakeTimers();
    vi.runAllTimers();
    vi.useRealTimers();

    await act(() => userEvent.unhover(notification));

    vi.useFakeTimers();
    vi.runAllTimers();
    vi.useRealTimers();

    await waitFor(() => expect(onClose).toBeCalledTimes(1));
  });

  it('should close on click', async () => {
    const onClose = vi.fn();
    render(<NotificationView description="test" onDismiss={onClose} />);

    const notification = screen.getByTestId('notification');

    await act(() =>
      userEvent.click(getByTestId(notification, 'NotificationCloseButton')),
    );

    expect(onClose).toBeCalledTimes(1);
  });

  it('should kill timer on unmount', async () => {
    const onClose = vi.fn();
    vi.useFakeTimers();

    render(
      <NotificationView description="test" duration={10} onClose={onClose} />,
    );
    cleanup();

    vi.runAllTimers();

    expect(onClose).toBeCalledTimes(0);
  });

  it('should work with custom timer', async () => {
    const onClose = vi.fn();
    const timerCallback = vi.fn();
    vi.useFakeTimers();

    const timer = new Timer(timerCallback, 100);

    render(
      <NotificationView description="test" timer={timer} onClose={onClose} />,
    );

    vi.runAllTimers();

    expect(timerCallback).toBeCalledTimes(1);
    expect(onClose).toBeCalledTimes(0);
  });

  it('should render actions correctly', async () => {
    const onActionPress = vi.fn();

    render(
      <NotificationView
        description="test"
        actions={
          <>
            <NotificationAction onPress={onActionPress}>
              Test Action
            </NotificationAction>
            <NotificationAction type="secondary">
              Secondary Action
            </NotificationAction>
          </>
        }
      />,
    );

    const actionButton = screen.getByText('Test Action');
    expect(actionButton).toBeInTheDocument();

    const secondaryButton = screen.getByText('Secondary Action');
    expect(secondaryButton).toBeInTheDocument();

    await act(() => userEvent.click(actionButton));
    expect(onActionPress).toHaveBeenCalledTimes(1);
  });

  it('should render actions as array', async () => {
    render(
      <NotificationView
        description="test"
        actions={[
          <NotificationAction key="first">First Action</NotificationAction>,
          <NotificationAction key="second" type="secondary">
            Second Action
          </NotificationAction>,
        ]}
      />,
    );

    expect(screen.getByText('First Action')).toBeInTheDocument();
    expect(screen.getByText('Second Action')).toBeInTheDocument();
  });

  it('should render actions as function', async () => {
    const onClose = vi.fn();
    const onDismiss = vi.fn();

    render(
      <NotificationView
        description="test"
        actions={({ onClose, onDismiss }) => (
          <>
            <NotificationAction onPress={onClose}>Close</NotificationAction>
            <NotificationAction type="secondary" onPress={onDismiss}>
              Dismiss
            </NotificationAction>
          </>
        )}
        onClose={onClose}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByText('Close')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });
});
