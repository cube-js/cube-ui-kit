import { renderWithRoot, screen, userEvent, waitFor } from '../../../../test';
import { Button } from '../../../actions/Button/Button';
import { Content } from '../../../content/Content';
import { Paragraph } from '../../../content/Paragraph';
import { Dialog } from '../../Dialog/Dialog';
import { DialogContainer } from '../../Dialog/DialogContainer';
import { DialogTrigger } from '../../Dialog/DialogTrigger';
import { AlertDialog, CubeAlertDialogProps } from '../AlertDialog';

vi.mock('../../../../_internal/hooks/use-warn');

function renderAlertDialog(props: Partial<CubeAlertDialogProps> = {}) {
  return renderWithRoot(
    <DialogContainer isOpen onDismiss={() => {}}>
      <AlertDialog
        title="Delete project?"
        content="This cannot be undone."
        {...props}
      />
    </DialogContainer>,
  );
}

// Past `Dialog`'s own focus pass, which runs a tick after it opens.
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

describe('<AlertDialog /> description', () => {
  it('describes the alert dialog by its message', async () => {
    renderAlertDialog();

    expect(await screen.findByRole('alertdialog')).toHaveAccessibleDescription(
      'This cannot be undone.',
    );
  });

  it('describes a plain dialog by nothing, so its form is not read on open', async () => {
    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <Dialog aria-label="Rename">
          <Content>
            <Paragraph>Pick a new name</Paragraph>
          </Content>
        </Dialog>
      </DialogContainer>,
    );

    expect(await screen.findByRole('dialog')).not.toHaveAttribute(
      'aria-describedby',
    );
  });

  // The message id reaches `Content` through a slot, and slots reach nested
  // dialogs too: a dialog opened from the alert must not repeat the id.
  it('keeps its message id to its own message', async () => {
    renderAlertDialog({
      content: (
        <DialogTrigger type="popover">
          <Button qa="Inner">Open inner</Button>
          <Dialog aria-label="Inner">
            <Content qa="InnerContent">Inner body</Content>
          </Dialog>
        </DialogTrigger>
      ),
    });

    const alert = await screen.findByRole('alertdialog');

    await waitFor(() => expect(alert).toHaveAttribute('aria-describedby'));
    await userEvent.click(screen.getByTestId('Inner'));

    const innerContent = await screen.findByTestId('InnerContent');
    const id = alert.getAttribute('aria-describedby');

    expect(innerContent).not.toHaveAttribute('id');
    expect(document.querySelectorAll(`[id="${id}"]`)).toHaveLength(1);
  });

  it('keeps an explicit aria-describedby', async () => {
    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <Dialog aria-label="Rename" aria-describedby="hint">
          <Content>
            <Paragraph id="hint">Names must be unique</Paragraph>
            <Paragraph>Pick a new name</Paragraph>
          </Content>
        </Dialog>
      </DialogContainer>,
    );

    expect(await screen.findByRole('dialog')).toHaveAccessibleDescription(
      'Names must be unique',
    );
  });
});

describe('<AlertDialog /> initial focus', () => {
  it('focuses Cancel, not the destructive action, in a danger dialog', async () => {
    renderAlertDialog({
      danger: true,
      actions: { confirm: { children: 'Delete' }, cancel: true },
    });

    const cancel = await screen.findByRole('button', { name: 'Cancel' });

    await waitFor(() => expect(cancel).toHaveFocus());
    await settle();
    expect(cancel).toHaveFocus();
  });

  it('focuses the dialog itself in a danger dialog without Cancel', async () => {
    renderAlertDialog({
      danger: true,
      actions: { confirm: { children: 'Delete' } },
    });

    const dialog = await screen.findByRole('alertdialog');

    await waitFor(() => expect(dialog).toHaveFocus());
    await settle();
    expect(dialog).toHaveFocus();
  });

  it('does not run the destructive action on an Enter right after opening', async () => {
    const onDelete = vi.fn();

    renderAlertDialog({
      danger: true,
      actions: { confirm: { children: 'Delete', onPress: onDelete } },
    });

    await waitFor(() => expect(screen.getByRole('alertdialog')).toHaveFocus());
    await settle();
    await userEvent.keyboard('{Enter}');

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('focuses a confirm button that asks for it, even in a danger dialog', async () => {
    renderAlertDialog({
      danger: true,
      actions: {
        confirm: { children: 'Delete', autoFocus: true },
        cancel: true,
      },
    });

    const confirm = await screen.findByRole('button', { name: 'Delete' });

    await waitFor(() => expect(confirm).toHaveFocus());
    await settle();
    expect(confirm).toHaveFocus();
  });

  it('still focuses the confirm button in a dialog without danger', async () => {
    renderAlertDialog({
      actions: { confirm: { children: 'Save' }, cancel: true },
    });

    const confirm = await screen.findByRole('button', { name: 'Save' });

    await waitFor(() => expect(confirm).toHaveFocus());
    await settle();
    expect(confirm).toHaveFocus();
  });
});
