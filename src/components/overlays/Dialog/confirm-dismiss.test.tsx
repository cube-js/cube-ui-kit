import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';
import { Button } from '../../actions/Button/Button';
import { Content } from '../../content/Content';
import { Header } from '../../content/Header';
import { Title } from '../../content/Title';
import { TextInput } from '../../fields/TextInput/TextInput';
import { Form } from '../../form/Form/index';
import { createFormController } from '../../form/Form/modern/controller';

import { Dialog } from './Dialog';
import { DialogContainer } from './DialogContainer';
import { DialogForm } from './DialogForm';
import { DialogTrigger } from './DialogTrigger';

import type { CubeDialogTriggerProps } from './DialogTrigger';

interface Values {
  name: string;
}

function controller() {
  return createFormController<Values>({ defaultValues: { name: 'Initial' } });
}

function FormDialog({
  form = controller(),
  preserve,
  formConfirmDismiss,
  onDismiss,
  ...triggerProps
}: Partial<Omit<CubeDialogTriggerProps, 'children'>> & {
  form?: ReturnType<typeof controller>;
  preserve?: boolean;
  formConfirmDismiss?: boolean;
}) {
  return (
    <DialogTrigger onDismiss={onDismiss} {...triggerProps}>
      <Button>Open</Button>
      <DialogForm
        form={form}
        title="Profile"
        preserve={preserve}
        confirmDismiss={formConfirmDismiss}
      >
        <TextInput name="name" label="Name" />
        <Button onPress={() => form.setValue('name', 'From the server')}>
          Load
        </Button>
      </DialogForm>
    </DialogTrigger>
  );
}

async function open() {
  await userEvent.click(screen.getByRole('button', { name: 'Open' }));

  return screen.findByRole('textbox', { name: 'Name' });
}

async function edit() {
  const input = await open();

  await userEvent.clear(input);
  await userEvent.type(input, 'Edited');

  return input;
}

const question = () => screen.queryByRole('alertdialog');

async function expectClosed() {
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
}

