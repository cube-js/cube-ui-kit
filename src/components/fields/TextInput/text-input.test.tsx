import { createRef } from 'react';
import { createPortal } from 'react-dom';

import { Field, TextInput } from '../../../index';
import {
  act,
  fireEvent,
  render,
  renderWithForm,
  userEvent,
} from '../../../test';

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

  describe('loading indicator', () => {
    it('renders a custom loadingIndicator in place of the default icon', () => {
      const { getByTestId, container, rerender } = render(
        <TextInput
          isLoading
          label="test"
          loadingIndicator={<b data-qa="CustomSpinner">…</b>}
        />,
      );

      const state = container.querySelector('[data-element="State"]');

      expect(state).toContainElement(getByTestId('CustomSpinner'));
      expect(state?.querySelector('[data-qa="LoadingIcon"]')).toBeNull();

      rerender(
        <TextInput
          label="test"
          loadingIndicator={<b data-qa="CustomSpinner">…</b>}
        />,
      );

      expect(container.querySelector('[data-qa="CustomSpinner"]')).toBeNull();
    });
  });

  // A popover opened from a field action is a React child of the field box but
  // lives in a portal. Its presses bubble through the field box in React and
  // must stay the popover's: an input in it has to be able to take focus.
  it('leaves presses in a portal rendered from the field to the portal', () => {
    const { getByRole, getByTestId } = render(
      <TextInput
        label="test"
        suffix={createPortal(
          <div data-qa="PortalContent">Popover</div>,
          document.body,
        )}
      />,
    );

    const notPrevented = fireEvent.mouseDown(getByTestId('PortalContent'));

    expect(notPrevented).toBe(true);
    expect(getByRole('textbox')).not.toHaveFocus();
  });

  describe('inputProps', () => {
    it('keeps attributes the explicit props leave unset', () => {
      const { getByRole } = render(
        <TextInput
          label="test"
          inputProps={{
            maxLength: 5,
            minLength: 2,
            autoComplete: 'email',
            disabled: true,
          }}
        />,
      );

      const input = getByRole('textbox');

      expect(input).toHaveAttribute('maxlength', '5');
      expect(input).toHaveAttribute('minlength', '2');
      expect(input).toHaveAttribute('autocomplete', 'email');
      expect(input).toBeDisabled();
    });

    it('keeps autoFocus and rows from inputProps', () => {
      const { getByRole } = render(
        <TextInput
          multiLine
          label="test"
          inputProps={{ autoFocus: true, rows: 4 }}
        />,
      );

      const textarea = getByRole('textbox');

      expect(textarea).toHaveAttribute('rows', '4');
      expect(textarea).toHaveFocus();
    });

    it('lets an explicit prop win over the same key in inputProps', () => {
      const { getByRole } = render(
        <TextInput
          label="test"
          maxLength={3}
          autoComplete="username"
          inputProps={{ maxLength: 5, autoComplete: 'email' }}
        />,
      );

      const input = getByRole('textbox');

      expect(input).toHaveAttribute('maxlength', '3');
      expect(input).toHaveAttribute('autocomplete', 'username');
    });
  });

  it('shows the invalid state and message from validate', async () => {
    const { getByRole, getByText, queryByText } = render(
      <TextInput
        label="test"
        validate={(value) => (value.length < 3 ? 'Too short' : null)}
        defaultValue="abc"
      />,
    );

    const input = getByRole('textbox');

    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input.closest('[data-invalid]')).toBeNull();

    await userEvent.clear(input);
    await userEvent.type(input, 'ab');
    await userEvent.tab();

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.closest('[data-invalid]')).not.toBeNull();
    expect(getByText('Too short')).toBeInTheDocument();

    await userEvent.type(input, 'c');

    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input.closest('[data-invalid]')).toBeNull();
    expect(queryByText('Too short')).not.toBeInTheDocument();
  });

  it('keeps an explicit errorMessage over the errors from validate', async () => {
    const { getByRole, getByText, queryByText } = render(
      <TextInput
        label="test"
        validate={() => 'From validate'}
        errorMessage="From the caller"
      />,
    );

    await userEvent.type(getByRole('textbox'), 'a');

    expect(getByText('From the caller')).toBeInTheDocument();
    expect(queryByText('From validate')).not.toBeInTheDocument();
  });

  it('renders no input-only attributes on a multiLine textarea', () => {
    const { getByRole } = render(<TextInput multiLine label="test" />);

    const textarea = getByRole('textbox');

    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).not.toHaveAttribute('type');
  });

  it('clears a controlled value set to null and stays controlled', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getByRole, rerender } = render(
      <TextInput label="test" value="abc" onChange={() => {}} />,
    );

    rerender(<TextInput label="test" value={null} onChange={() => {}} />);

    expect(getByRole('textbox')).toHaveValue('');
    expect(warn).not.toHaveBeenCalledWith(
      expect.stringMatching(/controlled to uncontrolled/),
    );

    warn.mockRestore();
  });
});
