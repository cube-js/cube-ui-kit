import { Toast } from './Toast';
import { renderWithRoot, screen } from '../../../test';

describe('useToastsApi', () => {
  beforeAll(() => jest.useFakeTimers('modern'));
  afterAll(() => jest.useRealTimers());

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
});
