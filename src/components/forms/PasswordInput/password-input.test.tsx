import React from 'react';

import { act, renderWithForm, renderWithRoot, userEvent } from '../../../test';
import { Field } from '../Form';

import { PasswordInput } from './PasswordInput';

jest.mock('../../../_internal/hooks/use-warn');

describe('<PasswordInput />', () => {
  it('should work without form', async () => {
    const { getByTestId } = renderWithRoot(<PasswordInput label="test" />);

    const passwordInput = getByTestId('Input');

    await act(async () => await userEvent.type(passwordInput, 'test'));

    expect(passwordInput).toHaveValue('test');
  });

  it('should interop with <Form />', async () => {
    const { getByTestId, formInstance } = renderWithForm(
      <PasswordInput name="test" label="test" />,
    );

    const passwordInput = getByTestId('Input');

    await act(async () => await userEvent.type(passwordInput, 'test'));

    expect(passwordInput).toHaveValue('test');
    expect(formInstance.getFieldValue('test')).toBe('test');
  });

  it('should interop with legacy field', async () => {
    const { getByTestId, formInstance } = renderWithForm(
      <Field name="test">
        <PasswordInput label="test" />
      </Field>,
    );

    const passwordInput = getByTestId('Input');

    await act(async () => await userEvent.type(passwordInput, 'test'));

    expect(passwordInput).toHaveValue('test');
    expect(formInstance.getFieldValue('test')).toBe('test');
  });
});
