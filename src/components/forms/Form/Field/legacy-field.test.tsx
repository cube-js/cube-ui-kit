import { renderWithForm, userEvent } from '../../../../test';
import { Checkbox } from '../../Checkbox/Checkbox';
import { CheckboxGroup } from '../../Checkbox/CheckboxGroup';
import { TextInput } from '../../TextInput';

import { Field } from './LegacyField';

describe('Legacy <Field />', () => {
  it('should set default value as value', () => {
    const { getByRole, formInstance } = renderWithForm(
      <Field name="test" defaultValue="Hello, World!">
        <TextInput label="test" />
      </Field>,
    );

    const input = getByRole('textbox');

    expect(input).toHaveValue('Hello, World!');
    expect(formInstance.getFieldValue('test')).toBe('Hello, World!');
  });

  it('should update default value', () => {
    const { rerender, formInstance } = renderWithForm(
      <Field name="test" defaultValue="Hello, World!">
        <TextInput label="test" />
      </Field>,
    );

    expect(formInstance.getFieldValue('test')).toBe('Hello, World!');

    rerender(
      <Field name="test" defaultValue="World!">
        <TextInput label="test" />
      </Field>,
    );

    expect(formInstance.getFieldValue('test')).toBe('World!');
  });

  it('should not update default value if field is touched', async () => {
    const { rerender, formInstance, getByRole } = renderWithForm(
      <Field name="test" defaultValue="Hello, World!">
        <TextInput label="test" />
      </Field>,
    );

    expect(formInstance.getFieldValue('test')).toBe('Hello, World!');

    const input = getByRole('textbox');

    await userEvent.clear(input);
    await userEvent.type(input, 'Test!');

    rerender(
      <Field name="test" defaultValue="World!">
        <TextInput label="test" />
      </Field>,
    );

    expect(formInstance.getFieldValue('test')).toBe('Test!');
  });

  it('should not replace changed value with default value', async () => {
    const { rerender, formInstance, getByRole } = renderWithForm(
      <Field name="test" defaultValue="Hello, World!">
        <TextInput label="test" />
      </Field>,
    );

    const input = getByRole('textbox');

    await userEvent.clear(input);
    await userEvent.type(input, 'Hello, World!');

    rerender(
      <Field name="test" defaultValue="World!">
        <TextInput label="test" />
      </Field>,
    );

    expect(formInstance.getFieldValue('test')).toBe('Hello, World!');
  });

  it('should change value', async () => {
    const { getByRole, formInstance } = renderWithForm(
      <Field name="test" defaultValue="Hello">
        <TextInput label="test" />
      </Field>,
    );

    const input = getByRole('textbox');

    await userEvent.type(input, ', World!');

    expect(input).toHaveValue('Hello, World!');
    expect(formInstance.getFieldValue('test')).toBe('Hello, World!');
  });
});
