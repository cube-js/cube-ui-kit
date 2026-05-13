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
});
