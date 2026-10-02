import userEvent from '@testing-library/user-event';

import { act, renderWithRoot, screen, waitFor, within } from '../../../../test';
import { Button } from '../../../actions';
import { AlertDialogApi, useAlertDialogAPI } from '../AlertDialogApiProvider';
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

  it('should reject when the cancel token aborts an open dialog', async () => {
    const { getByRole } = renderWithRoot(<TestComponent />);

    await userEvent.click(getByRole('button'));

    act(() => abortController?.abort());

    await expect(dialogPromise).rejects.toEqual(undefined);
  });
});

describe('useAlertDialogApi() with a pre-aborted cancel token', () => {
  let api: AlertDialogApi;

  function ApiGrabber() {
    api = useAlertDialogAPI();

    return null;
  }

  it('rejects `open` without showing a dialog', async () => {
    renderWithRoot(<ApiGrabber />);

    const controller = new AbortController();

    controller.abort();

    await expect(
      api.open(
        { title: 'Test', content: 'Body' },
        { cancelToken: controller.signal },
      ),
    ).rejects.toEqual(undefined);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('resolves `confirm` with cancel without showing a dialog', async () => {
    renderWithRoot(<ApiGrabber />);

    const controller = new AbortController();

    controller.abort();

    await expect(
      api.confirm(
        { title: 'Test', content: 'Body' },
        { cancelToken: controller.signal },
      ),
    ).resolves.toBe('cancel');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});

describe('useAlertDialogApi().confirm()', () => {
  let api: AlertDialogApi;

  function ApiGrabber() {
    api = useAlertDialogAPI();

    return null;
  }

  function openConfirm(props: Partial<DialogProps> = {}, signal?: AbortSignal) {
    let promise!: ReturnType<AlertDialogApi['confirm']>;

    act(() => {
      promise = api.confirm(
        { title: 'Test Dialog', content: 'Lorem ipsum', ...props },
        { cancelToken: signal },
      );
    });

    return promise;
  }

  it('resolves cancel when the cancel button (boolean) is clicked', async () => {
    const onDismiss = vi.fn();

    renderWithRoot(<ApiGrabber />);

    const promise = openConfirm({ actions: { cancel: true }, onDismiss });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onDismiss).toHaveBeenCalledWith('cancel');
    await expect(promise).resolves.toBe('cancel');
  });

  it('resolves cancel and calls onPress when the cancel button (object) is clicked', async () => {
    const onPress = vi.fn();

    renderWithRoot(<ApiGrabber />);

    const promise = openConfirm({
      actions: { cancel: { children: 'No thanks', onPress } },
    });

    await userEvent.click(screen.getByRole('button', { name: 'No thanks' }));

    expect(onPress).toHaveBeenCalled();
    await expect(promise).resolves.toBe('cancel');
  });

  it('resolves cancel and calls onDismiss on Escape', async () => {
    const onDismiss = vi.fn();

    renderWithRoot(<ApiGrabber />);

    const promise = openConfirm({ onDismiss });

    await screen.findByRole('alertdialog');
    await userEvent.keyboard('{Escape}');

    expect(onDismiss).toHaveBeenCalled();
    await expect(promise).resolves.toBe('cancel');
  });

  it('resolves the action status for confirm and secondary', async () => {
    renderWithRoot(<ApiGrabber />);

    const confirmed = openConfirm({ actions: { confirm: true } });

    await userEvent.click(screen.getByRole('button', { name: 'Ok' }));
    await expect(confirmed).resolves.toBe('confirm');
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );

    const secondary = openConfirm({
      actions: { confirm: true, secondary: { children: 'Later' } },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Later' }));
    await expect(secondary).resolves.toBe('secondary');
  });

  it('resolves cancel and closes the dialog when the cancel token aborts', async () => {
    const controller = new AbortController();

    renderWithRoot(<ApiGrabber />);

    const promise = openConfirm({}, controller.signal);

    await screen.findByRole('alertdialog');
    act(() => controller.abort());

    await expect(promise).resolves.toBe('cancel');
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
  });

  it('rejects with an error when another dialog is already open', async () => {
    renderWithRoot(<ApiGrabber />);

    const first = openConfirm({ title: 'First' });
    const second = openConfirm({ title: 'Second' });

    await expect(second).rejects.toThrow('Another dialog is already opened');
    expect(
      within(screen.getByRole('alertdialog')).getByText('First'),
    ).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    await expect(first).resolves.toBe('cancel');
  });

  it('treats `reject()` from content as a cancel and `reject(reason)` as a failure', async () => {
    const error = new Error('Failed');

    renderWithRoot(<ApiGrabber />);

    const cancelled = openConfirm({
      content: ({ reject }) => <Button onPress={() => reject()}>Close</Button>,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await expect(cancelled).resolves.toBe('cancel');
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );

    const failed = openConfirm({
      content: ({ reject }) => (
        <Button onPress={() => reject(error)}>Fail</Button>
      ),
    });

    // Handled before the click, which rejects it.
    const failure = expect(failed).rejects.toBe(error);

    await userEvent.click(screen.getByRole('button', { name: 'Fail' }));
    await failure;
  });
});
