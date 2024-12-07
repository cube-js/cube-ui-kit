import {
  render,
  getByTestId,
  screen,
  cleanup,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { act } from '../../../../test';
import { Timer } from '../../../../_internal';

import { NotificationView } from './NotificationView';

describe('<Notification />', () => {
  afterEach(() => {
    jest.useRealTimers();
  });
  it('should stop timer on hover', async () => {
    const onClose = jest.fn();

    render(
      <NotificationView description="test" duration={50} onClose={onClose} />,
    );

    await userEvent.hover(screen.getByTestId('notification'));
    jest.useFakeTimers();
    jest.runAllTimers();

    expect(onClose).not.toBeCalled();
  });

  it('should resume timer on unhover', async () => {
    const onClose = jest.fn();

    render(
      <NotificationView description="test" duration={10} onDismiss={onClose} />,
    );

    const notification = screen.getByTestId('notification');

    await userEvent.hover(notification);

    jest.useFakeTimers();
    jest.runAllTimers();
    jest.useRealTimers();

    await userEvent.unhover(notification);

    jest.useFakeTimers();
    jest.runAllTimers();
    jest.useRealTimers();

    await waitFor(() => expect(onClose).toBeCalledTimes(1));
  });

  it('should close on click', async () => {
    const onClose = jest.fn();
    render(<NotificationView description="test" onDismiss={onClose} />);

    const notification = screen.getByTestId('notification');

    await userEvent.click(getByTestId(notification, 'NotificationCloseButton'));

    expect(onClose).toBeCalledTimes(1);
  });

  it('should kill timer on unmount', async () => {
    const onClose = jest.fn();
    jest.useFakeTimers();

    render(
      <NotificationView description="test" duration={10} onClose={onClose} />,
    );
    cleanup();

    jest.runAllTimers();

    expect(onClose).toBeCalledTimes(0);
  });

  it('should work with custom timer', async () => {
    const onClose = jest.fn();
    const timerCallback = jest.fn();
    jest.useFakeTimers();

    const timer = new Timer(timerCallback, 100);

    render(
      <NotificationView description="test" timer={timer} onClose={onClose} />,
    );

    jest.runAllTimers();

    expect(timerCallback).toBeCalledTimes(1);
    expect(onClose).toBeCalledTimes(0);
  });
});
