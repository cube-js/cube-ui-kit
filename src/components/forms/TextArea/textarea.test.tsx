import { renderWithForm, userEvent, render, act } from '../../../test';
import { Field } from '../Form';

import { TextArea } from './TextArea';

jest.mock('../../../_internal/hooks/use-warn');

describe('<TextArea />', () => {
  it('should work without form', async () => {
    const { getByRole } = render(<TextArea label="test" />);
    const input = getByRole('textbox');

    await act(async () => await userEvent.type(input, 'Hello, World!'));

    expect(input).toHaveValue('Hello, World!');
  });

  it('should interop with <Form />', async () => {
    const { getByRole, formInstance } = renderWithForm(
      <TextArea label="test" name="test" />,
    );

    const input = getByRole('textbox');

    await act(async () => await userEvent.type(input, 'Hello, World!'));

    expect(input).toHaveValue('Hello, World!');
    expect(formInstance.getFieldValue('test')).toEqual('Hello, World!');
  });

  it('should interop with legacy field', async () => {
    const { getByRole, formInstance } = renderWithForm(
      <Field name="test">
        <TextArea label="test" />
      </Field>,
    );

    const input = getByRole('textbox');

    await act(async () => await userEvent.type(input, 'Hello, World!'));

    expect(input).toHaveValue('Hello, World!');
    expect(formInstance.getFieldValue('test')).toEqual('Hello, World!');
  });
});
