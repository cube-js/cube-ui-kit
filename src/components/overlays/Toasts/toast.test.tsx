import { Toast } from './Toast';
import { renderWithRoot, screen, wait } from '../../../test';

describe('useToastsApi', () => {
  beforeEach(() => jest.useFakeTimers('modern'));
  afterEach(() => jest.useRealTimers());

  it('should add and dismiss toast on timeout', async () => {
    const dismiss = jest.fn();
    renderWithRoot(<Toast description="Test" onDismiss={dismiss} />);

    jest.runAllTimers();

    expect(
      screen.queryByTestId('floating-notification'),
    ).not.toBeInTheDocument();
    expect(dismiss).toBeCalledTimes(1);
  });

  it('should not unmount if duration is null', async () => {
    const dismiss = jest.fn();
    renderWithRoot(
      <Toast description="Test" duration={null} onDismiss={dismiss} />,
    );

    jest.runAllTimers();
    expect(screen.getByTestId('floating-notification')).toBeInTheDocument();
    expect(dismiss).not.toBeCalled();
  });

  it('should respect duration prop', async () => {
    jest.useRealTimers();
    const dismiss = jest.fn();

    renderWithRoot(
      <Toast description="Test" duration={10} onDismiss={dismiss} />,
    );

    await wait(100);

    expect(dismiss).toBeCalled();
    expect(
      screen.queryByTestId('floating-notification'),
    ).not.toBeInTheDocument();
  });
});
