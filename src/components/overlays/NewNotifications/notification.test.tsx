import { renderWithRoot } from '../../../test';

import { Notification } from './Notification';

function TestComponent({ renderNotification = true, ...notificationProps }) {
  return renderNotification ? (
    <Notification description="Test" {...notificationProps} />
  ) : null;
}

describe('<Notification />', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

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
