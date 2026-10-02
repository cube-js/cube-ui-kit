import { userEvent } from 'vitest/browser';

import { act, renderWithRoot, screen, waitFor } from '../../../test';
import { ComboBox } from '../../fields/ComboBox/ComboBox';
import { FilterPicker } from '../../fields/FilterPicker/FilterPicker';
import { Picker } from '../../fields/Picker/Picker';
import { Select } from '../../fields/Select/Select';
import { createFormController } from '../../form/Form/modern/controller';

import { DialogContainer } from './DialogContainer';
import { DialogForm } from './DialogForm';

/**
 * A modern `DialogForm` (one driven by a controller) marked its whole `<form>`
 * `data-popover-keep`, so a press on its buttons would not dismiss a popover
 * the dialog lives in. A field's listbox reads the same attribute as "a click
 * here is not outside me", so an open `ComboBox`, `Select`, `Picker` or
 * `FilterPicker` stayed open on a click anywhere in the dialog and closed only
 * on a click outside it (CUB-5251). The form now opts out of press dismissal
 * alone, with `data-popover-keep-on-press`. The legacy branch never set either.
 * Real clicks need a browser: whether the click moves focus, and where, is
 * what decides it.
 */

type Values = { fruit: string };

type Field = 'combobox' | 'select' | 'picker' | 'filter-picker';

function renderField(field: Field) {
  switch (field) {
    case 'combobox':
      return (
        <ComboBox name="fruit" label="Fruit">
          <ComboBox.Item key="pear">Pear</ComboBox.Item>
          <ComboBox.Item key="peach">Peach</ComboBox.Item>
        </ComboBox>
      );
    case 'select':
      return (
        <Select name="fruit" label="Fruit">
          <Select.Item key="pear">Pear</Select.Item>
          <Select.Item key="peach">Peach</Select.Item>
        </Select>
      );
    case 'picker':
      return (
        <Picker name="fruit" label="Fruit" placeholder="Pick a fruit">
          <Picker.Item key="pear">Pear</Picker.Item>
          <Picker.Item key="peach">Peach</Picker.Item>
        </Picker>
      );
    case 'filter-picker':
      return (
        <FilterPicker name="fruit" label="Fruit" placeholder="Pick a fruit">
          <FilterPicker.Item key="pear">Pear</FilterPicker.Item>
          <FilterPicker.Item key="peach">Peach</FilterPicker.Item>
        </FilterPicker>
      );
  }
}

function renderDialog(field: Field, modern: boolean) {
  const body = (
    <>
      <p data-qa="Blank">Blank space</p>
      {renderField(field)}
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

async function expectClosesOnBlankClick() {
  await waitFor(() => expect(screen.getByRole('listbox')).toBeVisible());

  await act(() => userEvent.click(screen.getByTestId('Blank')));

  await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
  expect(screen.getByTestId('Dialog')).toBeInTheDocument();
}

describe('DialogForm: a field listbox closes on a click inside the dialog', () => {
  for (const modern of [true, false]) {
    const branch = modern ? 'modern' : 'legacy';

    it(`ComboBox (${branch})`, async () => {
      renderDialog('combobox', modern);

      const input = await screen.findByRole('combobox', { name: 'Fruit' });

      await act(() => userEvent.click(input));
      await act(() => userEvent.keyboard('{ArrowDown}'));
      await expectClosesOnBlankClick();
    });

    for (const field of ['select', 'picker', 'filter-picker'] as const) {
      it(`${field} (${branch})`, async () => {
        renderDialog(field, modern);

        const trigger = await screen.findByRole('button', { name: /Fruit/ });

        await act(() => userEvent.click(trigger));
        await expectClosesOnBlankClick();
      });
    }
  }
});
