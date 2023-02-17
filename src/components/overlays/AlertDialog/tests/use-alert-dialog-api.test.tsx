import userEvent from '@testing-library/user-event';

import { act, renderWithRoot } from '../../../../test';
import { useAlertDialogAPI } from '../AlertDialogApiProvider';
import { Button } from '../../../actions';
import { DialogProps } from '../types';

describe('useAlertDialogApi()', () => {
  let prevDialogPromise: Promise<string> | null = null;
  let dialogPromise: Promise<string> | null = null;
  let abortController: AbortController | null = null;

  const onResolve = vi.fn();
  const onReject = vi.fn();

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function TestComponent(props: Partial<DialogProps>) {
    const {
      content = <>Lorem ipsum dolor sit amet</>,
      title = 'Test Dialog',
      ...rest
    } = props;
    const { open } = useAlertDialogAPI();

    return (
      <Button
        onPress={() => {
          abortController = new AbortController();
          prevDialogPromise = dialogPromise;
          dialogPromise = null;

          dialogPromise = open(
            {
              content,
              title,
              ...rest,
            },
            { cancelToken: abortController.signal },
          );

          dialogPromise.then(onResolve).catch(onReject);
        }}
      >
        Open Dialog
      </Button>
    );
  }

  it('should close dialog by abort controller', async () => {
    const { getByRole } = renderWithRoot(<TestComponent />);

    const showDialogButton = getByRole('button');

    await userEvent.click(showDialogButton);

    vi.useFakeTimers();

    act(() => {
      abortController?.abort();
      vi.runAllTimers();
    });

    vi.useRealTimers();

    await userEvent.click(showDialogButton);

    expect(getByRole('alertdialog')).toBeInTheDocument();
  });

  it('should reject on onDismiss', async () => {
    const onDismiss = vi.fn();

    const { getByRole } = renderWithRoot(
      <TestComponent onDismiss={onDismiss} />,
    );
    const showDialogButton = getByRole('button');

    await userEvent.click(showDialogButton);
    await userEvent.keyboard('{Escape}');

    expect(onDismiss).toHaveBeenCalled();
    expect(onReject).toHaveBeenCalled();
    await expect(dialogPromise).rejects.toEqual(undefined);
  });
});
