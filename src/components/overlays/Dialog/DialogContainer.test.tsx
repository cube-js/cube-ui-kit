import { renderWithRoot, userEvent, waitFor } from '../../../test';

import { Dialog } from './Dialog';
import { DialogContainer } from './DialogContainer';

describe('<DialogContainer />', () => {
  it('retains a conditional dialog and its input state with hideOnClose', async () => {
    const dialog = (
      <Dialog>
        <input aria-label="Name" defaultValue="Initial" />
      </Dialog>
    );
    const { getByRole, getByTestId, rerender } = renderWithRoot(
      <DialogContainer hideOnClose>{dialog}</DialogContainer>,
    );

    const updatedDialog = (
      <Dialog key="updated">
        <input aria-label="Name" defaultValue="Updated" />
      </Dialog>
    );
    rerender(<DialogContainer hideOnClose>{updatedDialog}</DialogContainer>);

    const input = getByRole('textbox', { name: 'Name' });
    await userEvent.clear(input);
    await userEvent.type(input, 'Draft');

    rerender(<DialogContainer hideOnClose>{null}</DialogContainer>);

    await waitFor(() => {
      expect(getByTestId('Modal')).toHaveAttribute('data-unmounted');
    });
    expect(input).toBeInTheDocument();
    expect(input).not.toBeVisible();

    rerender(<DialogContainer hideOnClose>{updatedDialog}</DialogContainer>);

    expect(getByRole('textbox', { name: 'Name' })).toBe(input);
    expect(input).toHaveValue('Draft');
  });

  it('unmounts a conditional dialog after exit by default', async () => {
    const { getByRole, rerender } = renderWithRoot(
      <DialogContainer>
        <Dialog>
          <input aria-label="Name" defaultValue="Initial" />
        </Dialog>
      </DialogContainer>,
    );
    const input = getByRole('textbox', { name: 'Name' });

    rerender(<DialogContainer>{null}</DialogContainer>);

    await waitFor(() => {
      expect(input).not.toBeInTheDocument();
    });
  });
});
