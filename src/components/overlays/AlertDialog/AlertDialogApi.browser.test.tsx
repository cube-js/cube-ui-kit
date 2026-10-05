import { userEvent as browserEvent } from 'vitest/browser';

import {
  act,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
  within,
} from '../../../test';

import { AlertDialogApi, useAlertDialogAPI } from './AlertDialogApiProvider';

/**
 * A dialog opened while the previous one is still animating out replaces it.
 * jsdom has no real exit animation, so this checks in a browser that the new
 * dialog ends up visible and interactive, and that the old one's cleanup does
 * not take it down.
 */
describe('useAlertDialogAPI() in a browser', () => {
  let api!: AlertDialogApi;

  function ApiGrabber() {
    api = useAlertDialogAPI();

    return null;
  }

  it('shows a dialog opened while the previous one is closing', async () => {
    renderWithRoot(<ApiGrabber />);

    let first!: Promise<unknown>;

    act(() => {
      first = api.open({ title: 'First', actions: { cancel: true } });
    });

    const firstRejection = expect(first).rejects.toEqual(undefined);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Cancel' }),
    );
    await firstRejection;

    let second!: Promise<unknown>;

    act(() => {
      second = api.open({ title: 'Second', actions: { confirm: true } });
    });

    await waitFor(() => {
      const dialog = screen.getByRole('alertdialog');

      expect(within(dialog).getByText('Second')).toBeVisible();
    });

    // Past the first dialog's 300 ms cleanup and its exit animation.
    await new Promise((resolve) => setTimeout(resolve, 600));

    const dialog = screen.getByRole('alertdialog');

    expect(within(dialog).getByText('Second')).toBeVisible();
    expect(screen.queryByText('First')).not.toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Ok' }));
    await expect(second).resolves.toBe('confirm');
  });

  /**
   * A click outside goes through React Aria's interact-outside handling, which
   * needs real pointer events. The first dialog proves that click dismisses;
   * the second that it is ignored while `onConfirm` runs.
   */
  it('ignores a click outside while onConfirm runs', async () => {
    const clickOutside = () =>
      browserEvent.click(screen.getByTestId('Underlay'), {
        position: { x: 5, y: 5 },
      });

    renderWithRoot(<ApiGrabber />);

    let idle!: Promise<unknown>;

    act(() => {
      idle = api.open({ title: 'Idle', actions: { confirm: true } });
    });

    const idleRejection = expect(idle).rejects.toEqual(undefined);

    await screen.findByRole('alertdialog');
    await clickOutside();
    await idleRejection;
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );

    let finish!: () => void;
    let busy!: Promise<unknown>;

    act(() => {
      busy = api.open({
        title: 'Busy',
        actions: { confirm: { children: 'Delete' }, cancel: true },
        onConfirm: () => new Promise<void>((resolve) => (finish = resolve)),
      });
    });

    const dialog = await screen.findByRole('alertdialog');
    const confirmButton = within(dialog).getByRole('button', {
      name: 'Delete',
    });

    await browserEvent.click(confirmButton);

    expect(confirmButton).toHaveAttribute('data-loading');
    expect(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    ).toBeDisabled();

    await clickOutside();
    await browserEvent.keyboard('{Escape}');
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(screen.getByRole('alertdialog')).toBeVisible();

    act(() => finish());

    await expect(busy).resolves.toBe('confirm');
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
  });
});
