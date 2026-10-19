import { renderWithRoot, userEvent, waitFor } from '../../../test';

import { Dialog } from './Dialog';
import { DialogContainer } from './DialogContainer';

describe.each(['modal', 'tray'] as const)(
  '<DialogContainer type=%s />',
  (type) => {
    it.each([
      [true, false, true],
      [false, false, false],
      [true, true, false],
    ])(
      'honors passive dismissal (dismissable=%s, keyboard disabled=%s)',
      async (isDismissable, isKeyboardDismissDisabled, shouldDismiss) => {
        const onDismiss = vi.fn();
        const { getByRole } = renderWithRoot(
          <DialogContainer
            type={type}
            isOpen
            isDismissable={isDismissable}
            isKeyboardDismissDisabled={isKeyboardDismissDisabled}
            onDismiss={onDismiss}
          >
            <Dialog aria-label="Chat" isDismissable={false}>
              <input aria-label="Message" />
            </Dialog>
          </DialogContainer>,
        );
        await userEvent.click(getByRole('textbox', { name: 'Message' }));
        await userEvent.keyboard('{Escape}');
        expect(onDismiss).toHaveBeenCalledTimes(shouldDismiss ? 1 : 0);
      },
    );

    it('keeps explicit dialog dismissal available when passive dismissal is disabled', async () => {
      const onDismiss = vi.fn();
      const { getByTestId } = renderWithRoot(
        <DialogContainer
          type={type}
          isOpen
          isDismissable={false}
          onDismiss={onDismiss}
        >
          <Dialog aria-label="Chat" isDismissable>
            <input aria-label="Message" />
          </Dialog>
        </DialogContainer>,
      );
      await userEvent.click(getByTestId('ModalCloseButton'));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('retains a conditional dialog and its input state with hideOnClose', async () => {
      const dialog = (
        <Dialog>
          <input aria-label="Name" defaultValue="Initial" />
        </Dialog>
      );
      const { getByRole, getByTestId, rerender } = renderWithRoot(
        <DialogContainer type={type} hideOnClose>
          {dialog}
        </DialogContainer>,
      );

      const updatedDialog = (
        <Dialog key="updated">
          <input aria-label="Name" defaultValue="Updated" />
        </Dialog>
      );
      rerender(
        <DialogContainer type={type} hideOnClose>
          {updatedDialog}
        </DialogContainer>,
      );

      const input = getByRole('textbox', { name: 'Name' });
      await userEvent.clear(input);
      await userEvent.type(input, 'Draft');

      rerender(
        <DialogContainer type={type} hideOnClose>
          {null}
        </DialogContainer>,
      );

      await waitFor(() => {
        expect(getByTestId(type === 'tray' ? 'Tray' : 'Modal')).toHaveAttribute(
          'data-unmounted',
        );
      });
      expect(input).toBeInTheDocument();
      expect(input).not.toBeVisible();

      rerender(
        <DialogContainer type={type} hideOnClose>
          {updatedDialog}
        </DialogContainer>,
      );

      expect(getByRole('textbox', { name: 'Name' })).toBe(input);
      expect(input).toHaveValue('Draft');
    });

    it('does not show a retained dialog when explicitly reopened without children', async () => {
      const { getByRole, getByTestId, rerender } = renderWithRoot(
        <DialogContainer type={type} hideOnClose isOpen>
          <Dialog>
            <input aria-label="Name" />
          </Dialog>
        </DialogContainer>,
      );
      const input = getByRole('textbox', { name: 'Name' });

      rerender(<DialogContainer type={type} hideOnClose isOpen={false} />);

      await waitFor(() => {
        expect(getByTestId(type === 'tray' ? 'Tray' : 'Modal')).toHaveAttribute(
          'data-unmounted',
        );
      });
      expect(input).toBeInTheDocument();

      rerender(<DialogContainer type={type} hideOnClose isOpen />);

      expect(input).not.toBeInTheDocument();

      rerender(<DialogContainer type={type} hideOnClose isOpen={false} />);

      await waitFor(() => {
        expect(getByTestId(type === 'tray' ? 'Tray' : 'Modal')).toHaveAttribute(
          'data-unmounted',
        );
      });
      expect(input).not.toBeInTheDocument();
    });

    it('unmounts a conditional dialog after exit by default', async () => {
      const { getByRole, rerender } = renderWithRoot(
        <DialogContainer type={type}>
          <Dialog>
            <input aria-label="Name" defaultValue="Initial" />
          </Dialog>
        </DialogContainer>,
      );
      const input = getByRole('textbox', { name: 'Name' });

      rerender(<DialogContainer type={type}>{null}</DialogContainer>);

      await waitFor(() => {
        expect(input).not.toBeInTheDocument();
      });
    });
  },
);
