import { renderWithForm, renderWithRoot, userEvent } from '../../../test/index';
import { Field } from '../../form';

import { LegacyComboBox } from './LegacyComboBox';

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

describe.skip('<LegacyComboBox />', () => {
  it('should provide suggestions', async () => {
    const { getByRole, getAllByRole } = renderWithRoot(
      <LegacyComboBox label="test">
        {items.map((item) => (
          <LegacyComboBox.Item key={item.key}>
            {item.children}
          </LegacyComboBox.Item>
        ))}
      </LegacyComboBox>,
    );

    const combobox = getByRole('combobox');

    await userEvent.type(combobox, 're');

    const listbox = getByRole('listbox');
    const options = getAllByRole('option', listbox);

    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('Red');
    expect(options[1]).toHaveTextContent('Green');
  });

  it('should select an option', async () => {
    const { getByRole, getAllByRole, queryByRole } = renderWithRoot(
      <LegacyComboBox label="test">
        {items.map((item) => (
          <LegacyComboBox.Item key={item.key}>
            {item.children}
          </LegacyComboBox.Item>
        ))}
      </LegacyComboBox>,
    );

    const combobox = getByRole('combobox');

    await userEvent.type(combobox, 're');
    await userEvent.click(getAllByRole('option')[0]);

    expect(combobox).toHaveValue('Red');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(queryByRole('listbox')).not.toBeInTheDocument();
  });

  it.skip('should interop with <Field />', async () => {
    const { getByRole, getAllByRole, formInstance } = renderWithForm(
      <Field name="test">
        <LegacyComboBox label="test">
          {items.map((item) => (
            <LegacyComboBox.Item key={item.key}>
              {item.children}
            </LegacyComboBox.Item>
          ))}
        </LegacyComboBox>
      </Field>,
    );

    const combobox = getByRole('combobox');

    await userEvent.type(combobox, 're');
    await userEvent.click(getAllByRole('option')[0]);

    expect(formInstance.getFieldValue('test')).toBe('red');
  });

  it('should interop with <Form />', async () => {
    const { getByRole, getAllByRole, formInstance } = renderWithForm(
      <LegacyComboBox label="test" name="test">
        {items.map((item) => (
          <LegacyComboBox.Item key={item.key}>
            {item.children}
          </LegacyComboBox.Item>
        ))}
      </LegacyComboBox>,
    );

    const combobox = getByRole('combobox');

    await userEvent.type(combobox, 're');

    const listbox = getByRole('listbox');
    const options = getAllByRole('option', listbox);

    expect(options).toHaveLength(2);

    await userEvent.click(getAllByRole('option')[0]);

    expect(formInstance.getFieldValue('test')).toBe('red');
  });

  it('should support custom filter', async () => {
    const filterFn = jest.fn((textValue, inputValue) =>
      textValue.toLowerCase().startsWith(inputValue.toLowerCase()),
    );

    const { getByRole, getAllByRole } = renderWithForm(
      <LegacyComboBox label="test" name="test" filter={filterFn}>
        {items.map((item) => (
          <LegacyComboBox.Item key={item.key}>
            {item.children}
          </LegacyComboBox.Item>
        ))}
      </LegacyComboBox>,
    );

    const combobox = getByRole('combobox');

    await userEvent.type(combobox, 're');

    const listbox = getByRole('listbox');
    const options = getAllByRole('option', listbox);

    expect(filterFn).toHaveBeenCalled();
    expect(options).toHaveLength(1);
  });

  it('should have qa', () => {
    const { getByTestId } = renderWithRoot(
      <LegacyComboBox label="test" qa="test">
        {items.map((item) => (
          <LegacyComboBox.Item key={item.key}>
            {item.children}
          </LegacyComboBox.Item>
        ))}
      </LegacyComboBox>,
    );

    expect(getByTestId('test')).toBeInTheDocument();
  });

  it('should have data-qa', () => {
    const { getByTestId } = renderWithRoot(
      <LegacyComboBox label="test" data-qa="test">
        {items.map((item) => (
          <LegacyComboBox.Item key={item.key}>
            {item.children}
          </LegacyComboBox.Item>
        ))}
      </LegacyComboBox>,
    );

    expect(getByTestId('test')).toBeInTheDocument();
  });
});
