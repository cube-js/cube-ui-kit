import { createRef } from 'react';
import { createPortal } from 'react-dom';

import {
  CommandTextArea,
  Field,
  NumberInput,
  PasswordInput,
  SearchInput,
  TextArea,
  TextInput,
} from '../../../index';
import {
  act,
  fireEvent,
  hoverWithPointer,
  render,
  renderWithForm,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';
import { warnAboutLegacyTooltip } from '../../form/legacy-tooltip';

import type { FocusableRefValue } from '@react-types/shared';

vi.mock('../../form/legacy-tooltip', { spy: true });

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

  describe('validate before the field is touched', () => {
    function renderShort() {
      return render(
        <TextInput
          label="test"
          message="At least three letters"
          validate={(value) => (value.length < 3 ? 'Too short' : null)}
        />,
      );
    }

    it('shows nothing for the value the field mounts with', () => {
      const { getByRole, getByText, queryByText } = renderShort();

      expect(getByRole('textbox').closest('[data-invalid]')).toBeNull();
      expect(queryByText('Too short')).not.toBeInTheDocument();
      expect(getByText('At least three letters')).toBeInTheDocument();
    });

    it('shows the error once the user types', async () => {
      const { getByRole, getByText } = renderShort();
      const input = getByRole('textbox');

      await userEvent.type(input, 'a');

      expect(input.closest('[data-invalid]')).not.toBeNull();
      expect(getByText('Too short')).toBeInTheDocument();
    });

    it('shows the error once the user leaves the field', async () => {
      const { getByRole, getByText } = renderShort();
      const input = getByRole('textbox');

      await userEvent.click(input);
      await userEvent.tab();

      expect(input.closest('[data-invalid]')).not.toBeNull();
      expect(getByText('Too short')).toBeInTheDocument();
    });

    it('shows an explicit isInvalid at once', () => {
      const { getByRole } = render(
        <TextInput isInvalid label="test" validate={() => null} />,
      );

      expect(getByRole('textbox').closest('[data-invalid]')).not.toBeNull();
    });
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

describe('<TextInput /> tooltip', () => {
  const wrapperOf = (input: HTMLElement) =>
    input.closest('[data-qa="InputWrapper"]') as HTMLElement;

  async function expectNoTooltip() {
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
  }

  it('opens on hover over the field box', async () => {
    renderWithRoot(<TextInput aria-label="Minimum" tooltip="Empty is auto" />);

    await hoverWithPointer(wrapperOf(screen.getByRole('textbox')));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Empty is auto',
    );
  });

  it('opens on keyboard focus and joins the description in aria-describedby', async () => {
    renderWithRoot(
      <TextInput
        aria-label="Minimum"
        description="The lowest value on the axis"
        tooltip="Empty is auto"
      />,
    );

    await userEvent.tab();

    const input = screen.getByRole('textbox');
    const tooltip = await screen.findByRole('tooltip');
    const describedBy = input.getAttribute('aria-describedby')!.split(' ');

    expect(input).toHaveFocus();
    expect(tooltip).toHaveTextContent('Empty is auto');
    expect(describedBy).toContain(tooltip.id);
    expect(
      describedBy.map((id) => document.getElementById(id)?.textContent),
    ).toContain('The lowest value on the axis');
  });

  it('does not open when the input is clicked into', async () => {
    renderWithRoot(<TextInput aria-label="Minimum" tooltip="Empty is auto" />);

    await userEvent.click(screen.getByRole('textbox'));

    expect(screen.getByRole('textbox')).toHaveFocus();
    await expectNoTooltip();
  });

  it('closes on a keystroke and lets it type', async () => {
    renderWithRoot(<TextInput aria-label="Minimum" tooltip="Empty is auto" />);

    await userEvent.tab();
    await screen.findByRole('tooltip');
    await userEvent.keyboard('4');

    await expectNoTooltip();
    expect(screen.getByRole('textbox')).toHaveValue('4');
  });

  it('keeps it apart from the field label badge', async () => {
    renderWithRoot(
      <TextInput
        label="Minimum"
        labelTooltip="About the axis"
        tooltip={{ title: 'Empty is auto' }}
      />,
    );

    // `tooltip` is the input's own, not the legacy spelling of `labelTooltip`.
    expect(warnAboutLegacyTooltip).not.toHaveBeenCalledWith(
      expect.objectContaining({ tooltip: expect.anything() }),
    );
    expect(screen.getByTestId('InfoBadge')).toBeInTheDocument();

    await hoverWithPointer(wrapperOf(screen.getByRole('textbox')));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Empty is auto',
    );
  });

  it('keeps the field ref on the field box', () => {
    const ref = createRef<FocusableRefValue<HTMLInputElement, HTMLElement>>();

    renderWithRoot(
      <TextInput ref={ref} aria-label="Minimum" tooltip="Empty is auto" />,
    );

    expect(ref.current?.UNSAFE_getDOMNode()).toBe(
      wrapperOf(screen.getByRole('textbox')),
    );
  });

  // Every field built on the text input base takes the prop through to it.
  it.each([
    [
      'TextArea',
      () => <TextArea aria-label="Notes" tooltip="Markdown works" />,
    ],
    [
      'PasswordInput',
      () => <PasswordInput aria-label="Token" tooltip="Markdown works" />,
    ],
    [
      'SearchInput',
      () => <SearchInput aria-label="Find" tooltip="Markdown works" />,
    ],
    [
      'NumberInput',
      () => <NumberInput aria-label="Size" tooltip="Markdown works" />,
    ],
    [
      'CommandTextArea',
      () => <CommandTextArea aria-label="Prompt" tooltip="Markdown works" />,
    ],
  ])('opens on keyboard focus in %s', async (_, renderField) => {
    renderWithRoot(renderField());

    await userEvent.tab();

    const tooltip = await screen.findByRole('tooltip');

    expect(tooltip).toHaveTextContent('Markdown works');
    expect(document.activeElement).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining(tooltip.id),
    );
  });

  describe('while disabled', () => {
    // The tooltip of a disabled field is usually the reason it is disabled, so
    // the input keeps its focus: `aria-disabled` and read-only instead.
    it('stays a Tab stop and opens on keyboard focus', async () => {
      renderWithRoot(
        <TextInput
          isDisabled
          aria-label="Title"
          tooltip="Show the axis to change this"
        />,
      );

      const input = screen.getByRole('textbox');

      expect(input).not.toHaveAttribute('disabled');
      expect(input).toHaveAttribute('aria-disabled', 'true');
      expect(input).toHaveAttribute('readonly');
      // Its disabled styles key off this.
      expect(input).toHaveAttribute('data-disabled');

      await userEvent.tab();

      expect(input).toHaveFocus();
      expect(await screen.findByRole('tooltip')).toHaveTextContent(
        'Show the axis to change this',
      );
    });

    it('opens on hover', async () => {
      renderWithRoot(
        <TextInput
          isDisabled
          aria-label="Title"
          tooltip="Show the axis to change this"
        />,
      );

      await hoverWithPointer(wrapperOf(screen.getByRole('textbox')));

      expect(await screen.findByRole('tooltip')).toHaveTextContent(
        'Show the axis to change this',
      );
    });

    it('takes no text and submits no form', async () => {
      const onChange = vi.fn();
      const onSubmit = vi.fn((event) => event.preventDefault());

      renderWithRoot(
        <form onSubmit={onSubmit}>
          <TextInput
            isDisabled
            aria-label="Title"
            defaultValue="Count"
            tooltip="Show the axis to change this"
            onChange={onChange}
          />
          <button type="submit">Save</button>
        </form>,
      );

      const input = screen.getByRole('textbox');

      await userEvent.tab();
      await userEvent.keyboard('abc{Enter}');
      await userEvent.paste('pasted');

      expect(input).toHaveValue('Count');
      expect(onChange).not.toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('takes no focus from a press, as a natively disabled field', async () => {
      renderWithRoot(
        <TextInput
          isDisabled
          aria-label="Title"
          tooltip="Show the axis to change this"
        />,
      );

      await userEvent.click(screen.getByRole('textbox'));

      expect(screen.getByRole('textbox')).not.toHaveFocus();
    });

    it('stays natively disabled without a tooltip', async () => {
      renderWithRoot(
        <>
          <TextInput isDisabled aria-label="Title" />
          <button type="button">After</button>
        </>,
      );

      expect(screen.getByRole('textbox')).toBeDisabled();

      await userEvent.tab();

      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    });

    it('leaves the Tab order with excludeFromTabOrder', async () => {
      renderWithRoot(
        <>
          <TextInput
            isDisabled
            excludeFromTabOrder
            aria-label="Title"
            tooltip="Show the axis to change this"
          />
          <button type="button">After</button>
        </>,
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('tabindex', '-1');

      await userEvent.tab();

      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    });
  });
});
