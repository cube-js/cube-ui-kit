import { createRef } from 'react';

import { renderWithForm, userEvent, render, act } from '../../../test';
import { Field, TextInput } from '../../../index';

jest.mock('../../../_internal/hooks/use-warn');

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

  it('should correctly assign the inputRef to the input element', () => {
    const inputRef = createRef<HTMLInputElement>();

    const { getByRole } = render(
      <TextInput label="test" inputRef={inputRef} />,
    );

    const input = getByRole('textbox');

    // Check if the ref is assigned to the input element
    expect(inputRef.current).toBe(input);
  });
});
