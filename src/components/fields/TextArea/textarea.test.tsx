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

  it('shows the invalid state and message from validate', async () => {
    const { getByRole, getByText } = render(
      <TextArea
        label="test"
        validate={(value) => (value.length < 3 ? 'Too short' : null)}
        defaultValue="abc"
      />,
    );

    const input = getByRole('textbox');

    await userEvent.type(input, '{Backspace}');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.closest('[data-invalid]')).not.toBeNull();
    expect(getByText('Too short')).toBeInTheDocument();
  });

  it('clears a controlled value set to null and stays controlled', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getByRole, rerender } = render(
      <TextArea label="test" value="abc" onChange={() => {}} />,
    );

    rerender(<TextArea label="test" value={null} onChange={() => {}} />);

    expect(getByRole('textbox')).toHaveValue('');
    expect(warn).not.toHaveBeenCalledWith(
      expect.stringMatching(/controlled to uncontrolled/),
    );

    warn.mockRestore();
  });
});
