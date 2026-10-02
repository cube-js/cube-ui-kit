import { act, render, renderWithForm, userEvent } from '../../../test';
import { Field } from '../../form';

import { TextArea } from './TextArea';

vi.mock('../../../_internal/hooks/use-warn');

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

  it('calls onKeyDown and onKeyUp with the key', async () => {
    const onKeyDown = vi.fn((e) => e.key);
    const onKeyUp = vi.fn((e) => e.key);
    const { getByRole } = render(
      <TextArea label="test" onKeyDown={onKeyDown} onKeyUp={onKeyUp} />,
    );

    await userEvent.type(getByRole('textbox'), 'a{Enter}');

    expect(onKeyDown.mock.results.map((r) => r.value)).toEqual(['a', 'Enter']);
    expect(onKeyUp.mock.results.map((r) => r.value)).toEqual(['a', 'Enter']);
    // Nothing built in claims Enter: the newline still goes in.
    expect(getByRole('textbox')).toHaveValue('a\n');
  });
});
