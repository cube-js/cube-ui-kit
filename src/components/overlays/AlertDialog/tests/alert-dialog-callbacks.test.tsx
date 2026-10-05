import { useState } from 'react';

import {
  act,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
  within,
} from '../../../../test';
import { Button } from '../../../actions/Button/Button';
import { AlertDialogApi, useAlertDialogAPI } from '../AlertDialogApiProvider';
import { DialogProps } from '../types';

let api!: AlertDialogApi;

function ApiGrabber() {
  api = useAlertDialogAPI();

  return null;
}

function openDialog(props: Partial<DialogProps> = {}, signal?: AbortSignal) {
  let promise!: Promise<string>;

  act(() => {
    promise = api.open(
      { title: 'Test Dialog', content: 'Lorem', ...props },
      { cancelToken: signal },
    );
  });

  return promise;
}

/** Settles to a readable outcome, so a rejection is never left unhandled. */
function outcome(promise: Promise<unknown>) {
  return promise.then(
    (value) => ({ resolved: value }),
    (reason) => ({ rejected: reason }),
  );
}

/** `'pending'` when the promise has not settled yet. */
async function settledYet(promise: Promise<unknown>) {
  return Promise.race([
    promise.then(() => 'settled'),
    new Promise((resolve) => setTimeout(() => resolve('pending'), 50)),
  ]);
}

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

const reportError = vi.fn();

