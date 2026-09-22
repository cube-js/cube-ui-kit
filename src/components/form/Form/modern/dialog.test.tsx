import { StrictMode } from 'react';

import {
  act,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../../test';
import { Button } from '../../../actions/Button/Button';
import { TextInput } from '../../../fields/TextInput/TextInput';
import { DialogContainer } from '../../../overlays/Dialog/DialogContainer';
import { DialogForm } from '../../../overlays/Dialog/DialogForm';
import { DialogTrigger } from '../../../overlays/Dialog/DialogTrigger';
import { Form } from '../index';

import { createFormController } from './controller';
import { DialogFixture, PopoverDialogFixture } from './dialog.fixture';

import type { DialogValues } from './dialog.fixture';

function controller(
  onSubmit?: NonNullable<
    Parameters<typeof createFormController<DialogValues>>[0]
  >['onSubmit'],
) {
  return createFormController<DialogValues>({
    defaultValues: { profile: { name: 'Initial' }, hidden: 'retained' },
    onSubmit,
  });
}

async function edit(value = 'Edited') {
  const input = screen.getByRole('textbox', { name: 'Name' });
  await userEvent.clear(input);
  await userEvent.type(input, value);
  return input;
}

async function reopen() {
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  await userEvent.click(screen.getByRole('button', { name: 'Open' }));
  return screen.findByRole('textbox', { name: 'Name' });
}

describe('modern DialogForm', () => {
  it.each(['button', 'controller'] as const)(
    'submits through %s, calls the hook callback, closes, and resets',
    async (source) => {
      const save = vi.fn();
      const form = controller(save);
      renderWithRoot(<DialogFixture form={form} />);
      await edit();
      expect(screen.getByText('Modified')).toBeInTheDocument();
      if (source === 'button') {
        await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
      } else {
        await act(async () =>
          expect(await form.submit()).toEqual({ status: 'submitted' }),
        );
      }
      await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
      expect(save.mock.calls[0][0]).toEqual({ profile: { name: 'Edited' } });
      expect(save.mock.calls[0][1].signal.aborted).toBe(false);
      expect(await reopen()).toHaveValue('Initial');
    },
  );

  it('uses the latest root callback and restores the hook fallback when omitted', async () => {
    const hook = vi.fn();
    const first = vi.fn();
    const latest = vi.fn();
    const form = controller(hook);
    const view = renderWithRoot(
      <DialogFixture form={form} onSubmit={first} preserve />,
    );
    view.rerender(<DialogFixture form={form} onSubmit={latest} preserve />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await reopen();
    view.rerender(<DialogFixture form={form} preserve />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(hook).toHaveBeenCalledTimes(1));
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog open for validation and server errors, then allows retry', async () => {
    const save = vi
      .fn()
      .mockRejectedValueOnce('Server unavailable')
      .mockResolvedValue(undefined);
    const failure = vi.fn();
    const form = createFormController<DialogValues>({
      defaultValues: { profile: { name: null } },
    });
    renderWithRoot(
      <DialogFixture
        form={form}
        required
        onSubmit={save}
        onSubmitFailed={failure}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() =>
      expect(failure).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'invalid' }),
      ),
    );
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await edit();
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await screen.findByText('Server unavailable');
    expect(failure).toHaveBeenLastCalledWith({
      status: 'failed',
      error: 'Server unavailable',
    });
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(save).toHaveBeenCalledTimes(2);
    expect(form.getValue(['profile', 'name'])).toBeNull();
  });

  it.each([false, true])(
    'cancel respects preserve=%s through reopening',
    async (preserve) => {
      const dismiss = vi.fn();
      const form = controller();
      renderWithRoot(
        <DialogFixture form={form} preserve={preserve} onDismiss={dismiss} />,
      );
      await edit();
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(await reopen()).toHaveValue(preserve ? 'Edited' : 'Initial');
      expect(dismiss).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['Escape', 'close button', 'external'] as const)(
    'ends the editing session on %s',
    async (source) => {
      const form = controller();
      renderWithRoot(<DialogFixture form={form} />);
      await edit();
      if (source === 'Escape') await userEvent.keyboard('{Escape}');
      if (source === 'close button')
        await userEvent.click(screen.getByTestId('ModalCloseButton'));
      if (source === 'external')
        await userEvent.click(
          screen.getByRole('button', { name: 'Close externally' }),
        );
      expect(await reopen()).toHaveValue('Initial');
    },
  );

  it.each([false, true])(
    'cancels a pending request with preserve=%s without closing a reopened dialog',
    async (preserve) => {
      let resolve!: () => void;
      let signal!: AbortSignal;
      const save = vi.fn((_values, context) => {
        signal = context.signal;
        return new Promise<void>((done) => {
          resolve = done;
        });
      });
      const form = controller(save);
      renderWithRoot(<DialogFixture form={form} preserve={preserve} />);
      await edit();
      let result!: ReturnType<typeof form.submit>;
      act(() => {
        result = form.submit();
      });
      await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
      await act(async () =>
        expect(await form.submit()).toEqual({
          status: 'ignored',
          reason: 'submitting',
        }),
      );
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(signal.aborted).toBe(true);
      expect(await result).toEqual({ status: 'stale' });
      const input = await reopen();
      await edit('New session');
      await act(async () => resolve());
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(input).toHaveValue('New session');
    },
  );

  it('controlled closing cancels immediately, before exit animation or reopening', async () => {
    let resolve!: () => void;
    let signal!: AbortSignal;
    const save = vi.fn((_values, context) => {
      signal = context.signal;
      return new Promise<void>((done) => {
        resolve = done;
      });
    });
    const form = controller(save);
    const content = (
      <DialogForm form={form} title="Profile" preserve>
        <TextInput name={['profile', 'name']} label="Name" />
      </DialogForm>
    );
    const close = vi.fn();
    const view = renderWithRoot(
      <DialogContainer isOpen onDismiss={close}>
        {content}
      </DialogContainer>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    view.rerender(
      <DialogContainer isOpen={false} onDismiss={close}>
        {content}
      </DialogContainer>,
    );
    expect(signal.aborted).toBe(true);
    view.rerender(
      <DialogContainer isOpen onDismiss={close}>
        {content}
      </DialogContainer>,
    );
    await act(async () => resolve());
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Initial',
    );
  });

  it('switching controllers cancels the old request without ending the new editing session', async () => {
    let resolve!: () => void;
    const oldSave = vi.fn(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    const oldForm = controller(oldSave);
    const nextForm = controller();
    const view = renderWithRoot(<DialogFixture form={oldForm} />);
    await edit('Old draft');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(oldSave).toHaveBeenCalledTimes(1));
    view.rerender(<DialogFixture form={nextForm} />);
    await edit('Next controller');
    await act(async () => resolve());
    expect(oldForm.getValue(['profile', 'name'])).toBe('Initial');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(nextForm.getValue(['profile', 'name'])).toBe('Next controller');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await reopen()).toHaveValue('Initial');
  });

  it('custom actions use the same dismissal lifecycle', async () => {
    const form = controller();
    const dismiss = vi.fn();
    renderWithRoot(
      <DialogFixture form={form} noActions onDismiss={dismiss}>
        {(close) => (
          <button type="button" onClick={close}>
            Discard edits
          </button>
        )}
      </DialogFixture>,
    );
    expect(
      screen.queryByRole('button', { name: 'Submit' }),
    ).not.toBeInTheDocument();
    await edit();
    await userEvent.click(
      screen.getByRole('button', { name: 'Discard edits' }),
    );
    expect(await reopen()).toHaveValue('Initial');
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])(
    'detached controllers retain edits only with preserve=%s',
    async (preserve) => {
      const oldForm = controller();
      const nextForm = controller();
      const view = renderWithRoot(
        <DialogFixture form={oldForm} preserve={preserve} />,
      );
      await edit('Old draft');
      // Each controller keeps the policy from its own last committed session.
      view.rerender(<DialogFixture form={nextForm} preserve={!preserve} />);
      await edit('New draft');
      expect(oldForm.getValue(['profile', 'name'])).toBe(
        preserve ? 'Old draft' : 'Initial',
      );
      expect(nextForm.getValue(['profile', 'name'])).toBe('New draft');
      view.rerender(<DialogFixture form={oldForm} preserve={preserve} />);
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
        preserve ? 'Old draft' : 'Initial',
      );
      await act(async () => {});
      expect(nextForm.getValue(['profile', 'name'])).toBe(
        preserve ? 'Initial' : 'New draft',
      );
    },
  );

  it.each([false, true])(
    'popover customActions=%s stays open through validation, failed saves, and pending retries',
    async (customActions) => {
      let resolve!: () => void;
      let signal!: AbortSignal;
      const failure = vi.fn();
      const save = vi
        .fn()
        .mockRejectedValueOnce('Save failed')
        .mockImplementation((_values, context) => {
          signal = context.signal;
          return new Promise<void>((done) => {
            resolve = done;
          });
        });
      const form = createFormController<DialogValues>({
        defaultValues: { profile: { name: null } },
        onSubmit: save,
        onSubmitFailed: failure,
      });
      renderWithRoot(
        <PopoverDialogFixture form={form} noActions={customActions}>
          {customActions ? <Form.Submit>Submit</Form.Submit> : null}
        </PopoverDialogFixture>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
      await waitFor(() =>
        expect(failure).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'invalid' }),
        ),
      );
      expect(save).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      await edit('Draft');
      await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
      await screen.findByText('Save failed');
      await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
      await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
      expect(signal.aborted).toBe(false);
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
        'Draft',
      );
      await act(async () => resolve());
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
      expect(signal.aborted).toBe(false);
    },
  );

  it('cancels in-flight submit validation without calling save', async () => {
    let resolve!: () => void;
    let signal!: AbortSignal;
    const save = vi.fn();
    const form = controller(save);
    renderWithRoot(
      <DialogFixture form={form} preserve>
        <TextInput
          name="hidden"
          label="Remote validation"
          rules={[
            {
              validator: (_rule, _value, context) => {
                signal = context.signal;
                return new Promise<void>((done) => {
                  resolve = done;
                });
              },
            },
          ]}
        />
      </DialogFixture>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(signal).toBeDefined());
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(signal.aborted).toBe(true);
    await reopen();
    await act(async () => resolve());
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it.each([true, false])(
    'explicit actions close a triggered dialog with isDismissable=%s',
    async (isDismissable) => {
      const save = vi.fn();
      const form = controller(save);
      renderWithRoot(
        <DialogTrigger defaultOpen isDismissable={isDismissable}>
          <Button>Open</Button>
          <DialogForm form={form} title="Profile">
            <TextInput name={['profile', 'name']} label="Name" />
          </DialogForm>
        </DialogTrigger>,
      );
      if (!isDismissable) {
        await userEvent.keyboard('{Escape}');
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      }
      await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
      await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      await userEvent.click(
        await screen.findByRole('button', { name: 'Cancel' }),
      );
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
    },
  );

  it('reset cancels a pending submission without dismissing the dialog', async () => {
    let resolve!: () => void;
    const save = vi.fn(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    const form = controller(save);
    renderWithRoot(<DialogFixture form={form} />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    act(() => form.reset());
    await act(async () => resolve());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it.each([false, true])(
    'real unmount resets unless preserved (%s), while Strict Mode reconnect keeps edits',
    async (preserve) => {
      const form = controller();
      act(() => form.setValue(['profile', 'name'], 'Before mount'));
      const view = renderWithRoot(
        <StrictMode>
          <DialogFixture form={form} preserve={preserve} />
        </StrictMode>,
      );
      await act(async () => {});
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
        'Before mount',
      );
      await edit();
      view.unmount();
      await act(async () => {});
      expect(form.getValue(['profile', 'name'])).toBe(
        preserve ? 'Edited' : 'Initial',
      );
    },
  );

  it('forwards submitValues, disabled state, and native reset interception to the form', async () => {
    const save = vi.fn();
    const reset = vi.fn((event) => event.preventDefault());
    const form = controller(save);
    const view = renderWithRoot(
      <DialogFixture
        form={form}
        submitValues="all"
        isDisabled
        onReset={reset}
      />,
    );
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled();
    view.rerender(
      <DialogFixture form={form} submitValues="all" onReset={reset}>
        <button type="reset">Reset</button>
      </DialogFixture>,
    );
    await edit();
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(form.getValue(['profile', 'name'])).toBe('Edited');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save.mock.calls[0][0]).toEqual({
      profile: { name: 'Edited' },
      hidden: 'retained',
    });
  });
});
