import { userEvent } from 'vitest/browser';

import { act, renderWithRoot, screen, waitFor } from '../../../test';
import { ComboBox } from '../../fields/ComboBox/ComboBox';
import { Select } from '../../fields/Select/Select';
import { createFormController } from '../../form/Form/modern/controller';

import { DialogContainer } from './DialogContainer';
import { DialogForm } from './DialogForm';

/**
 * A modern `DialogForm` (one driven by a controller) used to mark its whole
 * `<form>` `data-popover-keep`, which a field's listbox reads as "never close
 * on a click here". So an open `ComboBox` or `Select` stayed open on a click
 * anywhere in the dialog and closed only on a click outside it (CUB-5251).
 * The legacy branch never set the attribute. Real clicks need a browser:
 * whether the click moves focus, and where, is what decides it.
 */

type Values = { fruit: string };

function renderDialog(field: 'combobox' | 'select', modern: boolean) {
  const body = (
    <>
      <p data-qa="Blank">Blank space</p>
      {field === 'combobox' ? (
        <ComboBox name="fruit" label="Fruit">
          <ComboBox.Item key="pear">Pear</ComboBox.Item>
          <ComboBox.Item key="peach">Peach</ComboBox.Item>
        </ComboBox>
      ) : (
        <Select name="fruit" label="Fruit">
          <Select.Item key="pear">Pear</Select.Item>
          <Select.Item key="peach">Peach</Select.Item>
        </Select>
      )}
    </>
  );

  renderWithRoot(
    <DialogContainer isOpen onDismiss={() => {}}>
      {modern ? (
        <DialogForm
          form={createFormController<Values>({ defaultValues: {} })}
          title="Delivery"
          onSubmit={() => {}}
        >
          {body}
        </DialogForm>
      ) : (
        <DialogForm title="Delivery" onSubmit={() => {}}>
          {body}
        </DialogForm>
      )}
    </DialogContainer>,
  );
}

describe('DialogForm: a field listbox closes on a click inside the dialog', () => {
  for (const modern of [true, false]) {
    const branch = modern ? 'modern' : 'legacy';

    it(`ComboBox (${branch})`, async () => {
      renderDialog('combobox', modern);

      const input = await screen.findByRole('combobox', { name: 'Fruit' });

      await act(() => userEvent.click(input));
      await act(() => userEvent.keyboard('{ArrowDown}'));
      await waitFor(() => expect(screen.getByRole('listbox')).toBeVisible());

      await act(() => userEvent.click(screen.getByTestId('Blank')));

      await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
      expect(screen.getByTestId('Dialog')).toBeInTheDocument();
    });

    it(`Select (${branch})`, async () => {
      renderDialog('select', modern);

      const trigger = await screen.findByRole('button', { name: /Fruit/ });

      await act(() => userEvent.click(trigger));
      await waitFor(() => expect(screen.getByRole('listbox')).toBeVisible());

      await act(() => userEvent.click(screen.getByTestId('Blank')));

      await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
      expect(screen.getByTestId('Dialog')).toBeInTheDocument();
    });
  }
});
