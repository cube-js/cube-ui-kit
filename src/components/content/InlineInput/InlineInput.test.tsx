import { createRef, useState } from 'react';

import { act, fireEvent, renderWithRoot, userEvent } from '../../../test';

import { CubeInlineInputRef, InlineInput } from './InlineInput';

describe('<InlineInput />', () => {
  describe('Basic Rendering', () => {
    it('renders the value in display mode', () => {
      const { getByText, queryByRole } = renderWithRoot(
        <InlineInput defaultValue="Hello" />,
      );

      expect(getByText('Hello')).toBeInTheDocument();
      expect(queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('applies the qa attribute', () => {
      const { getByTestId } = renderWithRoot(
        <InlineInput defaultValue="X" qa="MyInline" />,
      );

      expect(getByTestId('MyInline')).toBeInTheDocument();
    });

    it('supports renderDisplay for custom display', () => {
      const { getByText } = renderWithRoot(
        <InlineInput
          defaultValue="raw"
          renderDisplay={(v) => <strong>{`>>${v}<<`}</strong>}
        />,
      );

      expect(getByText('>>raw<<')).toBeInTheDocument();
    });

    it('renders the placeholder in display mode when the value is empty', async () => {
      const user = userEvent.setup();
      const { getByText, getByRole } = renderWithRoot(
        <InlineInput defaultValue="" placeholder="Untitled" />,
      );

      const placeholder = getByText('Untitled');
      expect(placeholder).toBeInTheDocument();

      await user.dblClick(placeholder);
      expect(getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Activation: dblclick (default)', () => {
    it('enters edit mode on double-click', async () => {
      const user = userEvent.setup();
      const { getByText, getByRole } = renderWithRoot(
        <InlineInput defaultValue="Tab 1" />,
      );

      await user.dblClick(getByText('Tab 1'));

      const input = getByRole('textbox') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('Tab 1');
    });

    it('does NOT enter edit mode on single click', async () => {
      const user = userEvent.setup();
      const { getByText, queryByRole } = renderWithRoot(
        <InlineInput defaultValue="Tab 1" />,
      );

      await user.click(getByText('Tab 1'));

      expect(queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Activation: click', () => {
    it('enters edit mode on single click', async () => {
      const user = userEvent.setup();
      const { getByText, getByRole } = renderWithRoot(
        <InlineInput defaultValue="Tab 1" editTrigger="click" />,
      );

      await user.click(getByText('Tab 1'));

      expect(getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Activation: none', () => {
    it('does NOT enter edit mode on click or double-click', async () => {
      const user = userEvent.setup();
      const { getByText, queryByRole } = renderWithRoot(
        <InlineInput defaultValue="Tab 1" editTrigger="none" />,
      );

      await user.dblClick(getByText('Tab 1'));
      expect(queryByRole('textbox')).not.toBeInTheDocument();

      await user.click(getByText('Tab 1'));
      expect(queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('still enters edit mode via ref.startEditing()', () => {
      const ref = createRef<CubeInlineInputRef>();
      const { getByRole } = renderWithRoot(
        <InlineInput ref={ref} defaultValue="Tab 1" editTrigger="none" />,
      );

      act(() => {
        ref.current?.startEditing();
      });

      expect(getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Submit (Enter)', () => {
    it('calls onSubmit with new value and exits edit mode', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      const handleChange = vi.fn();
      const { getByText, getByRole, queryByRole } = renderWithRoot(
        <InlineInput
          defaultValue="Old"
          onSubmit={handleSubmit}
          onChange={handleChange}
        />,
      );

      await user.dblClick(getByText('Old'));

      const input = getByRole('textbox') as HTMLInputElement;
      await act(async () => {
        fireEvent.change(input, { target: { value: 'New' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      expect(handleSubmit).toHaveBeenCalledWith('New');
      expect(handleChange).toHaveBeenCalledWith('New');
      expect(queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('trims the value on submit by default', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      const { getByText, getByRole } = renderWithRoot(
        <InlineInput defaultValue="X" onSubmit={handleSubmit} />,
      );

      await user.dblClick(getByText('X'));
      const input = getByRole('textbox') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(input, { target: { value: '  Trimmed  ' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      expect(handleSubmit).toHaveBeenCalledWith('Trimmed');
    });

    it('cancels (does not call onSubmit) when value is empty and allowEmpty=false', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      const handleCancel = vi.fn();
      const { getByText, getByRole } = renderWithRoot(
        <InlineInput
          defaultValue="X"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />,
      );

      await user.dblClick(getByText('X'));
      const input = getByRole('textbox') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(input, { target: { value: '   ' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      expect(handleSubmit).not.toHaveBeenCalled();
      expect(handleCancel).toHaveBeenCalled();
    });

    it('submits empty value when allowEmpty=true', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      const { getByText, getByRole } = renderWithRoot(
        <InlineInput allowEmpty defaultValue="X" onSubmit={handleSubmit} />,
      );

      await user.dblClick(getByText('X'));
      const input = getByRole('textbox') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(input, { target: { value: '' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      expect(handleSubmit).toHaveBeenCalledWith('');
    });
  });

  describe('Cancel (Escape)', () => {
    it('calls onCancel and exits edit mode without onSubmit', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      const handleCancel = vi.fn();
      const { getByText, getByRole, queryByRole } = renderWithRoot(
        <InlineInput
          defaultValue="X"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />,
      );

      await user.dblClick(getByText('X'));
      const input = getByRole('textbox') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(input, { target: { value: 'Changed' } });
        fireEvent.keyDown(input, { key: 'Escape' });
      });

      expect(handleSubmit).not.toHaveBeenCalled();
      expect(handleCancel).toHaveBeenCalled();
      expect(queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Disabled / ReadOnly', () => {
    it('does not enter edit mode when isDisabled', async () => {
      const user = userEvent.setup();
      const ref = createRef<CubeInlineInputRef>();
      const { getByText, queryByRole } = renderWithRoot(
        <InlineInput ref={ref} isDisabled defaultValue="X" />,
      );

      await user.dblClick(getByText('X'));
      expect(queryByRole('textbox')).not.toBeInTheDocument();

      act(() => {
        ref.current?.startEditing();
      });
      expect(queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('does not enter edit mode when isReadOnly', async () => {
      const user = userEvent.setup();
      const ref = createRef<CubeInlineInputRef>();
      const { getByText, queryByRole } = renderWithRoot(
        <InlineInput ref={ref} isReadOnly defaultValue="X" />,
      );

      await user.dblClick(getByText('X'));
      expect(queryByRole('textbox')).not.toBeInTheDocument();

      act(() => {
        ref.current?.startEditing();
      });
      expect(queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Controlled value', () => {
    it('reflects external value updates', () => {
      const { rerender, getByText } = renderWithRoot(
        <InlineInput value="One" onChange={() => {}} />,
      );
      expect(getByText('One')).toBeInTheDocument();

      rerender(<InlineInput value="Two" onChange={() => {}} />);
      expect(getByText('Two')).toBeInTheDocument();
    });

    it('shows the new value optimistically before parent updates (no flicker)', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const { getByText, getByRole } = renderWithRoot(
        <InlineInput value="Old" onChange={handleChange} />,
      );

      await user.dblClick(getByText('Old'));
      const input = getByRole('textbox') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(input, { target: { value: 'New' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      // Parent intentionally has NOT updated `value` — the component should
      // still show the optimistic committed value.
      expect(getByText('New')).toBeInTheDocument();
      expect(handleChange).toHaveBeenCalledWith('New');
    });
  });

  describe('Async onSubmit', () => {
    it('keeps optimistic value while async onSubmit is pending and after it resolves', async () => {
      const user = userEvent.setup();
      let resolveSave: ((v: string) => void) | undefined;
      const handleSubmit = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSave = () => resolve();
          }),
      );

      function Wrapper() {
        const [val, setVal] = useState('Initial');
        return (
          <InlineInput
            value={val}
            onSubmit={async (next) => {
              await handleSubmit(next);
              setVal(next);
            }}
          />
        );
      }

      const { getByText, getByRole, queryByText } = renderWithRoot(<Wrapper />);

      await user.dblClick(getByText('Initial'));
      const input = getByRole('textbox') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(input, { target: { value: 'Saved' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      // Server hasn't responded yet — optimistic value is shown.
      expect(getByText('Saved')).toBeInTheDocument();
      expect(queryByText('Initial')).not.toBeInTheDocument();

      await act(async () => {
        resolveSave?.('Saved');
        await Promise.resolve();
      });

      // After parent updates `value`, the optimistic is cleared and the real
      // value (same string) is shown — no flicker through "Initial".
      expect(getByText('Saved')).toBeInTheDocument();
    });

    it('reverts the optimistic value when async onSubmit rejects', async () => {
      const user = userEvent.setup();
      let rejectSave: ((err: Error) => void) | undefined;
      const handleSubmit = vi.fn(
        () =>
          new Promise<void>((_, reject) => {
            rejectSave = reject;
          }),
      );

      const { getByText, getByRole } = renderWithRoot(
        <InlineInput value="Initial" onSubmit={handleSubmit} />,
      );

      await user.dblClick(getByText('Initial'));
      const input = getByRole('textbox') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(input, { target: { value: 'Failed' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      // Optimistic is showing while pending.
      expect(getByText('Failed')).toBeInTheDocument();

      await act(async () => {
        rejectSave?.(new Error('boom'));
        await Promise.resolve();
      });

      // Promise rejected → optimistic reverts back to the actual prop value.
      expect(getByText('Initial')).toBeInTheDocument();
    });

    it('keeps display value in sync (optimistic) when onChange is called', async () => {
      const user = userEvent.setup();

      function Wrapper() {
        const [val, setVal] = useState('First');
        return <InlineInput value={val} onChange={setVal} />;
      }

      const { getByText, getByRole } = renderWithRoot(<Wrapper />);

      await user.dblClick(getByText('First'));
      const input = getByRole('textbox') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(input, { target: { value: 'Second' } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });

      expect(getByText('Second')).toBeInTheDocument();
    });
  });

  describe('Controlled editing state', () => {
    it('respects isEditing prop', () => {
      const { getByRole, rerender, queryByRole } = renderWithRoot(
        <InlineInput
          defaultValue="X"
          isEditing={true}
          onEditingChange={() => {}}
        />,
      );

      expect(getByRole('textbox')).toBeInTheDocument();

      rerender(
        <InlineInput
          defaultValue="X"
          isEditing={false}
          onEditingChange={() => {}}
        />,
      );

      expect(queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('fires onEditingChange on user activation', async () => {
      const user = userEvent.setup();
      const handleEditingChange = vi.fn();
      const { getByText } = renderWithRoot(
        <InlineInput defaultValue="X" onEditingChange={handleEditingChange} />,
      );

      await user.dblClick(getByText('X'));
      expect(handleEditingChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Imperative ref', () => {
    it('startEditing enters edit mode', () => {
      const ref = createRef<CubeInlineInputRef>();
      const { getByRole } = renderWithRoot(
        <InlineInput ref={ref} defaultValue="X" />,
      );

      act(() => {
        ref.current?.startEditing();
      });

      expect(getByRole('textbox')).toBeInTheDocument();
    });

    it('startEditing while already editing does not reset the draft', () => {
      const ref = createRef<CubeInlineInputRef>();
      const { getByRole } = renderWithRoot(
        <InlineInput ref={ref} defaultValue="X" />,
      );

      act(() => {
        ref.current?.startEditing();
      });

      const input = getByRole('textbox') as HTMLInputElement;
      act(() => {
        fireEvent.change(input, { target: { value: 'in progress' } });
      });

      act(() => {
        ref.current?.startEditing();
      });

      expect((getByRole('textbox') as HTMLInputElement).value).toBe(
        'in progress',
      );
    });

    it('stopEditing(true) commits the draft', () => {
      const ref = createRef<CubeInlineInputRef>();
      const handleSubmit = vi.fn();
      const { getByRole } = renderWithRoot(
        <InlineInput ref={ref} defaultValue="X" onSubmit={handleSubmit} />,
      );

      act(() => {
        ref.current?.startEditing();
      });

      const input = getByRole('textbox') as HTMLInputElement;
      act(() => {
        fireEvent.change(input, { target: { value: 'Y' } });
      });

      act(() => {
        ref.current?.stopEditing(true);
      });

      expect(handleSubmit).toHaveBeenCalledWith('Y');
    });

    it('stopEditing(false) cancels', () => {
      const ref = createRef<CubeInlineInputRef>();
      const handleSubmit = vi.fn();
      const handleCancel = vi.fn();
      const { getByRole } = renderWithRoot(
        <InlineInput
          ref={ref}
          defaultValue="X"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />,
      );

      act(() => {
        ref.current?.startEditing();
      });

      const input = getByRole('textbox') as HTMLInputElement;
      act(() => {
        fireEvent.change(input, { target: { value: 'Y' } });
      });

      act(() => {
        ref.current?.stopEditing(false);
      });

      expect(handleSubmit).not.toHaveBeenCalled();
      expect(handleCancel).toHaveBeenCalled();
    });

    it('getValue returns the current committed value', () => {
      const ref = createRef<CubeInlineInputRef>();
      renderWithRoot(<InlineInput ref={ref} defaultValue="hello" />);

      expect(ref.current?.getValue()).toBe('hello');
    });
  });

  describe('Modifiers / styling', () => {
    it('exposes editing modifier in edit mode', () => {
      const { getByTestId, rerender } = renderWithRoot(
        <InlineInput
          defaultValue="X"
          qa="II"
          isEditing={false}
          onEditingChange={() => {}}
        />,
      );

      const root = getByTestId('II');
      expect(root).not.toHaveAttribute('data-editing');

      rerender(
        <InlineInput
          defaultValue="X"
          qa="II"
          isEditing={true}
          onEditingChange={() => {}}
        />,
      );

      expect(root).toHaveAttribute('data-editing');
    });
  });

  describe('Auto focus & select on edit', () => {
    it('focuses the input when entering edit mode', async () => {
      const user = userEvent.setup();
      const { getByText, getByRole } = renderWithRoot(
        <InlineInput defaultValue="X" />,
      );

      await user.dblClick(getByText('X'));

      const input = getByRole('textbox') as HTMLInputElement;
      expect(document.activeElement).toBe(input);
    });
  });

  describe('Overflow & Tooltip', () => {
    it('renders the value untouched with tooltip={false}', () => {
      const { getByText, queryByRole } = renderWithRoot(
        <InlineInput defaultValue="Hello" tooltip={false} />,
      );

      expect(getByText('Hello')).toBeInTheDocument();
      expect(queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('renders an explicit string tooltip wrapper without crashing', () => {
      const { getByText } = renderWithRoot(
        <InlineInput defaultValue="Hello" tooltip="Click to edit" />,
      );

      expect(getByText('Hello')).toBeInTheDocument();
    });

    it('shows the tooltip on hover when an explicit string tooltip is provided', async () => {
      const user = userEvent.setup();
      const { getByText, findByRole } = renderWithRoot(
        <InlineInput defaultValue="Hello" tooltip="Click to edit" />,
      );

      await user.hover(getByText('Hello'));

      const tooltip = await findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Click to edit');
    });

    it('does not show a tooltip while editing', async () => {
      const user = userEvent.setup();
      const { getByText, getByRole, queryByRole } = renderWithRoot(
        <InlineInput defaultValue="Hello" tooltip="Click to edit" />,
      );

      await user.dblClick(getByText('Hello'));
      const input = getByRole('textbox');
      await user.hover(input);

      expect(queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('suppresses auto-tooltip when renderDisplay is provided', async () => {
      const user = userEvent.setup();
      const { getByText, queryByRole } = renderWithRoot(
        <InlineInput
          defaultValue="raw"
          renderDisplay={(v) => <strong>{v}</strong>}
        />,
      );

      await user.hover(getByText('raw'));

      expect(queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('renders truncation styles in display mode', () => {
      const { getByTestId } = renderWithRoot(
        <InlineInput defaultValue="X" qa="II" />,
      );

      const root = getByTestId('II');
      const styles = getComputedStyle(root);

      // tasty injects CSS rules; jsdom resolves them via document stylesheets.
      expect(styles.textOverflow).toBe('ellipsis');
      expect(styles.whiteSpace).toBe('nowrap');
      expect(styles.overflow).toBe('hidden');
    });

    it('toggles the editing modifier so the truncation rules can be relaxed', () => {
      const { getByTestId } = renderWithRoot(
        <InlineInput
          isEditing
          defaultValue="X"
          qa="II"
          onEditingChange={() => {}}
        />,
      );

      // jsdom does not fully evaluate the conditional `editing` CSS overrides,
      // so we check the modifier is set — the actual `overflow: visible /
      // white-space: normal` rules are visible in the Storybook snapshot and
      // the integration `Tabs` tests verify editing-mode behaviour end-to-end.
      expect(getByTestId('II')).toHaveAttribute('data-editing');
    });
  });

  describe('Keyboard activation', () => {
    it('exposes the display element as a button-role tab stop by default', () => {
      const { getByTestId } = renderWithRoot(
        <InlineInput defaultValue="Hello" qa="II" />,
      );

      const root = getByTestId('II');
      expect(root).toHaveAttribute('tabindex', '0');
      expect(root).toHaveAttribute('role', 'button');
      expect(root).toHaveAttribute('aria-roledescription', 'editable text');
    });

    it('forwards aria-label / aria-labelledby to the focusable display element', () => {
      const { getByTestId } = renderWithRoot(
        <InlineInput
          defaultValue="Hello"
          qa="II"
          aria-label="Tab title"
          aria-labelledby="lbl"
        />,
      );

      const root = getByTestId('II');
      expect(root).toHaveAttribute('aria-label', 'Tab title');
      expect(root).toHaveAttribute('aria-labelledby', 'lbl');
    });

    it.each([
      ['Enter', 'Enter'],
      ['F2', 'F2'],
      ['Space', ' '],
    ])('enters edit mode on %s', async (_label, key) => {
      const { getByTestId, getByRole } = renderWithRoot(
        <InlineInput defaultValue="Hello" qa="II" />,
      );

      const root = getByTestId('II');
      await act(async () => {
        fireEvent.keyDown(root, { key });
      });

      expect(getByRole('textbox')).toBeInTheDocument();
    });

    it('drops the tab stop and role while editing', async () => {
      const user = userEvent.setup();
      const { getByText, getByTestId } = renderWithRoot(
        <InlineInput defaultValue="Hello" qa="II" />,
      );

      await user.dblClick(getByText('Hello'));

      const root = getByTestId('II');
      expect(root).not.toHaveAttribute('tabindex');
      expect(root).not.toHaveAttribute('role');
    });

    it('does not expose a tab stop with keyboardActivation={false}', () => {
      const { getByTestId } = renderWithRoot(
        <InlineInput defaultValue="Hello" qa="II" keyboardActivation={false} />,
      );

      const root = getByTestId('II');
      expect(root).not.toHaveAttribute('tabindex');
      expect(root).not.toHaveAttribute('role');
    });

    it('ignores Enter/F2 on the display when keyboardActivation is off', async () => {
      const { getByTestId, queryByRole } = renderWithRoot(
        <InlineInput defaultValue="Hello" qa="II" keyboardActivation={false} />,
      );

      const root = getByTestId('II');
      await act(async () => {
        fireEvent.keyDown(root, { key: 'Enter' });
        fireEvent.keyDown(root, { key: 'F2' });
      });

      expect(queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('drops the tab stop in editTrigger="none" but still honours ref.startEditing()', () => {
      const ref = createRef<CubeInlineInputRef>();
      const { getByTestId, getByRole } = renderWithRoot(
        <InlineInput
          ref={ref}
          defaultValue="Hello"
          qa="II"
          editTrigger="none"
        />,
      );

      const root = getByTestId('II');
      expect(root).not.toHaveAttribute('tabindex');
      expect(root).not.toHaveAttribute('role');

      act(() => {
        ref.current?.startEditing();
      });

      expect(getByRole('textbox')).toBeInTheDocument();
    });

    it('does not mark the display as focused without keyboard interaction', () => {
      const { getByTestId } = renderWithRoot(
        <InlineInput defaultValue="Hello" qa="II" />,
      );

      // Initially no keyboard focus → no `focused` modifier on the root.
      expect(getByTestId('II')).not.toHaveAttribute('data-focused');
    });

    it('does not expose the focused modifier when keyboardActivation is off', async () => {
      const user = userEvent.setup();
      const { getByTestId } = renderWithRoot(
        <InlineInput defaultValue="Hello" qa="II" keyboardActivation={false} />,
      );

      // Even if the user Tabs through the page, the inline-input span isn't
      // a tab stop and shouldn't pick up `focused`. We simulate Tab to make
      // global focus-visible state true, then assert the span stays clean.
      await user.tab();
      expect(getByTestId('II')).not.toHaveAttribute('data-focused');
    });

    it('marks the display with aria-disabled / aria-readonly when applicable', () => {
      const { getByTestId, rerender } = renderWithRoot(
        <InlineInput isDisabled defaultValue="Hello" qa="II" />,
      );

      let root = getByTestId('II');
      expect(root).toHaveAttribute('aria-disabled', 'true');

      rerender(<InlineInput isReadOnly defaultValue="Hello" qa="II" />);
      root = getByTestId('II');
      expect(root).toHaveAttribute('aria-readonly', 'true');
    });
  });

  describe('Imperative ref: stopEditing()', () => {
    it('is a no-op when called while not editing', () => {
      const ref = createRef<CubeInlineInputRef>();
      const handleSubmit = vi.fn();
      const handleCancel = vi.fn();

      renderWithRoot(
        <InlineInput
          ref={ref}
          defaultValue="Hello"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />,
      );

      act(() => {
        ref.current?.stopEditing(true);
        ref.current?.stopEditing(false);
      });

      expect(handleSubmit).not.toHaveBeenCalled();
      expect(handleCancel).not.toHaveBeenCalled();
    });

    it('commits and cancels exactly once even when called twice in a row', async () => {
      const ref = createRef<CubeInlineInputRef>();
      const handleSubmit = vi.fn();
      const handleCancel = vi.fn();
      const user = userEvent.setup();

      const { getByText } = renderWithRoot(
        <InlineInput
          ref={ref}
          defaultValue="Hello"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />,
      );

      await user.dblClick(getByText('Hello'));

      act(() => {
        ref.current?.stopEditing(true);
        ref.current?.stopEditing(true);
      });

      expect(handleSubmit).toHaveBeenCalledTimes(1);
      expect(handleCancel).not.toHaveBeenCalled();
    });
  });
});
