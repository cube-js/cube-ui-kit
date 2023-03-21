import { renderWithForm, userEvent, render, act } from '../../../test';
import { Field } from '../Form';

import { TextInput } from './TextInput';

describe('<TextInput />', () => {
  it('should work without form', async () => {
    const { getByRole } = render(<TextInput label="test" />);

    const input = getByRole('textbox');

    await act(async () => await userEvent.type(input, 'Hello, World!'));

    expect(input).toHaveValue('Hello, World!');
  });

  it('should interop with legacy <Field />', async () => {
    const { getByRole, formInstance } = renderWithForm(
      <Field name="test">
        <TextInput label="test" />
      </Field>,
    );

    const input = getByRole('textbox');

    await act(async () => await userEvent.type(input, 'Hello, World!'));

    expect(input).toHaveValue('Hello, World!');
    expect(formInstance.getFieldValue('test')).toEqual('Hello, World!');
  });

  it('should interop with <Form />', async () => {
    const { getByRole, formInstance } = renderWithForm(
      <TextInput label="test" name="test" />,
    );

    const input = getByRole('textbox');

    await act(async () => await userEvent.type(input, 'Hello, World!'));

    expect(input).toHaveValue('Hello, World!');
    expect(formInstance.getFieldValue('test')).toEqual('Hello, World!');
  });
});
