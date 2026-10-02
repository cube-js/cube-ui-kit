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
});
