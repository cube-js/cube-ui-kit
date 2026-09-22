import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';
import { TextInput } from '../../fields/TextInput/TextInput';
import { Form } from '../../form/Form/index';

import { DialogContext } from './context';
import { DialogForm } from './DialogForm';

function LegacyFixture({
  preserve = false,
  onSubmit = vi.fn(),
  onClose = vi.fn(),
  onDismiss = vi.fn(),
}) {
  const [form] = Form.useForm<{ name: string }>();
  return (
    <DialogContext.Provider value={{ onClose }}>
      <DialogForm
        form={form}
        title="Legacy"
        preserve={preserve}
        defaultValues={{ name: 'Initial' }}
        onSubmit={onSubmit}
        onDismiss={onDismiss}
      >
        <TextInput name="name" label="Name" />
      </DialogForm>
    </DialogContext.Provider>
  );
}

describe('DialogForm legacy compatibility', () => {
  it.each([false, true])(
    'retains the legacy cancel/reset contract with preserve=%s',
    async (preserve) => {
      const close = vi.fn();
      const dismiss = vi.fn();
      renderWithRoot(
        <LegacyFixture
          preserve={preserve}
          onClose={close}
          onDismiss={dismiss}
        />,
      );
      const input = screen.getByRole('textbox', { name: 'Name' });
      await userEvent.clear(input);
      await userEvent.type(input, 'Edited');
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(close).toHaveBeenCalledTimes(1);
      expect(dismiss).toHaveBeenCalledTimes(1);
      expect(input).toHaveValue('Edited');
      if (!preserve) await waitFor(() => expect(input).toHaveValue('Initial'));
    },
  );

  it('keeps legacy callback payloads and closes after a successful save', async () => {
    const save = vi.fn();
    const close = vi.fn();
    renderWithRoot(<LegacyFixture onSubmit={save} onClose={close} />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(save).toHaveBeenCalledExactlyOnceWith({ name: 'Initial' });
  });
});
