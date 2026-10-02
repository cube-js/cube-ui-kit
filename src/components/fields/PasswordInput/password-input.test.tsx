import React from 'react';

import {
  act,
  renderWithForm,
  renderWithRoot,
  userEvent,
  waitFor,
} from '../../../test';
import { Field } from '../../form';

import { PasswordInput } from './PasswordInput';

vi.mock('../../../_internal/hooks/use-warn');

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

  // CUB-5075: the form instance reached the input as `form="[object Object]"`,
  // which named no `<form>`, so the input had no form to submit on Enter.
  it('should submit the surrounding form on Enter', async () => {
    const onSubmit = vi.fn();
    const { getByTestId } = renderWithForm(
      <PasswordInput name="password" label="Password" />,
      { formProps: { onSubmit } },
    );

    const passwordInput = getByTestId('Input') as HTMLInputElement;

    expect(passwordInput).not.toHaveAttribute('form');
    expect(passwordInput.form).toBeInstanceOf(HTMLFormElement);

    await act(async () => await userEvent.type(passwordInput, 'secret{Enter}'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({ password: 'secret' });
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

  it('calls onKeyDown and onKeyUp with the key', async () => {
    const onKeyDown = vi.fn((e) => e.key);
    const onKeyUp = vi.fn((e) => e.key);
    const { getByTestId } = renderWithRoot(
      <PasswordInput label="test" onKeyDown={onKeyDown} onKeyUp={onKeyUp} />,
    );

    await userEvent.type(getByTestId('Input'), 'a{Enter}');

    expect(onKeyDown.mock.results.map((r) => r.value)).toEqual(['a', 'Enter']);
    expect(onKeyUp.mock.results.map((r) => r.value)).toEqual(['a', 'Enter']);
  });
});