beforeEach(() => {
  reportError.mockClear();
  vi.stubGlobal('reportError', reportError);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('open() callbacks', () => {
  const actions = { confirm: { children: 'Delete' }, cancel: true };

  it('runs a sync onConfirm and resolves confirm', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    renderWithRoot(<ApiGrabber />);

    const promise = openDialog({ actions, onConfirm, onCancel });

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    await expect(promise).resolves.toBe('confirm');
  });

  it('keeps the dialog open and loading until an async onConfirm resolves', async () => {
    const work = deferred();
    const onDismiss = vi.fn();

    renderWithRoot(<ApiGrabber />);

    const result = outcome(
      openDialog({ actions, onConfirm: () => work.promise, onDismiss }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    const dialog = screen.getByRole('alertdialog');

    expect(
      within(dialog).getByRole('button', { name: 'Delete' }),
    ).toHaveAttribute('data-loading');
    expect(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    ).toBeDisabled();

    // Escape is ignored while the handler runs.
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();

    await act(async () => work.resolve());

    await expect(result).resolves.toEqual({ resolved: 'confirm' });
    expect(onDismiss).toHaveBeenCalledWith('confirm');
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
  });

  it('keeps the dialog open and reports the error when an async onConfirm rejects', async () => {
    const error = new Error('Delete failed');
    const work = deferred();
    const onCancel = vi.fn();

    renderWithRoot(<ApiGrabber />);

    const result = outcome(
      openDialog({ actions, onConfirm: () => work.promise, onCancel }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await act(async () => work.reject(error));

    expect(reportError).toHaveBeenCalledWith(error);
    // Still open: the failure did not settle it.
    expect(await settledYet(result)).toBe('pending');

    const dialog = screen.getByRole('alertdialog');
    const confirmButton = within(dialog).getByRole('button', {
      name: 'Delete',
    });

    expect(confirmButton).not.toHaveAttribute('data-loading');
    expect(confirmButton).toBeEnabled();

    // The user can give up instead of retrying.
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
    await expect(result).resolves.toEqual({ rejected: undefined });
  });

  it('treats an onConfirm that throws like one that rejects', async () => {
    const error = new Error('Sync failure');

    renderWithRoot(<ApiGrabber />);

    const result = outcome(
      openDialog({
        actions,
        onConfirm: () => {
          throw error;
        },
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(reportError).toHaveBeenCalledWith(error));
    expect(await settledYet(result)).toBe('pending');

    await userEvent.keyboard('{Escape}');
    await expect(result).resolves.toEqual({ rejected: undefined });
  });

  it('runs an async onSecondary and resolves secondary', async () => {
    const work = deferred();

    renderWithRoot(<ApiGrabber />);

    const result = outcome(
      openDialog({
        actions: {
          confirm: true,
          secondary: { children: 'Discard' },
          cancel: true,
        },
        onSecondary: () => work.promise,
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));

    expect(screen.getByRole('button', { name: 'Discard' })).toHaveAttribute(
      'data-loading',
    );
    expect(screen.getByRole('button', { name: 'Ok' })).toBeDisabled();

    await act(async () => work.resolve());

    await expect(result).resolves.toEqual({ resolved: 'secondary' });
  });

  it.each([
    [
      'the Cancel button',
      () => userEvent.click(screen.getByRole('button', { name: 'Cancel' })),
    ],
    ['Escape', () => userEvent.keyboard('{Escape}')],
  ])('runs onCancel on %s', async (_name, dismiss) => {
    const onCancel = vi.fn();

    renderWithRoot(<ApiGrabber />);

    const result = outcome(openDialog({ actions, onCancel }));

    await screen.findByRole('alertdialog');
    await dismiss();

    expect(onCancel).toHaveBeenCalledTimes(1);
    await expect(result).resolves.toEqual({ rejected: undefined });
  });

  it('runs onCancel when the cancel token aborts, before or while open', async () => {
    const onCancel = vi.fn();

    renderWithRoot(<ApiGrabber />);

    const open = new AbortController();
    const openResult = outcome(openDialog({ onCancel }, open.signal));

    act(() => open.abort());
    await openResult;

    const early = new AbortController();

    early.abort();
    await outcome(openDialog({ onCancel }, early.signal));

    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('does not run onCancel when the dialog cannot open', async () => {
    const onCancel = vi.fn();

    renderWithRoot(<ApiGrabber />);

    openDialog({ title: 'First' }).catch(() => {});

    await expect(openDialog({ title: 'Second', onCancel })).rejects.toThrow(
      'Another dialog is already opened',
    );
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('does not pass the callbacks down to the DOM', async () => {
    const consoleError = vi.spyOn(console, 'error');

    renderWithRoot(<ApiGrabber />);
    openDialog({ onConfirm() {}, onSecondary() {}, onCancel() {} }).catch(
      () => {},
    );

    await screen.findByRole('alertdialog');
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('actions onPress', () => {
  it('waits for an async actions.confirm.onPress like onConfirm', async () => {
    const error = new Error('Delete failed');
    let attempt = 0;
    const onPress = vi.fn(() =>
      ++attempt === 1 ? Promise.reject(error) : Promise.resolve(),
    );

    renderWithRoot(<ApiGrabber />);

    const result = outcome(
      openDialog({
        actions: { confirm: { children: 'Delete', onPress }, cancel: true },
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(reportError).toHaveBeenCalledWith(error));

    // The failure kept the dialog open, so the user can retry.
    expect(await settledYet(result)).toBe('pending');

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onPress).toHaveBeenCalledTimes(2);
    expect(onPress).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'press' }),
    );
    await expect(result).resolves.toEqual({ resolved: 'confirm' });
  });

  it('shows loading while an async actions.secondary.onPress runs', async () => {
    const work = deferred();

    renderWithRoot(<ApiGrabber />);

    const result = outcome(
      openDialog({
        actions: {
          confirm: true,
          secondary: { children: 'Discard', onPress: () => work.promise },
        },
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));

    expect(screen.getByRole('button', { name: 'Discard' })).toHaveAttribute(
      'data-loading',
    );
    expect(await settledYet(result)).toBe('pending');

    await act(async () => work.resolve());

    await expect(result).resolves.toEqual({ resolved: 'secondary' });
  });

  it('runs both onPress and onConfirm, and waits for both', async () => {
    const press = deferred();
    const confirm = deferred();

    renderWithRoot(<ApiGrabber />);

    const result = outcome(
      openDialog({
        actions: {
          confirm: { children: 'Delete', onPress: () => press.promise },
        },
        onConfirm: () => confirm.promise,
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await act(async () => confirm.resolve());

    // `onConfirm` is done, but the button's own `onPress` is not.
    expect(await settledYet(result)).toBe('pending');

    await act(async () => press.resolve());

    await expect(result).resolves.toEqual({ resolved: 'confirm' });
  });
});

describe('an ignored promise', () => {
  const unhandled = vi.fn();

  beforeEach(() => {
    unhandled.mockClear();
    process.on('unhandledRejection', unhandled);
  });

  afterEach(() => {
    process.off('unhandledRejection', unhandled);
  });

  /** Lets Node decide whether a rejection went unhandled. */
  const flush = () => new Promise((resolve) => setTimeout(resolve, 20));

  it.each([
    [
      'the Cancel button',
      () => userEvent.click(screen.getByRole('button', { name: 'Cancel' })),
    ],
    ['Escape', () => userEvent.keyboard('{Escape}')],
    [
      'content calling reject()',
      () => userEvent.click(screen.getByRole('button', { name: 'Close' })),
    ],
  ])('is not an unhandled rejection on %s', async (_name, dismiss) => {
    const onCancel = vi.fn();

    renderWithRoot(<ApiGrabber />);

    void openDialog({
      content: ({ reject }) => <Button onPress={() => reject()}>Close</Button>,
      actions: { confirm: true, cancel: true },
      onCancel,
    });

    await screen.findByRole('alertdialog');
    await dismiss();
    await flush();

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it('is not an unhandled rejection when the cancel token aborts', async () => {
    renderWithRoot(<ApiGrabber />);

    const open = new AbortController();

    void openDialog({}, open.signal);
    act(() => open.abort());

    const early = new AbortController();

    early.abort();
    void openDialog({}, early.signal);
    await flush();

    expect(unhandled).not.toHaveBeenCalled();
  });
});

describe('useAlertDialogAPI() identity', () => {
  it('returns the same API across renders', async () => {
    const seen = new Set<unknown>();

    function Consumer() {
      const [, setCount] = useState(0);

      seen.add(useAlertDialogAPI().open);

      return <Button onPress={() => setCount((c) => c + 1)}>Rerender</Button>;
    }

    renderWithRoot(<Consumer />);

    await userEvent.click(screen.getByRole('button', { name: 'Rerender' }));
    await userEvent.click(screen.getByRole('button', { name: 'Rerender' }));

    expect(seen.size).toBe(1);
  });
});
