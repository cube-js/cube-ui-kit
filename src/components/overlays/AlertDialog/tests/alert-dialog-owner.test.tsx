import { StrictMode } from 'react';

import {
  act,
  render,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
  within,
} from '../../../../test';
import { Root } from '../../../Root';
import { AlertDialogApi, useAlertDialogAPI } from '../AlertDialogApiProvider';
import { DialogProps } from '../types';

/**
 * A dialog belongs to the component that called `useAlertDialogAPI`: when it
 * unmounts, the dialog closes as a cancel, so its callbacks never run against
 * a component that is gone.
 */
const apis: Record<string, AlertDialogApi> = {};

function Owner({ name = 'owner' }: { name?: string }) {
  apis[name] = useAlertDialogAPI();

  return null;
}

function openDialog(
  props: Partial<DialogProps> = {},
  { owner = 'owner', signal }: { owner?: string; signal?: AbortSignal } = {},
) {
  let promise!: Promise<string>;

  act(() => {
    promise = apis[owner].open(
      { title: 'Test Dialog', content: 'Lorem', ...props },
      { cancelToken: signal },
    );
  });

  return promise.then(
    (value) => ({ resolved: value }),
    (reason) => ({ rejected: reason }),
  );
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

const dialogGone = () =>
  waitFor(() =>
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
  );

const actions = { confirm: { children: 'Delete' }, cancel: true };

beforeEach(() => {
  vi.stubGlobal('reportError', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('a dialog and the component that opened it', () => {
  it('closes as a cancel when that component unmounts', async () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const { rerender } = renderWithRoot(<Owner />);

    const result = openDialog({ actions, onCancel, onConfirm });

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    rerender(<></>);

    await expect(result).resolves.toEqual({ rejected: undefined });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    await dialogGone();
  });

  it('stays open when another component unmounts', async () => {
    const { rerender } = renderWithRoot(
      <>
        <Owner name="page" />
        <Owner name="row" />
      </>,
    );

    const result = openDialog({ actions }, { owner: 'page' });

    // The same tree with the row gone, so the page keeps its instance.
    rerender(
      <>
        <Owner name="page" />
        {null}
      </>,
    );

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await expect(result).resolves.toEqual({ resolved: 'confirm' });
  });

  it('keeps the identity of open across renders', () => {
    const { rerender } = renderWithRoot(<Owner />);
    const { open } = apis.owner;

    rerender(<Owner />);

    expect(apis.owner.open).toBe(open);
  });

  // A call after an `await`, from a component that is gone.
  it('is cancelled without opening when that component has unmounted', async () => {
    const onCancel = vi.fn();
    const { rerender } = renderWithRoot(<Owner />);

    rerender(<></>);

    const result = openDialog({ actions, onCancel });

    await expect(result).resolves.toEqual({ rejected: undefined });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  // StrictMode runs the unmount cleanup once on mount; that must not count.
  it('stays open under StrictMode', async () => {
    render(
      <StrictMode>
        <Root>
          <Owner />
        </Root>
      </StrictMode>,
    );

    const result = openDialog({ actions });

    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Delete',
      }),
    );

    await expect(result).resolves.toEqual({ resolved: 'confirm' });
  });

  // A row whose delete removes it: cut short, the delete would read as
  // cancelled.
  it('lets a running action finish when that component unmounts', async () => {
    const work = deferred();
    const onCancel = vi.fn();
    const { rerender } = renderWithRoot(<Owner />);

    const result = openDialog({
      actions,
      onCancel,
      onConfirm: () => work.promise,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    rerender(<></>);

    expect(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Delete',
      }),
    ).toHaveAttribute('data-loading');

    await act(async () => work.resolve());

    await expect(result).resolves.toEqual({ resolved: 'confirm' });
    expect(onCancel).not.toHaveBeenCalled();
    await dialogGone();
  });

  it('closes as a cancel when the running action then fails', async () => {
    const work = deferred();
    const onCancel = vi.fn();
    const { rerender } = renderWithRoot(<Owner />);

    const result = openDialog({
      actions,
      onCancel,
      onConfirm: () => work.promise,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    rerender(<></>);

    const error = new Error('Failed');

    await act(async () => work.reject(error));

    await expect(result).resolves.toEqual({ rejected: undefined });
    expect(globalThis.reportError).toHaveBeenCalledWith(error);
    expect(onCancel).toHaveBeenCalledTimes(1);
    await dialogGone();
  });

  // The same rule for a caller's own cancel token.
  it('lets a running action finish when the cancel token aborts', async () => {
    const work = deferred();
    const controller = new AbortController();

    renderWithRoot(<Owner />);

    const result = openDialog(
      { actions, onConfirm: () => work.promise },
      { signal: controller.signal },
    );

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    act(() => controller.abort());

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    await act(async () => work.resolve());

    await expect(result).resolves.toEqual({ resolved: 'confirm' });
  });
});
