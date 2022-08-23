import { render, getByTestId, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { wait } from '../../../../test';
import { Timer } from '../../../../_internal';

import { NotificationView } from './NotificationView';

describe('<Notification />', () => {
  it('should stop timer on hover', async () => {
    const onClose = jest.fn();

    render(
      <NotificationView description="test" duration={50} onClose={onClose} />,
    );

    await userEvent.hover(screen.getByTestId('notification'));
    await wait(100);

    expect(onClose).not.toBeCalled();
  });

  it('should resume timer on unhover', async () => {
    const onClose = jest.fn();

    render(
      <NotificationView description="test" duration={10} onDismiss={onClose} />,
    );

    const notification = screen.getByTestId('notification');

    await userEvent.hover(notification);
    await wait(10);
    await userEvent.unhover(notification);
    await wait(20);

    expect(onClose).toBeCalledTimes(1);
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

    render(
      <NotificationView description="test" duration={10} onClose={onClose} />,
    );
    cleanup();

    await wait(100);

    expect(onClose).toBeCalledTimes(0);
  });

  it('should work with custom timer', async () => {
    const onClose = jest.fn();
    const timerCallback = jest.fn();
    const timer = new Timer(timerCallback, 100);

    render(
      <NotificationView description="test" timer={timer} onClose={onClose} />,
    );

    await wait(500);

    expect(timerCallback).toBeCalledTimes(1);
    expect(onClose).toBeCalledTimes(0);
  });
});
