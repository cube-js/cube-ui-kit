import { renderWithForm, userEvent } from '../../../test';
import { Field } from '../Form';

import { PasswordInput } from './PasswordInput';

describe('<PasswordInput />', () => {
  it('should interop with <Form />', async () => {
    const { getByTestId, formInstance } = renderWithForm(
      <Field name="test">
        <PasswordInput label="test" />
      </Field>,
    );

    const passwordInput = getByTestId('Input');

    await userEvent.type(passwordInput, 'test');

    expect(passwordInput).toHaveValue('test');
    expect(formInstance.getFieldValue('test')).toBe('test');
  });
});
