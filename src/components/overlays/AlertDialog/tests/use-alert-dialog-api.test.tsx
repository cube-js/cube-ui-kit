import userEvent from '@testing-library/user-event';

import { act, renderWithRoot } from '../../../../test';
import { Button } from '../../../actions';
import { useAlertDialogAPI } from '../AlertDialogApiProvider';
import { DialogProps } from '../types';

describe('useAlertDialogApi()', () => {
  let prevDialogPromise: Promise<string> | null = null;
  let dialogPromise: Promise<string> | null = null;
  let abortController: AbortController | null = null;

  const onResolve = jest.fn();
  const onReject = jest.fn();

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
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

    jest.useFakeTimers();

    act(() => {
      abortController?.abort();
      jest.runAllTimers();
    });

    jest.useRealTimers();

    await userEvent.click(showDialogButton);

    expect(getByRole('alertdialog')).toBeInTheDocument();
  });

  it('should reject on onDismiss', async () => {
    const onDismiss = jest.fn();

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

  it('should reject when cancel button (boolean) is clicked', async () => {
    const { getByRole } = renderWithRoot(
      <TestComponent actions={{ cancel: true }} />,
    );
    const showDialogButton = getByRole('button', { name: 'Open Dialog' });

    await userEvent.click(showDialogButton);

    const cancelButton = getByRole('button', { name: 'Cancel' });

    await userEvent.click(cancelButton);

    expect(onReject).toHaveBeenCalled();
    await expect(dialogPromise).rejects.toEqual(undefined);
  });

  it('should reject when cancel button (object) is clicked', async () => {
    const { getByRole } = renderWithRoot(
      <TestComponent actions={{ cancel: { label: 'No thanks' } }} />,
    );
    const showDialogButton = getByRole('button', { name: 'Open Dialog' });

    await userEvent.click(showDialogButton);

    const cancelButton = getByRole('button', { name: 'No thanks' });

    await userEvent.click(cancelButton);

    expect(onReject).toHaveBeenCalled();
    await expect(dialogPromise).rejects.toEqual(undefined);
  });

  it('should resolve when confirm button is clicked', async () => {
    const { getByRole } = renderWithRoot(
      <TestComponent actions={{ confirm: true }} />,
    );
    const showDialogButton = getByRole('button', { name: 'Open Dialog' });

    await userEvent.click(showDialogButton);

    const confirmButton = getByRole('button', { name: 'Ok' });

    await userEvent.click(confirmButton);

    expect(onResolve).toHaveBeenCalledWith('confirm');
    await expect(dialogPromise).resolves.toEqual('confirm');
  });

  it('should resolve when secondary button is clicked', async () => {
    const { getByRole } = renderWithRoot(
      <TestComponent
        actions={{ confirm: true, secondary: { label: 'Later' } }}
      />,
    );
    const showDialogButton = getByRole('button', { name: 'Open Dialog' });

    await userEvent.click(showDialogButton);

    const secondaryButton = getByRole('button', { name: 'Later' });

    await userEvent.click(secondaryButton);

    expect(onResolve).toHaveBeenCalledWith('secondary');
    await expect(dialogPromise).resolves.toEqual('secondary');
  });
});
