import userEvent from '@testing-library/user-event';
import { StrictMode, useEffect } from 'react';

import {
  act,
  render,
  renderWithRoot,
  screen,
  waitFor,
  within,
} from '../../../../test';
import { Button } from '../../../actions';
import { Root } from '../../../Root';
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

  it('should reject with undefined when the cancel token aborts an open dialog', async () => {
    const { getByRole } = renderWithRoot(<TestComponent />);

    await userEvent.click(getByRole('button'));

    act(() => abortController?.abort());

    await expect(dialogPromise).rejects.toEqual(undefined);
  });

  it('should reject with undefined, without opening, when the cancel token is already aborted', async () => {
    let api!: AlertDialogApi;

    function ApiGrabber() {
      api = useAlertDialogAPI();

      return null;
    }

    renderWithRoot(<ApiGrabber />);

    const controller = new AbortController();

    controller.abort();

    await expect(
      api.open(
        { title: 'Test Dialog', content: 'Lorem ipsum' },
        { cancelToken: controller.signal },
      ),
    ).rejects.toEqual(undefined);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
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
});

describe('useAlertDialogApi() dialog lifecycle', () => {
  let api!: AlertDialogApi;

  function ApiGrabber() {
    api = useAlertDialogAPI();

    return null;
  }

  function openDialog(props: Partial<DialogProps> = {}) {
    let promise!: ReturnType<AlertDialogApi['open']>;

    act(() => {
      promise = api.open({ title: 'Test Dialog', content: 'Lorem', ...props });
    });

    return promise;
  }

  it('resolves confirm from the default Ok button when no actions are set', async () => {
    renderWithRoot(<ApiGrabber />);

    const promise = openDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Ok' }));

    await expect(promise).resolves.toBe('confirm');
  });

  it('resolves confirm from the default Ok button next to other actions', async () => {
    renderWithRoot(<ApiGrabber />);

    const promise = openDialog({ actions: { cancel: true } });

    await userEvent.click(screen.getByRole('button', { name: 'Ok' }));

    await expect(promise).resolves.toBe('confirm');
  });

  it('rejects a second dialog while the first one is open', async () => {
    renderWithRoot(<ApiGrabber />);

    const first = openDialog({ title: 'First', actions: { confirm: true } });
    const second = openDialog({ title: 'Second' });

    await expect(second).rejects.toThrow('Another dialog is already opened');
    expect(
      within(screen.getByRole('alertdialog')).getByText('First'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Ok' }));
    await expect(first).resolves.toBe('confirm');
  });

  it('opens a new dialog while the previous one is still closing', async () => {
    renderWithRoot(<ApiGrabber />);

    const first = openDialog({ title: 'First', actions: { cancel: true } });
    const firstRejection = expect(first).rejects.toEqual(undefined);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await firstRejection;

    const second = openDialog({ title: 'Second', actions: { confirm: true } });

    expect(
      within(await screen.findByRole('alertdialog')).getByText('Second'),
    ).toBeInTheDocument();

    // Past the first dialog's 300 ms cleanup, which must leave this one alone.
    await act(() => new Promise((resolve) => setTimeout(resolve, 400)));
    expect(
      within(screen.getByRole('alertdialog')).getByText('Second'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Ok' }));
    await expect(second).resolves.toBe('confirm');
  });

  it('shows a dialog opened from a mount effect under StrictMode', async () => {
    const results: unknown[] = [];

    function Opener() {
      const { open } = useAlertDialogAPI();

      useEffect(() => {
        const controller = new AbortController();

        open(
          { title: 'From effect', actions: { confirm: true } },
          { cancelToken: controller.signal },
        ).then(
          (status) => results.push(status),
          (reason) => results.push(reason),
        );

        return () => controller.abort();
      }, []);

      return null;
    }

    render(
      <StrictMode>
        <Root>
          <Opener />
        </Root>
      </StrictMode>,
    );

    expect(
      within(await screen.findByRole('alertdialog')).getByText('From effect'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Ok' }));

    // The first, aborted run is a cancel; the second is the dialog the user saw.
    await waitFor(() => expect(results).toEqual([undefined, 'confirm']));
  });
});
