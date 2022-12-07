import { renderWithForm, userEvent } from '../../../test';

import { PasswordInput } from './PasswordInput';

describe('<PasswordInput />', () => {
  it('should interop with <Form />', async () => {
    const { getByTestId, formInstance } = renderWithForm(
      <PasswordInput name="test" label="test" />,
    );

    const passwordInput = getByTestId('Input');

    await userEvent.type(passwordInput, 'test');

    expect(passwordInput).toHaveValue('test');
    expect(formInstance.getFieldValue('test')).toBe('test');
  });
});
