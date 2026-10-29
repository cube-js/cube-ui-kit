import { userEvent as browserEvent } from 'vitest/browser';

import { renderWithRoot, screen, waitFor, within } from '../../../test';
import { Button } from '../../actions/Button/Button';
import { TextInput } from '../../fields/TextInput/TextInput';
import { createFormController } from '../../form/Form/modern/controller';

import { DialogForm } from './DialogForm';
import { DialogTrigger } from './DialogTrigger';

/**
 * What jsdom cannot show for `confirmDismiss`: a click outside goes through
 * React Aria's interact-outside handling, which needs real pointer events, and
 * focus has to come back from the question while React Aria's `FocusScope`
 * still contains it there.
 */
describe('confirmDismiss in a browser', () => {
  function FormDialog() {
    const form = createFormController({ defaultValues: { name: '' } });

    return (
      <DialogTrigger>
        <Button>Open</Button>
        <DialogForm form={form} title="Profile">
          <TextInput name="name" label="Name" />
        </DialogForm>
      </DialogTrigger>
    );
  }

  async function openAndEdit() {
    await browserEvent.click(screen.getByRole('button', { name: 'Open' }));

    const input = await screen.findByRole('textbox', { name: 'Name' });

    await browserEvent.click(input);
    await browserEvent.keyboard('Draft');

    return input;
  }

  /** The underlay of the dialog, not of the question above it. */
  const clickOutside = () =>
    browserEvent.click(screen.getAllByTestId('Underlay')[0], {
      position: { x: 5, y: 5 },
    });

  it('asks on a click outside, and Keep editing gives focus back to the field', async () => {
    renderWithRoot(<FormDialog />);

    const input = await openAndEdit();

    await clickOutside();

    const question = await screen.findByRole('alertdialog');

    await waitFor(() =>
      expect(
        within(question).getByRole('button', { name: 'Keep editing' }),
      ).toHaveFocus(),
    );

    await browserEvent.click(
      within(question).getByRole('button', { name: 'Keep editing' }),
    );

    await waitFor(() => expect(input).toHaveFocus());
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    // Still there after the question faded out.
    expect(input).toHaveFocus();
    expect(input).toHaveValue('Draft');

    // Typing goes on in the field.
    await browserEvent.keyboard('s');
    expect(input).toHaveValue('Drafts');
  });

  it('closes on Discard, and focus goes back to the trigger', async () => {
    renderWithRoot(<FormDialog />);

    await openAndEdit();
    await browserEvent.keyboard('{Escape}');
    await browserEvent.click(
      await screen.findByRole('button', { name: 'Discard' }),
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus(),
    );
  });
});
