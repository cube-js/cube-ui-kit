import { createRef } from 'react';

import { Field, TextInput } from '../../../index';
import { act, render, renderWithForm, userEvent } from '../../../test';

vi.mock('../../../_internal/hooks/use-warn');

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

  describe('keyboard events', () => {
    it('calls onKeyDown and onKeyUp with the key', async () => {
      const onKeyDown = vi.fn((e) => e.key);
      const onKeyUp = vi.fn((e) => e.key);
      const { getByRole } = render(
        <TextInput label="test" onKeyDown={onKeyDown} onKeyUp={onKeyUp} />,
      );

      await userEvent.type(getByRole('textbox'), 'a{Enter}');

      expect(onKeyDown.mock.results.map((r) => r.value)).toEqual([
        'a',
        'Enter',
      ]);
      expect(onKeyUp.mock.results.map((r) => r.value)).toEqual(['a', 'Enter']);
      expect(getByRole('textbox')).toHaveValue('a');
    });

    it('stops the key at the input unless the handler continues propagation', async () => {
      const onOuterKeyDown = vi.fn();
      const view = render(
        <div onKeyDown={(e) => onOuterKeyDown(e.key)}>
          <TextInput label="test" onKeyDown={() => {}} />
        </div>,
      );

      await userEvent.type(view.getByRole('textbox'), 'a');
      expect(onOuterKeyDown).not.toHaveBeenCalled();

      view.rerender(
        <div onKeyDown={(e) => onOuterKeyDown(e.key)}>
          <TextInput label="test" onKeyDown={(e) => e.continuePropagation()} />
        </div>,
      );

      await userEvent.type(view.getByRole('textbox'), 'b');
      expect(onOuterKeyDown).toHaveBeenCalledWith('b');
    });
  });
});
