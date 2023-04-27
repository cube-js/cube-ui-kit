import { act, renderWithForm, renderWithRoot, userEvent } from '../../../test';
import { Field } from '../../forms';

import { ComboBox } from './ComboBox';

const items = [
  { key: 'red', children: 'Red' },
  { key: 'orange', children: 'Orange' },
  { key: 'yellow', children: 'Yellow' },
  { key: 'green', children: 'Green' },
  { key: 'blue', children: 'Blue' },
  { key: 'purple', children: 'Purple' },
  { key: 'violet', children: 'Violet' },
];

jest.mock('../../../_internal/hooks/use-warn');

describe('<Combobox />', () => {
  it('should provide suggestions', async () => {
    const { getByRole, getAllByRole } = renderWithRoot(
      <ComboBox label="test">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    await act(async () => await userEvent.type(combobox, 're'));

    const listbox = getByRole('listbox');
    const options = getAllByRole('option', listbox);

    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('Red');
    expect(options[1]).toHaveTextContent('Green');
  });

  it('should select an option', async () => {
    const { getByRole, getAllByRole, queryByRole } = renderWithRoot(
      <ComboBox label="test">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    await act(async () => {
      await userEvent.type(combobox, 're');
      await userEvent.click(getAllByRole('option')[0]);
    });

    expect(combobox).toHaveValue('Red');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should interop with <Field />', async () => {
    const { getByRole, getAllByRole, formInstance } = renderWithForm(
      <Field name="test">
        <ComboBox label="test">
          {items.map((item) => (
            <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
          ))}
        </ComboBox>
      </Field>,
    );

    const combobox = getByRole('combobox');

    await act(async () => {
      await userEvent.type(combobox, 're');
      await userEvent.click(getAllByRole('option')[0]);
    });

    expect(formInstance.getFieldValue('test')).toBe('red');
  });

  it('should interop with <Form />', async () => {
    const { getByRole, getAllByRole, formInstance } = renderWithForm(
      <ComboBox label="test" name="test">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    await act(async () => {
      await userEvent.type(combobox, 're');
    });

    const listbox = getByRole('listbox');
    const options = getAllByRole('option', listbox);

    expect(options).toHaveLength(2);

    await act(async () => {
      await userEvent.click(getAllByRole('option')[0]);
    });

    expect(formInstance.getFieldValue('test')).toBe('red');
  });

  it('should support custom filter', async () => {
    const filterFn = jest.fn((textValue, inputValue) =>
      textValue.toLowerCase().startsWith(inputValue.toLowerCase()),
    );

    const { getByRole, getAllByRole } = renderWithForm(
      <ComboBox label="test" name="test" filter={filterFn}>
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    await act(async () => {
      await userEvent.type(combobox, 're');
    });

    const listbox = getByRole('listbox');
    const options = getAllByRole('option', listbox);

    expect(filterFn).toHaveBeenCalled();
    expect(options).toHaveLength(1);
  });
});
