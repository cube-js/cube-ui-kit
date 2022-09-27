import { renderWithForm, userEvent } from '../../../test';
import { Field } from '../Form';

import { TextInput } from './TextInput';

describe('<TextInput />', () => {
  it('should interop with <Form />', async () => {
    const { getByRole, formInstance } = renderWithForm(
      <Field name="test">
        <TextInput label="test" />
      </Field>,
    );

    const input = getByRole('textbox');

    await userEvent.type(input, 'Hello, World!');

    expect(input).toHaveValue('Hello, World!');
    expect(formInstance.getFieldValue('test')).toEqual('Hello, World!');
  });
});