describe('confirmDismiss', () => {
  it('closes a dialog without edits at once', async () => {
    renderWithRoot(<FormDialog />);

    await open();
    await userEvent.keyboard('{Escape}');

    await expectClosed();
    expect(question()).not.toBeInTheDocument();
  });

  it('asks before Escape discards edits, and Keep editing keeps them', async () => {
    const onDismiss = vi.fn();

    renderWithRoot(<FormDialog onDismiss={onDismiss} />);

    const input = await edit();

    await userEvent.keyboard('{Escape}');

    const alert = await screen.findByRole('alertdialog');

    expect(alert).toHaveTextContent('Discard changes?');
    // A reflexive Enter keeps editing.
    expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));

    await waitFor(() => expect(question()).not.toBeInTheDocument());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(input).toHaveValue('Edited');
    expect(input).toHaveFocus();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('keeps editing on Escape from the question itself', async () => {
    renderWithRoot(<FormDialog />);

    const input = await edit();

    await userEvent.keyboard('{Escape}');
    await screen.findByRole('alertdialog');
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(question()).not.toBeInTheDocument());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(input).toHaveValue('Edited');
  });

  it('closes on Discard from the close button, and focus goes back to the trigger', async () => {
    const onDismiss = vi.fn();

    renderWithRoot(<FormDialog onDismiss={onDismiss} />);

    await edit();
    await userEvent.click(screen.getByTestId('ModalCloseButton'));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Discard' }),
    );

    await expectClosed();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus(),
    );
    expect(await open()).toHaveValue('Initial');
  });

  it.each(['Cancel', 'Submit'])('closes on %s without asking', async (name) => {
    renderWithRoot(<FormDialog />);

    await edit();
    await userEvent.click(screen.getByRole('button', { name }));

    await expectClosed();
    expect(question()).not.toBeInTheDocument();
  });

  it.each([
    ['confirmDismiss={false} on the trigger', { confirmDismiss: false }],
    ['confirmDismiss={false} on the form', { formConfirmDismiss: false }],
    ['preserve', { preserve: true }],
    ['a popover', { type: 'popover' as const }],
  ])('closes with edits at once for %s', async (_, props) => {
    renderWithRoot(<FormDialog {...props} />);

    await edit();
    await userEvent.keyboard('{Escape}');

    await expectClosed();
    expect(question()).not.toBeInTheDocument();
  });

  it("lets the trigger's confirmDismiss win over the form's", async () => {
    renderWithRoot(<FormDialog confirmDismiss formConfirmDismiss={false} />);

    await open();
    await userEvent.keyboard('{Escape}');

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  });

  it('does not count a value set from code as an edit', async () => {
    renderWithRoot(<FormDialog />);

    const input = await open();

    await userEvent.click(screen.getByRole('button', { name: 'Load' }));
    expect(input).toHaveValue('From the server');
    await userEvent.keyboard('{Escape}');

    await expectClosed();
    expect(question()).not.toBeInTheDocument();
  });

  it('does not count a field the user only visited after code set it', async () => {
    renderWithRoot(<FormDialog />);

    const input = await open();

    await userEvent.click(screen.getByRole('button', { name: 'Load' }));
    await userEvent.click(input);
    await userEvent.tab();
    await userEvent.keyboard('{Escape}');

    await expectClosed();
    expect(question()).not.toBeInTheDocument();
  });

  it('asks when the form sets confirmDismiss, even without edits', async () => {
    renderWithRoot(<FormDialog formConfirmDismiss />);

    await open();
    await userEvent.keyboard('{Escape}');

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  });

  it("asks from a tray's hidden dismiss button", async () => {
    renderWithRoot(<FormDialog type="tray" />);

    await edit();

    // The visible close button shares its name; the hidden one has no `qa`.
    const hidden = screen
      .getAllByRole('button', { name: 'Dismiss' })
      .find((button) => !button.hasAttribute('data-qa'));

    await userEvent.click(hidden!);

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  });

  describe('on a phone', () => {
    beforeEach(() => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({
          matches: true,
          media: query,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('asks for a popover that opens as a modal', async () => {
      renderWithRoot(<FormDialog type="popover" mobileType="modal" />);

      await edit();
      await userEvent.keyboard('{Escape}');

      expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    });
  });

  it('neither closes nor asks when the dialog is not dismissable', async () => {
    renderWithRoot(<FormDialog isDismissable={false} />);

    await edit();
    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(question()).not.toBeInTheDocument();
  });

  it('never asks for a close the consumer calls', async () => {
    renderWithRoot(
      <DialogTrigger confirmDismiss>
        <Button>Open</Button>
        {(close) => (
          <Dialog>
            <Content>
              <Button onPress={close}>Done</Button>
            </Content>
          </Dialog>
        )}
      </DialogTrigger>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Done' }));

    await expectClosed();
    expect(question()).not.toBeInTheDocument();
  });

  it('asks in a DialogContainer bound to its own state', async () => {
    const onDismiss = vi.fn();

    renderWithRoot(
      <DialogContainer confirmDismiss onDismiss={onDismiss}>
        <Dialog>
          <Header>
            <Title>Notes</Title>
          </Header>
          <Content>Unsaved notes</Content>
        </Dialog>
      </DialogContainer>,
    );

    await userEvent.keyboard('{Escape}');
    await userEvent.click(
      await screen.findByRole('button', { name: 'Discard' }),
    );

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("lets the container's confirmDismiss win over unsaved edits", async () => {
    const onDismiss = vi.fn();
    const form = controller();

    renderWithRoot(
      <DialogContainer confirmDismiss={false} onDismiss={onDismiss}>
        <DialogForm form={form} title="Profile">
          <TextInput name="name" label="Name" />
        </DialogForm>
      </DialogContainer>,
    );

    const input = await screen.findByRole('textbox', { name: 'Name' });

    await userEvent.clear(input);
    await userEvent.type(input, 'Edited');
    await userEvent.keyboard('{Escape}');

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(question()).not.toBeInTheDocument();
  });

  it('takes the question away when the dialog closes from code', async () => {
    const notes = (
      <Dialog>
        <Header>
          <Title>Notes</Title>
        </Header>
        <Content>Unsaved notes</Content>
      </Dialog>
    );
    const { rerender } = renderWithRoot(
      <DialogContainer confirmDismiss onDismiss={() => {}}>
        {notes}
      </DialogContainer>,
    );

    await userEvent.keyboard('{Escape}');
    await screen.findByRole('alertdialog');

    rerender(
      <DialogContainer confirmDismiss isOpen={false} onDismiss={() => {}}>
        {notes}
      </DialogContainer>,
    );

    await expectClosed();
    await waitFor(() => expect(question()).not.toBeInTheDocument());
  });

  describe('legacy DialogForm', () => {
    function LegacyDialog() {
      const [form] = Form.useForm<Values>();

      return (
        <DialogTrigger>
          <Button>Open</Button>
          <DialogForm form={form} title="Profile">
            <TextInput name="name" label="Name" />
            <Button
              onPress={() => form.setFieldsValue({ name: 'From the server' })}
            >
              Load
            </Button>
          </DialogForm>
        </DialogTrigger>
      );
    }

    it('asks once the user edited a field', async () => {
      renderWithRoot(<LegacyDialog />);

      await edit();
      await userEvent.keyboard('{Escape}');

      expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    });

    it('does not count a value set from code as an edit', async () => {
      renderWithRoot(<LegacyDialog />);

      const input = await open();

      await userEvent.click(screen.getByRole('button', { name: 'Load' }));
      expect(input).toHaveValue('From the server');
      await userEvent.keyboard('{Escape}');

      await expectClosed();
      expect(question()).not.toBeInTheDocument();
    });
  });
});
