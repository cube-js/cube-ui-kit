import {
  act,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../../test';

import { createFormController } from './controller';
import { DialogFixture } from './dialog.fixture';

import type { DialogValues } from './dialog.fixture';

describe('modern DialogForm in Chromium', () => {
  it('submits with Enter, closes, and restores focus', async () => {
    const save = vi.fn();
    const form = createFormController<DialogValues>({
      defaultValues: { profile: { name: 'Initial' } },
    });
    renderWithRoot(
      <DialogFixture form={form} onSubmit={save} hideOnClose={false} />,
    );
    const input = await screen.findByRole('textbox', { name: 'Name' });
    await userEvent.clear(input);
    await userEvent.type(input, 'Saved');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save.mock.calls[0][0]).toEqual({ profile: { name: 'Saved' } });
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    const open = screen.getByRole('button', { name: 'Open' });
    await userEvent.click(open);
    expect(await screen.findByRole('textbox', { name: 'Name' })).toHaveValue(
      'Initial',
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(open).toHaveFocus());
  });

  it('Escape cancels pending work even when hidden dialogs preserve drafts', async () => {
    let resolve!: () => void;
    let signal!: AbortSignal;
    const save = vi.fn((_values, context) => {
      signal = context.signal;
      return new Promise<void>((done) => {
        resolve = done;
      });
    });
    const form = createFormController<DialogValues>({
      defaultValues: { profile: { name: null } },
      onSubmit: save,
    });
    renderWithRoot(<DialogFixture form={form} preserve />);
    await userEvent.type(
      await screen.findByRole('textbox', { name: 'Name' }),
      'Draft',
    );
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(signal.aborted).toBe(true));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const input = await screen.findByRole('textbox', { name: 'Name' });
    expect(input).toHaveValue('Draft');
    await userEvent.clear(input);
    await userEvent.type(input, 'New draft');
    await act(async () => resolve());
    expect(input).toHaveValue('New draft');
    expect(screen.getByRole('dialog')).toBeVisible();
  });
});
