import { act, fireEvent, waitFor } from '@testing-library/react';
import { useLayoutEffect, useState } from 'react';

import {
  getActiveDescendant,
  renderWithForm,
  renderWithRoot,
  userEvent,
} from '../../../test/index';
import { Button } from '../../actions/Button/Button';
import { Content } from '../../content/Content';
import { Dialog } from '../../overlays/Dialog/Dialog';
import { DialogTrigger } from '../../overlays/Dialog/DialogTrigger';
import { TextInput } from '../TextInput/TextInput';

import { ComboBox } from './ComboBox';

const items = [
  { key: 'red', children: 'Red' },
  { key: 'orange', children: 'Orange' },
  { key: 'yellow', children: 'Yellow' },
  { key: 'green', children: 'Green' },
  { key: 'blue', children: 'Blue' },
  { key: 'purple', children: 'Purple' },
  { key: 'violet', children: 'Violet' },
];

vi.mock('../../../_internal/hooks/use-warn');

describe('<ComboBox />', () => {
  it('honors a later external clear when the parent declined the selection cleared by typing', async () => {
    const onSelectionChange = vi.fn();
    const renderInput = (selectedKey: string | null) => (
      <ComboBox
        label="Tag"
        allowsCustomValue
        selectedKey={selectedKey}
        onSelectionChange={onSelectionChange}
      >
        <ComboBox.Item key="known">Known</ComboBox.Item>
      </ComboBox>
    );
    const view = renderWithRoot(renderInput('known'));
    const input = view.getByRole('combobox', { name: 'Tag' });
    await userEvent.type(input, '!');
    expect(input).toHaveValue('Known!');
    expect(onSelectionChange).toHaveBeenCalledWith(null);
    view.rerender(renderInput(null));
    expect(input).toHaveValue('');
  });

  it('should handle basic functionality and popover state', async () => {
    const { getByRole, queryByRole, getByTestId } = renderWithRoot(
      <ComboBox label="test" placeholder="Select a color">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Check initial state
    expect(combobox).toHaveAttribute('placeholder', 'Select a color');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(queryByRole('listbox')).not.toBeInTheDocument();

    // Open popover by typing (default trigger='input')
    await userEvent.type(combobox, 're');

    await waitFor(() => {
      expect(queryByRole('listbox')).toBeInTheDocument();
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });

    // Close popover with Escape
    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(queryByRole('listbox')).not.toBeInTheDocument();
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    // Clear input
    await userEvent.clear(combobox);

    // Open popover with trigger button
    const trigger = getByTestId('ComboBoxTrigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(queryByRole('listbox')).toBeInTheDocument();
    });

    // Toggle popover with trigger button again
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('should filter options with default contains filter', async () => {
    const { getByRole, getAllByRole, queryByRole } = renderWithRoot(
      <ComboBox label="test">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    await userEvent.type(combobox, 're');

    await waitFor(() => {
      expect(getByRole('listbox')).toBeInTheDocument();
      const options = getAllByRole('option');
      // Should match "Red" and "Green" (contains 're')
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent('Red');
      expect(options[1]).toHaveTextContent('Green');
    });

    // Close popover
    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('should support custom filter function', async () => {
    const customFilterFn = vi.fn((textValue, inputValue) =>
      textValue.toLowerCase().startsWith(inputValue.toLowerCase()),
    );

    const { getByRole, getAllByRole } = renderWithRoot(
      <ComboBox label="test" filter={customFilterFn}>
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    await userEvent.type(combobox, 're');

    await waitFor(() => {
      const options = getAllByRole('option');
      // Should only match "Red" (starts with 're')
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Red');
      expect(customFilterFn).toHaveBeenCalled();
    });
  });

  it('should show all items when filter is disabled', async () => {
    const { getByRole, getAllByRole } = renderWithRoot(
      <ComboBox label="test" filter={false}>
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    await userEvent.type(combobox, 're');

    await waitFor(() => {
      const options = getAllByRole('option');
      // Should show all items when filter is disabled
      expect(options).toHaveLength(7);
    });
  });

  it('should filter options within sections', async () => {
    const { getByRole, getAllByRole } = renderWithRoot(
      <ComboBox label="test">
        <ComboBox.Section key="warm" title="Warm Colors">
          <ComboBox.Item key="red">Red</ComboBox.Item>
          <ComboBox.Item key="orange">Orange</ComboBox.Item>
          <ComboBox.Item key="yellow">Yellow</ComboBox.Item>
        </ComboBox.Section>
        <ComboBox.Section key="cool" title="Cool Colors">
          <ComboBox.Item key="green">Green</ComboBox.Item>
          <ComboBox.Item key="blue">Blue</ComboBox.Item>
          <ComboBox.Item key="purple">Purple</ComboBox.Item>
        </ComboBox.Section>
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    await userEvent.type(combobox, 'e');

    await waitFor(() => {
      const options = getAllByRole('option');
      // Should match "Red", "Orange", "Yellow", "Green", "Blue", "Purple"
      expect(options.length).toBeGreaterThan(0);
    });
  });

  it('should close popover when no results match', async () => {
    const { getByRole, queryByRole } = renderWithRoot(
      <ComboBox label="test">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    await userEvent.type(combobox, 'zzz');

    await waitFor(() => {
      expect(queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('should manage selection correctly', async () => {
    const onSelectionChange = vi.fn();

    const { getByRole, getAllByRole, queryByRole } = renderWithRoot(
      <ComboBox label="test" onSelectionChange={onSelectionChange}>
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Select option on click
    await userEvent.type(combobox, 're');

    await waitFor(() => {
      expect(queryByRole('listbox')).toBeInTheDocument();
    });

    const options = getAllByRole('option');
    await userEvent.click(options[0]); // Click "Red"

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith('red');
      expect(combobox).toHaveValue('Red');
      expect(queryByRole('listbox')).not.toBeInTheDocument();
    });

    // In normal mode, typing should NOT clear selection (only filters)
    // Selection stays until explicitly changed
    onSelectionChange.mockClear();
    await userEvent.clear(combobox);
    await userEvent.type(combobox, 'x');

    // Selection should still be 'red' (not cleared by typing)
    await waitFor(() => {
      // onSelectionChange should NOT have been called
      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    // But on blur, input should reset to show current selection
    await act(async () => {
      combobox.blur();
    });

    await waitFor(() => {
      expect(combobox).toHaveValue('Red'); // Reset to selection
    });
  }, 15000); // Increased timeout for flaky test

  it('points aria-activedescendant at the option the arrow keys reach', async () => {
    const { getByRole } = renderWithRoot(
      <ComboBox label="Color">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );
    const combobox = getByRole('combobox');

    await userEvent.type(combobox, 'r');
    await waitFor(() =>
      expect(getActiveDescendant(combobox)).toHaveAttribute('data-key', 'red'),
    );

    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(getActiveDescendant(combobox)).toHaveAttribute(
        'data-key',
        'orange',
      ),
    );
  });

  it('should handle keyboard navigation', async () => {
    const { getByRole, queryByRole, getAllByRole } = renderWithRoot(
      <ComboBox label="test" disabledKeys={['orange']}>
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Open popover with ArrowDown when closed
    await act(async () => {
      combobox.focus();
      await userEvent.keyboard('{ArrowDown}');
    });

    await waitFor(() => {
      expect(queryByRole('listbox')).toBeInTheDocument();
    });

    // Navigate with ArrowDown and ArrowUp
    await act(async () => {
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{ArrowUp}');
    });

    // Jump to first with Home
    await act(async () => {
      await userEvent.keyboard('{Home}');
    });

    // Jump to last with End
    await act(async () => {
      await userEvent.keyboard('{End}');
    });

    // Select with Enter
    await act(async () => {
      await userEvent.keyboard('{Home}'); // Go to first item
      await userEvent.keyboard('{Enter}');
    });

    await waitFor(() => {
      expect(combobox).toHaveValue('Red');
      expect(queryByRole('listbox')).not.toBeInTheDocument();
    });

    // Test that disabled items are skipped
    await userEvent.clear(combobox);
    await userEvent.type(combobox, 'o');

    await waitFor(() => {
      const options = getAllByRole('option');
      // Orange should be disabled
      expect(options[0]).toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('should handle clear functionality', async () => {
    const onClear = vi.fn();

    const { getByRole, queryByTestId } = renderWithRoot(
      <ComboBox isClearable label="test" onClear={onClear}>
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Clear button should not be visible initially (no value)
    expect(queryByTestId('ComboBoxClearButton')).not.toBeInTheDocument();

    // Type to trigger input
    await userEvent.type(combobox, 'Red');

    // Select the value via keyboard
    await act(async () => {
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{Enter}');
    });

    // Wait for clear button to appear
    await waitFor(() => {
      expect(queryByTestId('ComboBoxClearButton')).toBeInTheDocument();
    });

    // Clear with button click
    const clearButton = queryByTestId('ComboBoxClearButton');
    if (clearButton) {
      await userEvent.click(clearButton);
    }

    // Verify clear callback was called and value is cleared
    await waitFor(() => {
      expect(onClear).toHaveBeenCalled();
      expect(combobox).toHaveValue('');
    });

    // Clear button should be gone after clearing
    expect(queryByTestId('ComboBoxClearButton')).not.toBeInTheDocument();
  });

  describe('Enter and Escape with the popover closed', () => {
    const renderSelected = (props: Record<string, unknown> = {}) => {
      const onSelectionChange = vi.fn();
      const view = renderWithRoot(
        <ComboBox
          label="test"
          defaultSelectedKey="red"
          onSelectionChange={onSelectionChange}
          {...props}
        >
          {items.map((item) => (
            <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
          ))}
        </ComboBox>,
      );

      return {
        combobox: view.getByRole('combobox'),
        queryByRole: view.queryByRole,
        onSelectionChange,
      };
    };

    it('clears the value on Escape when clearable', async () => {
      const onClear = vi.fn();
      const { combobox, onSelectionChange } = renderSelected({
        isClearable: true,
        onClear,
      });

      expect(combobox).toHaveValue('Red');

      await act(async () => {
        combobox.focus();
        await userEvent.keyboard('{Escape}');
      });

      expect(onClear).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenCalledWith(null);
      expect(combobox).toHaveValue('');
    });

    it('keeps the value on Escape when not clearable', async () => {
      const { combobox, onSelectionChange } = renderSelected();

      await act(async () => {
        combobox.focus();
        await userEvent.keyboard('{Escape}');
      });

      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(combobox).toHaveValue('Red');
    });

    it('clears the selection on Enter when the typed text matches nothing', async () => {
      const { combobox, queryByRole, onSelectionChange } = renderSelected();

      await userEvent.clear(combobox);
      // `type` clicks the input first, which opens the list.
      await userEvent.type(combobox, 'zzz');
      await waitFor(() =>
        expect(queryByRole('listbox')).not.toBeInTheDocument(),
      );
      onSelectionChange.mockClear();

      await act(async () => {
        await userEvent.keyboard('{Enter}');
      });

      expect(onSelectionChange).toHaveBeenCalledWith(null);
    });

    it('clears the selection on Enter when the input is empty', async () => {
      const { combobox, queryByRole, onSelectionChange } = renderSelected();

      await userEvent.clear(combobox);
      await act(async () => {
        await userEvent.keyboard('{Escape}');
      });
      expect(queryByRole('listbox')).not.toBeInTheDocument();
      onSelectionChange.mockClear();

      await act(async () => {
        await userEvent.keyboard('{Enter}');
      });

      expect(onSelectionChange).toHaveBeenCalledWith(null);
    });
  });

  it('should clear in a single click while the popover is open (controlled + external filter)', async () => {
    function ControlledCombo() {
      const [inputValue, setInputValue] = useState('Red');
      const [selectedKey, setSelectedKey] = useState<string | null>('red');

      const filtered = items.filter((item) =>
        String(item.children).toLowerCase().includes(inputValue.toLowerCase()),
      );

      return (
        <ComboBox
          isClearable
          label="test"
          filter={false}
          inputValue={inputValue}
          selectedKey={selectedKey}
          onInputChange={setInputValue}
          onSelectionChange={setSelectedKey}
        >
          {filtered.map((item) => (
            <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
          ))}
        </ComboBox>
      );
    }

    const { getByRole, getByTestId, queryByRole, queryByTestId } =
      renderWithRoot(<ControlledCombo />);

    const combobox = getByRole('combobox');
    expect(combobox).toHaveValue('Red');

    // Open the popover so the clear-while-open path is exercised
    await userEvent.click(getByTestId('ComboBoxTrigger'));
    await waitFor(() => {
      expect(queryByRole('listbox')).toBeInTheDocument();
    });

    // A single click must both close the popover AND clear the value
    await userEvent.click(getByTestId('ComboBoxClearButton'));

    await waitFor(() => {
      expect(combobox).toHaveValue('');
    });
    expect(queryByTestId('ComboBoxClearButton')).not.toBeInTheDocument();
  });

  it('should handle custom values', async () => {
    const onInputChange = vi.fn();
    const onSelectionChange = vi.fn();

    const { getByRole, rerender, getAllByRole, queryByRole } = renderWithRoot(
      <ComboBox
        allowsCustomValue
        label="test"
        onInputChange={onInputChange}
        onSelectionChange={onSelectionChange}
      >
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Type custom value
    await userEvent.type(combobox, 'Custom Color');

    expect(onInputChange).toHaveBeenCalledWith('Custom Color');

    // Press Enter with no match
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith('Custom Color');
      expect(combobox).toHaveValue('Custom Color');
    });

    // Test that typing DOES clear selection in allowsCustomValue mode
    onSelectionChange.mockClear();
    await userEvent.clear(combobox);
    await userEvent.type(combobox, 'red');

    await waitFor(() => {
      expect(queryByRole('listbox')).toBeInTheDocument();
    });

    const options = getAllByRole('option');
    await userEvent.click(options[0]); // Select Red

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith('red');
      expect(combobox).toHaveValue('Red');
    });

    // Now type to modify - this SHOULD clear selection in allowsCustomValue mode
    onSelectionChange.mockClear();
    await userEvent.type(combobox, 'x');

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith(null);
    });

    // Test controlled mode with inputValue
    rerender(
      <ComboBox
        allowsCustomValue
        label="test"
        inputValue="My Custom Value"
        onInputChange={onInputChange}
      >
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    await waitFor(() => {
      expect(combobox).toHaveValue('My Custom Value');
    });
  });

  it('should respect shouldCommitOnBlur={false}', async () => {
    const onSelectionChange = vi.fn();

    const { getByRole } = renderWithRoot(
      <ComboBox
        allowsCustomValue
        shouldCommitOnBlur={false}
        label="test"
        onSelectionChange={onSelectionChange}
      >
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Type custom value
    await userEvent.type(combobox, 'Custom Value');

    // Blur without pressing Enter
    await act(async () => {
      combobox.blur();
    });

    // Should NOT commit on blur when shouldCommitOnBlur is false
    await waitFor(() => {
      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    // But should commit on Enter
    await userEvent.clear(combobox);
    await userEvent.type(combobox, 'New Value');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith('New Value');
    });
  });

  it('should allow form submission with single Enter press when allowsCustomValue and no matches', async () => {
    const onSubmit = vi.fn();
    const { getByRole, formInstance } = renderWithForm(
      <ComboBox allowsCustomValue name="tag" label="Tag">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
      { formProps: { onSubmit } },
    );

    const combobox = getByRole('combobox');

    // Type custom value that doesn't match any items (no popover)
    await userEvent.type(combobox, 'CustomValue');

    // Wait for popover to close (if it opened during typing)
    await waitFor(() => {
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    // Press Enter once - should commit value AND submit form
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(formInstance.getFieldValue('tag')).toBe('CustomValue');
      expect(onSubmit).toHaveBeenCalledWith({ tag: 'CustomValue' });
    });
  });

  it('should clear invalid input on blur when clearOnBlur is true', async () => {
    const onSelectionChange = vi.fn();

    const { getByRole, getAllByRole, queryByRole } = renderWithRoot(
      <ComboBox clearOnBlur label="test" onSelectionChange={onSelectionChange}>
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Type to filter and open popover
    await userEvent.type(combobox, 're');

    await waitFor(() => {
      expect(queryByRole('listbox')).toBeInTheDocument();
    });

    // Click on first option (Red)
    const options = getAllByRole('option');
    await userEvent.click(options[0]);

    // Verify selection was made
    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith('red');
      expect(combobox).toHaveValue('Red');
    });

    onSelectionChange.mockClear();

    // Type invalid text to make input invalid
    await userEvent.clear(combobox);
    await userEvent.type(combobox, 'xyz');

    // Blur the input
    await act(async () => {
      combobox.blur();
    });

    // Should clear selection on blur because input is invalid
    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith(null);
      expect(combobox).toHaveValue('');
    });
  }, 15000);

  it('should maintain selection on blur without clearOnBlur flag', async () => {
    const onSelectionChange = vi.fn();

    const { getByRole, getAllByRole, queryByRole } = renderWithRoot(
      <ComboBox label="test" onSelectionChange={onSelectionChange}>
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Type to filter and open popover
    await userEvent.type(combobox, 're');

    await waitFor(() => {
      expect(queryByRole('listbox')).toBeInTheDocument();
    });

    // Click on first option (Red)
    const options = getAllByRole('option');
    await userEvent.click(options[0]);

    // Verify selection was made
    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith('red');
      expect(combobox).toHaveValue('Red');
    });

    // Clear the mock to check no additional calls happen
    onSelectionChange.mockClear();

    // Blur the input
    await act(async () => {
      combobox.blur();
    });

    // Wait a bit to ensure state has settled
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should maintain selection on blur (default behavior)
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(combobox).toHaveValue('Red');
  }, 15000);

  it('should not apply clearOnBlur in allowsCustomValue mode', async () => {
    const onSelectionChange = vi.fn();

    const { getByRole } = renderWithRoot(
      <ComboBox
        allowsCustomValue
        clearOnBlur
        label="test"
        onSelectionChange={onSelectionChange}
      >
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Type custom value
    await userEvent.type(combobox, 'Custom Value');

    // Blur without pressing Enter - should commit the custom value
    await act(async () => {
      combobox.blur();
    });

    // In allowsCustomValue mode, clearOnBlur should not apply
    // Instead, shouldCommitOnBlur (default: true) behavior should apply
    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith('Custom Value');
      expect(combobox).toHaveValue('Custom Value');
    });
  });

  it('should auto-select when there is exactly one filtered result on blur', async () => {
    const onSelectionChange = vi.fn();

    const { getByRole } = renderWithRoot(
      <ComboBox label="test" onSelectionChange={onSelectionChange}>
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Type partial match that results in one item (Violet is unique with 'vio')
    await userEvent.type(combobox, 'vio');

    // Blur the input
    await act(async () => {
      combobox.blur();
    });

    // Should auto-select the single matching item
    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith('violet');
      expect(combobox).toHaveValue('Violet');
    });
  });

  describe('blur with disabled items', () => {
    const people = [
      { key: 'mark', label: 'Mark' },
      { key: 'rita', label: 'Rita' },
      { key: 'rita-added', label: 'Rita Added' },
      { key: 'rita-smith', label: 'Rita Smith' },
    ];

    // Replaces the input with `text`, or leaves it as it is when `text` is
    // null, then moves focus away. Resolves once the blur outcome has been
    // reported: ComboBox calls `onSelectionChange` before `onBlur`.
    const typeAndBlur = async (
      text: string | null,
      props: { clearOnBlur?: boolean; defaultSelectedKey?: string } = {},
    ) => {
      const onSelectionChange = vi.fn();
      const onBlur = vi.fn();
      const { getByRole } = renderWithRoot(
        <ComboBox
          label="Person"
          defaultSelectedKey="mark"
          disabledKeys={['rita', 'rita-added']}
          onSelectionChange={onSelectionChange}
          onBlur={onBlur}
          {...props}
        >
          {people.map((person) => (
            <ComboBox.Item key={person.key}>{person.label}</ComboBox.Item>
          ))}
        </ComboBox>,
      );
      const combobox = getByRole('combobox');

      if (text == null) {
        await userEvent.click(combobox);
      } else {
        await userEvent.clear(combobox);
        await userEvent.type(combobox, text);
      }
      await act(async () => {
        combobox.blur();
      });
      await waitFor(() => expect(onBlur).toHaveBeenCalled());

      return { combobox, onSelectionChange };
    };

    const invalidCases = [
      ['the label of a disabled item beside an enabled result', 'Rita'],
      ['the label of a disabled item', 'Rita Added'],
      ['text matching only a disabled item', 'Rita A'],
      ['text matching several items, one of them enabled', 'Rit'],
    ];

    it.each(invalidCases)(
      'restores the selected label after typing %s',
      async (_, text) => {
        const { combobox, onSelectionChange } = await typeAndBlur(text);

        expect(onSelectionChange).not.toHaveBeenCalled();
        await waitFor(() => expect(combobox).toHaveValue('Mark'));
      },
    );

    it.each(invalidCases)(
      'clears with clearOnBlur after typing %s',
      async (_, text) => {
        const { combobox, onSelectionChange } = await typeAndBlur(text, {
          clearOnBlur: true,
        });

        expect(onSelectionChange.mock.calls).toEqual([[null]]);
        await waitFor(() => expect(combobox).toHaveValue(''));
      },
    );

    it.each([
      ['an enabled exact match', 'Rita Smith'],
      ['an enabled only result', 'Rita S'],
    ])('still selects %s', async (_, text) => {
      const { combobox, onSelectionChange } = await typeAndBlur(text);

      expect(onSelectionChange.mock.calls).toEqual([['rita-smith']]);
      await waitFor(() => expect(combobox).toHaveValue('Rita Smith'));
    });

    it.each([
      ['without typing', null],
      ['after retyping its label', 'Rita Added'],
      ['after typing text matching only it', 'Rita A'],
    ])('keeps a disabled selection with clearOnBlur %s', async (_, text) => {
      const { combobox, onSelectionChange } = await typeAndBlur(text, {
        clearOnBlur: true,
        defaultSelectedKey: 'rita-added',
      });

      expect(onSelectionChange).not.toHaveBeenCalled();
      await waitFor(() => expect(combobox).toHaveValue('Rita Added'));
    });
  });

  describe('blur with repeated labels', () => {
    // Three people named Alex, the first one disabled.
    const blurAlex = async (
      text: string | null,
      defaultSelectedKey: string,
    ) => {
      const onSelectionChange = vi.fn();
      const onBlur = vi.fn();
      const { getByRole } = renderWithRoot(
        <ComboBox
          clearOnBlur
          label="Person"
          defaultSelectedKey={defaultSelectedKey}
          disabledKeys={['alex-old']}
          onSelectionChange={onSelectionChange}
          onBlur={onBlur}
        >
          <ComboBox.Item key="alex-old">Alex</ComboBox.Item>
          <ComboBox.Item key="alex">Alex</ComboBox.Item>
          <ComboBox.Item key="alex-new">Alex</ComboBox.Item>
          <ComboBox.Item key="mark">Mark</ComboBox.Item>
        </ComboBox>,
      );
      const combobox = getByRole('combobox');

      if (text == null) {
        await userEvent.click(combobox);
      } else {
        await userEvent.clear(combobox);
        await userEvent.type(combobox, text);
      }
      await act(async () => {
        combobox.blur();
      });
      await waitFor(() => expect(onBlur).toHaveBeenCalled());

      return { combobox, onSelectionChange };
    };

    it('selects the first enabled item with the typed label', async () => {
      const { combobox, onSelectionChange } = await blurAlex('Alex', 'mark');

      expect(onSelectionChange.mock.calls).toEqual([['alex']]);
      await waitFor(() => expect(combobox).toHaveValue('Alex'));
    });

    it.each([
      ['an enabled item after another with its label', 'alex-new'],
      ['a disabled item', 'alex-old'],
    ])('keeps %s selected', async (_, key) => {
      const { combobox, onSelectionChange } = await blurAlex(null, key);

      expect(onSelectionChange).not.toHaveBeenCalled();
      await waitFor(() => expect(combobox).toHaveValue('Alex'));
    });
  });

  it('should reset to selected value on blur when clearOnBlur is false and input is invalid', async () => {
    const onSelectionChange = vi.fn();

    const { getByRole, getAllByRole, queryByRole } = renderWithRoot(
      <ComboBox label="test" onSelectionChange={onSelectionChange}>
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Type to filter and open popover
    await userEvent.type(combobox, 're');

    await waitFor(() => {
      expect(queryByRole('listbox')).toBeInTheDocument();
    });

    // Click on first option (Red)
    const options = getAllByRole('option');
    await userEvent.click(options[0]);

    // Verify selection was made
    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith('red');
      expect(combobox).toHaveValue('Red');
    });

    onSelectionChange.mockClear();

    // Type invalid text to make input invalid
    await userEvent.clear(combobox);
    await userEvent.type(combobox, 'xyz');

    // Blur the input
    await act(async () => {
      combobox.blur();
    });

    // Should reset input to selected value (Red) since clearOnBlur is false
    await waitFor(() => {
      expect(combobox).toHaveValue('Red');
    });

    // Selection should not change
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('should clear selection when input is empty on blur even with clearOnBlur false', async () => {
    const onSelectionChange = vi.fn();

    const { getByRole, getAllByRole, queryByRole } = renderWithRoot(
      <ComboBox label="test" onSelectionChange={onSelectionChange}>
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Type to filter and open popover
    await userEvent.type(combobox, 're');

    await waitFor(() => {
      expect(queryByRole('listbox')).toBeInTheDocument();
    });

    // Click on first option (Red)
    const options = getAllByRole('option');
    await userEvent.click(options[0]);

    // Verify selection was made
    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith('red');
      expect(combobox).toHaveValue('Red');
    });

    onSelectionChange.mockClear();

    // Clear the input completely
    await userEvent.clear(combobox);

    // Blur the input
    await act(async () => {
      combobox.blur();
    });

    // Should clear selection even though clearOnBlur is false
    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith(null);
      expect(combobox).toHaveValue('');
    });
  });

  it('should show all items when opening with no results', async () => {
    const { getByRole, getAllByRole, queryByRole, getByTestId } =
      renderWithRoot(
        <ComboBox label="test">
          {items.map((item) => (
            <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
          ))}
        </ComboBox>,
      );

    const combobox = getByRole('combobox');
    const trigger = getByTestId('ComboBoxTrigger');

    // Type something that yields no results
    await userEvent.type(combobox, 'xyz');

    await waitFor(() => {
      expect(queryByRole('listbox')).not.toBeInTheDocument();
    });

    // Click trigger to open - should show all items (filter disabled)
    await userEvent.click(trigger);

    await waitFor(
      () => {
        const listbox = queryByRole('listbox');
        expect(listbox).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Should show all 7 items (filter was disabled)
    const options = getAllByRole('option');
    expect(options.length).toBe(7);

    // Clear and type again - should re-enable filtering
    await userEvent.clear(combobox);
    await userEvent.type(combobox, 're');

    await waitFor(() => {
      const filteredOptions = getAllByRole('option');
      expect(filteredOptions.length).toBeLessThan(7); // Filtered again
    });
  });

  it('should integrate with Form', async () => {
    const { getByRole, getAllByRole, queryByRole, formInstance } =
      renderWithForm(
        <ComboBox label="test" name="color">
          {items.map((item) => (
            <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
          ))}
        </ComboBox>,
      );

    const combobox = getByRole('combobox');

    // Select a value
    await userEvent.type(combobox, 're');

    await waitFor(() => {
      expect(queryByRole('listbox')).toBeInTheDocument();
    });

    const options = getAllByRole('option');
    await userEvent.click(options[0]);

    await waitFor(() => {
      expect(formInstance.getFieldValue('color')).toBe('red');
      expect(combobox).toHaveValue('Red');
    });
  });

  it('should respect various props and states', async () => {
    const { getByRole, queryByRole, rerender, getByTestId } = renderWithRoot(
      <ComboBox isDisabled label="test">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    let combobox = getByRole('combobox');

    // Test isDisabled
    expect(combobox).toBeDisabled();
    const trigger = getByTestId('ComboBoxTrigger');

    // Test isReadOnly
    rerender(
      <ComboBox isReadOnly label="test">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    combobox = getByRole('combobox');
    expect(combobox).toHaveAttribute('readonly');

    // Test isLoading
    rerender(
      <ComboBox isLoading label="test">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    await waitFor(() => {
      expect(getByTestId('LoadingIcon')).toBeInTheDocument();
    });

    // Test the validation state
    rerender(
      <ComboBox label="test" isInvalid>
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    await waitFor(() => {
      const wrapper = combobox.closest('[data-invalid]');
      expect(wrapper).toBeInTheDocument();
    });

    rerender(
      <ComboBox label="test" isValid>
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    await waitFor(() => {
      const wrapper = combobox.closest('[data-valid]');
      expect(wrapper).toBeInTheDocument();
    });

    // Test size
    rerender(
      <ComboBox label="test" size="small">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    combobox = getByRole('combobox');
    expect(combobox).toHaveAttribute('data-size', 'small');

    // Test hideTrigger
    rerender(
      <ComboBox hideTrigger label="test">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    expect(queryByRole('button')).not.toBeInTheDocument();
  });

  it('should have proper accessibility and QA attributes', async () => {
    const { getByRole, getByTestId, queryByRole } = renderWithRoot(
      <ComboBox label="test" qa="MyCombobox">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Check QA attribute
    expect(getByTestId('MyCombobox')).toBeInTheDocument();

    // Check initial ARIA attributes
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(combobox).toHaveAttribute('aria-haspopup', 'listbox');
    expect(combobox).not.toHaveAttribute('aria-controls');

    // Open popover and check ARIA attributes
    await userEvent.type(combobox, 're');

    await waitFor(() => {
      expect(queryByRole('listbox')).toBeInTheDocument();
    });

    // Check ARIA attributes when open
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(combobox).toHaveAttribute('aria-controls');

    // Check listbox has proper label
    const listbox = getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-label');
  });

  it('should sort selected item to top by default with items prop', async () => {
    interface Item {
      key: string;
      label: string;
    }

    const itemsArray: Item[] = [
      { key: 'apple', label: 'Apple' },
      { key: 'banana', label: 'Banana' },
      { key: 'cherry', label: 'Cherry' },
      { key: 'date', label: 'Date' },
    ];

    const { getByRole, getAllByRole, getByTestId } = renderWithRoot(
      <ComboBox<Item> label="test" defaultSelectedKey="date" items={itemsArray}>
        {(item) => <ComboBox.Item key={item.key}>{item.label}</ComboBox.Item>}
      </ComboBox>,
    );

    const trigger = getByTestId('ComboBoxTrigger');

    // Open popover
    await userEvent.click(trigger);

    await waitFor(() => {
      const options = getAllByRole('option');
      // Date should be first because it's selected
      expect(options[0]).toHaveTextContent('Date');
      expect(options[1]).toHaveTextContent('Apple');
      expect(options[2]).toHaveTextContent('Banana');
      expect(options[3]).toHaveTextContent('Cherry');
    });
  });

  it('shows items that arrive while the list is open', async () => {
    const renderFruit = (fruits: { key: string; label: string }[]) => (
      <ComboBox label="Fruit" defaultSelectedKey="banana" items={fruits}>
        {(item: { key: string; label: string }) => (
          <ComboBox.Item key={item.key}>{item.label}</ComboBox.Item>
        )}
      </ComboBox>
    );
    const { getAllByRole, getByRole, getByTestId, rerender } = renderWithRoot(
      renderFruit([
        { key: 'apple', label: 'Apple' },
        { key: 'banana', label: 'Banana' },
      ]),
    );

    await userEvent.click(getByTestId('ComboBoxTrigger'));
    await waitFor(() => expect(getByRole('listbox')).toBeVisible());

    rerender(
      renderFruit([
        { key: 'apple', label: 'Apple' },
        { key: 'banana', label: 'Banana' },
        { key: 'cherry', label: 'Cherry' },
      ]),
    );

    expect(getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Banana',
      'Apple',
      'Cherry',
    ]);
  });

  it('should respect sortSelectedToTop={false}', async () => {
    interface Item {
      key: string;
      label: string;
    }

    const itemsArray: Item[] = [
      { key: 'apple', label: 'Apple' },
      { key: 'banana', label: 'Banana' },
      { key: 'cherry', label: 'Cherry' },
      { key: 'date', label: 'Date' },
    ];

    const { getByRole, getAllByRole, getByTestId } = renderWithRoot(
      <ComboBox<Item>
        label="test"
        defaultSelectedKey="date"
        sortSelectedToTop={false}
        items={itemsArray}
      >
        {(item) => <ComboBox.Item key={item.key}>{item.label}</ComboBox.Item>}
      </ComboBox>,
    );

    const trigger = getByTestId('ComboBoxTrigger');

    // Open popover
    await userEvent.click(trigger);

    await waitFor(() => {
      const options = getAllByRole('option');
      // Should maintain original order
      expect(options[0]).toHaveTextContent('Apple');
      expect(options[1]).toHaveTextContent('Banana');
      expect(options[2]).toHaveTextContent('Cherry');
      expect(options[3]).toHaveTextContent('Date');
    });
  });

  it('should not sort when using JSX children', async () => {
    const { getByRole, getAllByRole, getByTestId } = renderWithRoot(
      <ComboBox label="test" defaultSelectedKey="date">
        <ComboBox.Item key="apple">Apple</ComboBox.Item>
        <ComboBox.Item key="banana">Banana</ComboBox.Item>
        <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
        <ComboBox.Item key="date">Date</ComboBox.Item>
      </ComboBox>,
    );

    const trigger = getByTestId('ComboBoxTrigger');

    // Open popover
    await userEvent.click(trigger);

    await waitFor(() => {
      const options = getAllByRole('option');
      // Should maintain original JSX order (sorting doesn't work with JSX children)
      expect(options[0]).toHaveTextContent('Apple');
      expect(options[1]).toHaveTextContent('Banana');
      expect(options[2]).toHaveTextContent('Cherry');
      expect(options[3]).toHaveTextContent('Date');
    });
  });

  it('should display initial input value with defaultSelectedKey', async () => {
    const { getByRole } = renderWithRoot(
      <ComboBox label="test" defaultSelectedKey="blue">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Input should show the label of the selected item immediately
    await waitFor(() => {
      expect(combobox).toHaveValue('Blue');
    });
  });

  it('should display initial input value with controlled selectedKey', async () => {
    const { getByRole } = renderWithRoot(
      <ComboBox label="test" selectedKey="green">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Input should show the label of the selected item immediately without needing focus/blur
    await waitFor(() => {
      expect(combobox).toHaveValue('Green');
    });
  });

  it('should update input value when controlled selectedKey changes', async () => {
    const { getByRole, rerender } = renderWithRoot(
      <ComboBox label="test" selectedKey="red">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Initial value
    await waitFor(() => {
      expect(combobox).toHaveValue('Red');
    });

    // Change selectedKey
    rerender(
      <ComboBox label="test" selectedKey="purple">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    // Input should update to new selection
    await waitFor(() => {
      expect(combobox).toHaveValue('Purple');
    });

    // Clear selection
    rerender(
      <ComboBox label="test" selectedKey={null}>
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    // Input should be empty
    await waitFor(() => {
      expect(combobox).toHaveValue('');
    });
  });

  it('should handle wrapper-level focus and blur events', async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();

    const { getByRole, getByTestId } = renderWithRoot(
      <ComboBox label="test" onFocus={onFocus} onBlur={onBlur}>
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');
    const trigger = getByTestId('ComboBoxTrigger');

    // Focus on input should trigger onFocus
    await act(async () => {
      combobox.focus();
    });

    await waitFor(() => {
      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    // Moving focus to trigger button within wrapper should NOT trigger onBlur/onFocus
    onFocus.mockClear();
    onBlur.mockClear();

    await act(async () => {
      trigger.focus();
    });

    expect(onBlur).not.toHaveBeenCalled();
    expect(onFocus).not.toHaveBeenCalled();

    // Blurring from wrapper should trigger onBlur
    await act(async () => {
      trigger.blur();
    });

    await waitFor(() => {
      expect(onBlur).toHaveBeenCalledTimes(1);
    });
  });

  it('should initialize input with defaultInputValue', async () => {
    const { getByRole } = renderWithRoot(
      <ComboBox label="test" defaultInputValue="Initial text">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Input should show the defaultInputValue immediately
    expect(combobox).toHaveValue('Initial text');
  });

  it('should prioritize defaultInputValue over defaultSelectedKey', async () => {
    const { getByRole } = renderWithRoot(
      <ComboBox
        label="test"
        defaultInputValue="Custom initial text"
        defaultSelectedKey="green"
      >
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Input should show defaultInputValue, not the label from defaultSelectedKey
    expect(combobox).toHaveValue('Custom initial text');
  });

  it('should allow typing when defaultInputValue is set', async () => {
    const onInputChange = vi.fn();

    const { getByRole } = renderWithRoot(
      <ComboBox
        label="test"
        defaultInputValue="Initial"
        onInputChange={onInputChange}
      >
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Clear and type new value
    await userEvent.clear(combobox);
    await userEvent.type(combobox, 'New text');

    expect(combobox).toHaveValue('New text');
    expect(onInputChange).toHaveBeenCalled();
  });

  it('should work with defaultInputValue in allowsCustomValue mode', async () => {
    const onSelectionChange = vi.fn();

    const { getByRole } = renderWithRoot(
      <ComboBox
        allowsCustomValue
        label="test"
        defaultInputValue="Custom value"
        onSelectionChange={onSelectionChange}
      >
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Input should show defaultInputValue
    expect(combobox).toHaveValue('Custom value');

    // Focus and modify the input, then blur to commit
    await act(async () => {
      combobox.focus();
    });

    await userEvent.clear(combobox);
    await userEvent.type(combobox, 'Modified value');

    await act(async () => {
      combobox.blur();
    });

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith('Modified value');
    });
  });

  it('should not interfere with controlled inputValue', async () => {
    const onInputChange = vi.fn();

    const { getByRole } = renderWithRoot(
      <ComboBox
        label="test"
        inputValue="Controlled value"
        defaultInputValue="Should be ignored"
        onInputChange={onInputChange}
      >
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Input should show controlled value, not defaultInputValue
    expect(combobox).toHaveValue('Controlled value');
  });

  it('should mark the input as required outside a form', () => {
    // `ComboBox` builds its own trigger instead of going through a react-aria
    // field hook, so `isRequired` used to reach the label and stop there — the
    // rendered markup was byte-identical to a non-required combobox.
    const { getByRole } = renderWithRoot(
      <ComboBox isRequired label="test">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    expect(getByRole('combobox')).toHaveAttribute('aria-required', 'true');
  });

  it('should not mark the input as required by default', () => {
    const { getByRole } = renderWithRoot(
      <ComboBox label="test">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    expect(getByRole('combobox')).not.toHaveAttribute('aria-required');
  });

  describe('onKeyDown', () => {
    const renderComboBox = (
      onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void,
      onSelectionChange?: (key: unknown) => void,
    ) =>
      renderWithRoot(
        <ComboBox
          label="test"
          onKeyDown={onKeyDown}
          onSelectionChange={onSelectionChange}
        >
          {items.map((item) => (
            <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
          ))}
        </ComboBox>,
      );

    it('runs the user handler with the key and keeps the built-in ArrowDown', async () => {
      const onKeyDown = vi.fn((e: React.KeyboardEvent) => e.key);
      const { getByRole, queryByRole } = renderComboBox(onKeyDown);
      const combobox = getByRole('combobox');

      await act(async () => {
        combobox.focus();
        await userEvent.keyboard('{ArrowDown}');
      });

      expect(onKeyDown).toHaveReturnedWith('ArrowDown');
      await waitFor(() => {
        expect(queryByRole('listbox')).toBeInTheDocument();
      });
    });

    it('skips the built-in ArrowDown when the handler prevents it', async () => {
      const onKeyDown = vi.fn((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') e.preventDefault();
      });
      const { getByRole, queryByRole } = renderComboBox(onKeyDown);
      const combobox = getByRole('combobox');

      await act(async () => {
        combobox.focus();
        await userEvent.keyboard('{ArrowDown}');
      });

      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(queryByRole('listbox')).not.toBeInTheDocument();
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    it('selects the focused option on Enter unless the handler prevents it', async () => {
      let preventEnter = true;
      const onSelectionChange = vi.fn();
      const onKeyDown = vi.fn((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && preventEnter) e.preventDefault();
      });
      const { getByRole, queryByRole } = renderComboBox(
        onKeyDown,
        onSelectionChange,
      );
      const combobox = getByRole('combobox');

      await userEvent.type(combobox, 'r');
      await waitFor(() => {
        expect(getActiveDescendant(combobox)).toHaveAttribute(
          'data-key',
          'red',
        );
      });

      // Prevented: the popover stays open and nothing is selected.
      await act(async () => {
        await userEvent.keyboard('{Enter}');
      });

      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(queryByRole('listbox')).toBeInTheDocument();
      expect(combobox).toHaveValue('r');

      // Not prevented: the built-in Enter selects the focused option.
      preventEnter = false;

      await act(async () => {
        await userEvent.keyboard('{Enter}');
      });

      await waitFor(() => {
        expect(onSelectionChange).toHaveBeenCalledWith('red');
        expect(combobox).toHaveValue('Red');
        expect(queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    // Without a handler, Enter on an unmatched custom value with the popover
    // closed commits it and lets the form submit (see "should allow form
    // submission with single Enter press…"). A handler that prevents Enter
    // takes the key over, so it stops both: the value commits on blur instead.
    it('stops both the custom-value commit and the form submit when Enter is prevented', async () => {
      const onSubmit = vi.fn();
      const onKeyDown = vi.fn((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') e.preventDefault();
      });
      const { getByRole, formInstance } = renderWithForm(
        <ComboBox
          allowsCustomValue
          name="tag"
          label="Tag"
          onKeyDown={onKeyDown}
        >
          {items.map((item) => (
            <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
          ))}
        </ComboBox>,
        { formProps: { onSubmit } },
      );
      const combobox = getByRole('combobox');

      await userEvent.type(combobox, 'CustomValue');
      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
      });

      await act(async () => {
        await userEvent.keyboard('{Enter}');
      });

      expect(onSubmit).not.toHaveBeenCalled();
      expect(formInstance.getFieldValue('tag')).toBeUndefined();
      expect(combobox).toHaveValue('CustomValue');

      await act(async () => {
        combobox.blur();
      });

      await waitFor(() => {
        expect(formInstance.getFieldValue('tag')).toBe('CustomValue');
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('lets a handler that prevents Enter commit the custom value itself', async () => {
      const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());

      function Controlled() {
        const [selectedKey, setSelectedKey] = useState<string | null>(null);

        return (
          <form onSubmit={onSubmit}>
            <ComboBox
              allowsCustomValue
              label="Tag"
              selectedKey={selectedKey}
              onSelectionChange={setSelectedKey}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Stops the form submit and the built-in commit…
                  e.preventDefault();
                  // …so commit the typed value here.
                  setSelectedKey(
                    (e.currentTarget as HTMLInputElement).value.trim() || null,
                  );
                }
              }}
            >
              {items.map((item) => (
                <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
              ))}
            </ComboBox>
            <button type="submit">Submit</button>
            <output data-qa="selected">{selectedKey ?? ''}</output>
          </form>
        );
      }

      const { getByRole, getByTestId } = renderWithRoot(<Controlled />);
      const combobox = getByRole('combobox');

      await userEvent.type(combobox, 'CustomValue');
      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
      });

      await act(async () => {
        await userEvent.keyboard('{Enter}');
      });

      expect(onSubmit).not.toHaveBeenCalled();
      expect(getByTestId('selected')).toHaveTextContent('CustomValue');
      expect(combobox).toHaveValue('CustomValue');
    });
  });

  const colorItems = items.map((item) => (
    <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
  ));

  describe('pressing the input', () => {
    it('opens the list on a click into an input that already has focus', async () => {
      const { getByRole, queryByRole } = renderWithRoot(
        <ComboBox label="Color">{colorItems}</ComboBox>,
      );
      const combobox = getByRole('combobox');

      await userEvent.tab();
      expect(combobox).toHaveFocus();
      expect(queryByRole('listbox')).not.toBeInTheDocument();

      await userEvent.click(combobox);

      await waitFor(() => expect(getByRole('listbox')).toBeVisible());
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });

    it('opens the list again on a click after Escape closed it', async () => {
      const { getByRole, queryByRole, queryAllByRole } = renderWithRoot(
        <ComboBox label="Color">{colorItems}</ComboBox>,
      );
      const combobox = getByRole('combobox');

      await userEvent.type(combobox, 'r');
      await waitFor(() => expect(getByRole('listbox')).toBeVisible());
      const matches = queryAllByRole('option').length;

      expect(matches).toBeLessThan(items.length);
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(queryByRole('listbox')).toBeNull());

      await userEvent.click(combobox);

      await waitFor(() => expect(getByRole('listbox')).toBeVisible());
      // Still the options the typed text leaves.
      expect(queryAllByRole('option')).toHaveLength(matches);
    });

    it('keeps the list hidden on a click when the typed text matches nothing', async () => {
      const onSelectionChange = vi.fn();
      const { getByRole, queryByRole } = renderWithRoot(
        <ComboBox
          allowsCustomValue
          label="Fruit"
          onSelectionChange={onSelectionChange}
        >
          <ComboBox.Item key="apple">Apple</ComboBox.Item>
          <ComboBox.Item key="banana">Banana</ComboBox.Item>
        </ComboBox>,
      );
      const combobox = getByRole('combobox');

      await act(async () => combobox.focus());
      await userEvent.keyboard('xyz');
      expect(queryByRole('listbox')).toBeNull();

      // A click that moves the caret.
      await userEvent.click(combobox);
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

      expect(queryByRole('listbox')).toBeNull();
      expect(combobox).toHaveAttribute('aria-expanded', 'false');

      await userEvent.keyboard('{Enter}');

      expect(onSelectionChange.mock.calls).toEqual([['xyz']]);
      expect(combobox).toHaveValue('xyz');
    });

    it('focuses the input without opening the list on a click on the label', async () => {
      const { getByRole, getByText, queryByRole } = renderWithRoot(
        <ComboBox label="Color">{colorItems}</ComboBox>,
      );
      const combobox = getByRole('combobox');

      await userEvent.click(getByText('Color'));
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

      expect(combobox).toHaveFocus();
      expect(queryByRole('listbox')).toBeNull();

      // A click on the focused input still opens it.
      await userEvent.click(combobox);

      await waitFor(() => expect(getByRole('listbox')).toBeVisible());
    });

    it('does not open the list on a click with popoverTrigger="manual"', async () => {
      const { getByRole, queryByRole } = renderWithRoot(
        <ComboBox label="Color" popoverTrigger="manual">
          {colorItems}
        </ComboBox>,
      );

      await userEvent.click(getByRole('combobox'));

      expect(queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('keeps the list open on a click inside the input while it is open', async () => {
      const { getByRole, getByTestId, queryByRole } = renderWithRoot(
        <ComboBox label="Color">{colorItems}</ComboBox>,
      );
      const combobox = getByRole('combobox');

      await userEvent.type(combobox, 're');
      await waitFor(() => expect(getByRole('listbox')).toBeVisible());

      await userEvent.click(combobox);
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

      expect(getByRole('listbox')).toBeVisible();
      expect(combobox).toHaveFocus();
      expect(combobox).toHaveValue('re');

      // The chevron still toggles the list closed.
      await userEvent.click(getByTestId('ComboBoxTrigger'));
      await waitFor(() => expect(queryByRole('listbox')).toBeNull());
    });
  });

  describe('isReadOnly', () => {
    const renderReadOnly = (props: Record<string, unknown> = {}) => {
      const onSelectionChange = vi.fn();
      const onInputChange = vi.fn();
      const onBlur = vi.fn();
      const view = renderWithRoot(
        <ComboBox
          isReadOnly
          isClearable
          label="Color"
          defaultSelectedKey="red"
          onSelectionChange={onSelectionChange}
          onInputChange={onInputChange}
          onBlur={onBlur}
          {...props}
        >
          {colorItems}
        </ComboBox>,
      );

      return {
        ...view,
        combobox: view.getByRole('combobox'),
        onSelectionChange,
        onInputChange,
        onBlur,
      };
    };

    it('does not open the list from the chevron, the arrow keys or a click', async () => {
      const { combobox, getByTestId, queryByRole } = renderReadOnly();

      await userEvent.click(getByTestId('ComboBoxTrigger'));
      await userEvent.click(combobox);
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{ArrowUp}');
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

      expect(queryByRole('listbox')).not.toBeInTheDocument();
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    it('does not open the list on focus with popoverTrigger="focus"', async () => {
      const { queryByRole } = renderReadOnly({ popoverTrigger: 'focus' });

      await userEvent.tab();
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

      expect(queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('keeps the value on Escape, Enter and blur', async () => {
      const { combobox, onSelectionChange, onInputChange, onBlur } =
        renderReadOnly({ clearOnBlur: true });

      await userEvent.tab();
      await userEvent.keyboard('{Escape}');
      await userEvent.keyboard('{Enter}');
      await act(async () => combobox.blur());
      await waitFor(() => expect(onBlur).toHaveBeenCalled());

      expect(combobox).toHaveValue('Red');
      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(onInputChange).not.toHaveBeenCalled();
    });

    it('does not commit the text on blur with allowsCustomValue', async () => {
      const { combobox, onSelectionChange, onBlur } = renderReadOnly({
        allowsCustomValue: true,
        defaultSelectedKey: undefined,
        defaultInputValue: 'Draft',
      });

      await userEvent.tab();
      await act(async () => combobox.blur());
      await waitFor(() => expect(onBlur).toHaveBeenCalled());

      expect(onSelectionChange).not.toHaveBeenCalled();
    });
  });

  describe('custom value commits', () => {
    it('trims the text committed on blur', async () => {
      const onSelectionChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <ComboBox
          allowsCustomValue
          label="Tag"
          onSelectionChange={onSelectionChange}
        >
          {colorItems}
        </ComboBox>,
      );
      const combobox = getByRole('combobox');

      await userEvent.type(combobox, '  Custom ');
      await act(async () => combobox.blur());

      await waitFor(() =>
        expect(onSelectionChange.mock.calls).toEqual([['Custom']]),
      );
      expect(combobox).toHaveValue('Custom');
    });

    it.each([
      ['empty', ''],
      ['whitespace-only', '   '],
    ])('commits null, never "", on Enter with %s text', async (_, text) => {
      const onSelectionChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <ComboBox
          allowsCustomValue
          label="Tag"
          onSelectionChange={onSelectionChange}
        >
          {[]}
        </ComboBox>,
      );
      const combobox = getByRole('combobox');

      await act(async () => combobox.focus());
      if (text) await userEvent.type(combobox, text);
      await userEvent.keyboard('{Enter}');

      expect(onSelectionChange).not.toHaveBeenCalledWith('');
      expect(onSelectionChange).toHaveBeenLastCalledWith(null);
    });

    it('commits the typed text on Enter with the list closed, even when options match', async () => {
      const onSelectionChange = vi.fn();
      const { getByRole, queryByRole } = renderWithRoot(
        <ComboBox
          allowsCustomValue
          label="Fruit"
          onSelectionChange={onSelectionChange}
        >
          <ComboBox.Item key="apple">Apple</ComboBox.Item>
          <ComboBox.Item key="banana">Banana</ComboBox.Item>
        </ComboBox>,
      );
      const combobox = getByRole('combobox');

      await userEvent.type(combobox, 'app');
      await waitFor(() => expect(getByRole('listbox')).toBeVisible());
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(queryByRole('listbox')).toBeNull());
      onSelectionChange.mockClear();

      await userEvent.keyboard('{Enter}');

      expect(onSelectionChange.mock.calls).toEqual([['app']]);
      expect(combobox).toHaveValue('app');
    });

    it('still picks the highlighted option on Enter with the list open', async () => {
      const onSelectionChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <ComboBox
          allowsCustomValue
          label="Fruit"
          onSelectionChange={onSelectionChange}
        >
          <ComboBox.Item key="apple">Apple</ComboBox.Item>
          <ComboBox.Item key="banana">Banana</ComboBox.Item>
        </ComboBox>,
      );
      const combobox = getByRole('combobox');

      await userEvent.type(combobox, 'app');
      await waitFor(() =>
        expect(getActiveDescendant(combobox)).toHaveAttribute(
          'data-key',
          'apple',
        ),
      );
      await userEvent.keyboard('{Enter}');

      expect(onSelectionChange).toHaveBeenLastCalledWith('apple');
      expect(combobox).toHaveValue('Apple');
    });

    it('commits edited text on Enter when the parent declined to clear the selection', async () => {
      const onSelectionChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <ComboBox
          allowsCustomValue
          label="Tag"
          selectedKey="known"
          onSelectionChange={onSelectionChange}
        >
          <ComboBox.Item key="known">Known</ComboBox.Item>
        </ComboBox>,
      );
      const combobox = getByRole('combobox');

      await userEvent.type(combobox, '!');
      expect(combobox).toHaveValue('Known!');
      onSelectionChange.mockClear();

      await userEvent.keyboard('{Enter}');

      expect(onSelectionChange.mock.calls).toEqual([['Known!']]);
    });

    it('keeps the selection on Enter when the text is the selected label', async () => {
      const onSelectionChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <ComboBox
          allowsCustomValue
          label="Fruit"
          defaultSelectedKey="apple"
          onSelectionChange={onSelectionChange}
        >
          <ComboBox.Item key="apple">Apple</ComboBox.Item>
          <ComboBox.Item key="banana">Banana</ComboBox.Item>
        </ComboBox>,
      );

      await userEvent.tab();
      await userEvent.keyboard('{Enter}');

      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(getByRole('combobox')).toHaveValue('Apple');
    });
  });

  describe('re-picking the selected option', () => {
    it('keeps the value and closes the list on a click', async () => {
      const onSelectionChange = vi.fn();
      const { getByRole, getByTestId, queryByRole } = renderWithRoot(
        <ComboBox
          label="Color"
          defaultSelectedKey="red"
          onSelectionChange={onSelectionChange}
        >
          {colorItems}
        </ComboBox>,
      );
      const combobox = getByRole('combobox');

      await userEvent.click(getByTestId('ComboBoxTrigger'));
      await waitFor(() => expect(getByRole('listbox')).toBeVisible());
      await userEvent.click(getByRole('option', { name: 'Red' }));

      await waitFor(() => expect(queryByRole('listbox')).toBeNull());
      expect(onSelectionChange).not.toHaveBeenCalledWith(null);
      expect(combobox).toHaveValue('Red');
    });

    it('keeps the value on Enter', async () => {
      const onSelectionChange = vi.fn();
      const { getByRole, queryByRole } = renderWithRoot(
        <ComboBox
          label="Color"
          defaultSelectedKey="red"
          onSelectionChange={onSelectionChange}
        >
          {colorItems}
        </ComboBox>,
      );
      const combobox = getByRole('combobox');

      await act(async () => combobox.focus());
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() =>
        expect(getActiveDescendant(combobox)).toHaveAttribute(
          'data-key',
          'red',
        ),
      );
      await userEvent.keyboard('{Enter}');

      await waitFor(() => expect(queryByRole('listbox')).toBeNull());
      expect(onSelectionChange).not.toHaveBeenCalledWith(null);
      expect(combobox).toHaveValue('Red');
    });
  });

  it('marks the input as filtering a list with aria-autocomplete', () => {
    const { getByRole } = renderWithRoot(
      <ComboBox label="Color">{colorItems}</ComboBox>,
    );

    expect(getByRole('combobox')).toHaveAttribute('aria-autocomplete', 'list');
  });

  describe('Escape and Tab propagation', () => {
    function InModal(props: Record<string, unknown>) {
      return (
        <DialogTrigger isDismissable type="modal">
          <Button>Open</Button>
          <Dialog aria-label="Task">
            <Content>
              <ComboBox label="Color" {...props}>
                {colorItems}
              </ComboBox>
            </Content>
          </Dialog>
        </DialogTrigger>
      );
    }

    async function openModal(props: Record<string, unknown> = {}) {
      const view = renderWithRoot(<InModal {...props} />);

      await userEvent.click(view.getByRole('button', { name: 'Open' }));
      await waitFor(() => expect(view.getByRole('dialog')).toBeVisible());

      const combobox = view.getByRole('combobox');

      await act(async () => combobox.focus());

      return { ...view, combobox };
    }

    it('lets Escape close the dialog when the list is closed and nothing clears', async () => {
      const { queryByRole } = await openModal({ defaultSelectedKey: 'red' });

      await userEvent.keyboard('{Escape}');

      await waitFor(() => expect(queryByRole('dialog')).toBeNull());
    });

    it('keeps the dialog open when Escape closes the list', async () => {
      const { combobox, getByRole, queryByRole } = await openModal();

      await userEvent.type(combobox, 'r');
      await waitFor(() => expect(getByRole('listbox')).toBeVisible());
      await userEvent.keyboard('{Escape}');

      await waitFor(() => expect(queryByRole('listbox')).toBeNull());
      expect(getByRole('dialog')).toBeVisible();
    });

    it('keeps the dialog open when Escape clears the value', async () => {
      const { combobox, getByRole } = await openModal({
        isClearable: true,
        defaultSelectedKey: 'red',
      });

      await userEvent.keyboard('{Escape}');

      expect(combobox).toHaveValue('');
      expect(getByRole('dialog')).toBeVisible();
    });

    it('lets Tab reach the ancestors', async () => {
      const onKeyDown = vi.fn();
      const { getByRole } = renderWithRoot(
        <div onKeyDown={(e) => onKeyDown(e.key)}>
          <ComboBox label="Color">{colorItems}</ComboBox>
        </div>,
      );

      await act(async () => getByRole('combobox').focus());
      await userEvent.keyboard('{Tab}');

      expect(onKeyDown).toHaveBeenCalledWith('Tab');
    });
  });

  describe('blurring an untouched field', () => {
    it.each([
      ['empty', {}],
      ['with a value', { defaultSelectedKey: 'red' }],
      ['empty with allowsCustomValue', { allowsCustomValue: true }],
      [
        'with a value and allowsCustomValue',
        { allowsCustomValue: true, defaultSelectedKey: 'red' },
      ],
    ])('reports nothing when %s', async (_, props) => {
      const onSelectionChange = vi.fn();
      const onInputChange = vi.fn();
      const onBlur = vi.fn();

      const { getByRole } = renderWithRoot(
        <ComboBox
          label="Color"
          onSelectionChange={onSelectionChange}
          onInputChange={onInputChange}
          onBlur={onBlur}
          {...props}
        >
          {colorItems}
        </ComboBox>,
      );

      await userEvent.tab();
      expect(getByRole('combobox')).toHaveFocus();
      await act(async () => getByRole('combobox').blur());
      await waitFor(() => expect(onBlur).toHaveBeenCalled());

      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(onInputChange).not.toHaveBeenCalled();
    });
  });

  it('never points aria-activedescendant at an option the filter removed', async () => {
    const { getByRole } = renderWithRoot(
      <ComboBox label="Fruit">
        <ComboBox.Item key="apple">Apple</ComboBox.Item>
        <ComboBox.Item key="banana">Banana</ComboBox.Item>
        <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
      </ComboBox>,
    );
    const combobox = getByRole('combobox');

    await act(async () => combobox.focus());
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(getActiveDescendant(combobox)).toHaveAttribute(
        'data-key',
        'apple',
      ),
    );
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(getActiveDescendant(combobox)).toHaveAttribute(
        'data-key',
        'banana',
      ),
    );

    await userEvent.type(combobox, 'ch');

    // Right after the keystroke, before any deferred refocus.
    if (combobox.hasAttribute('aria-activedescendant')) {
      expect(getActiveDescendant(combobox)).toHaveAttribute('role', 'option');
    }
    await waitFor(() =>
      expect(getActiveDescendant(combobox)).toHaveAttribute(
        'data-key',
        'cherry',
      ),
    );
  });

  describe('onOpenChange and aria-expanded', () => {
    it('does not report on mount', () => {
      const onOpenChange = vi.fn();

      renderWithRoot(
        <ComboBox label="Color" onOpenChange={onOpenChange}>
          {colorItems}
        </ComboBox>,
      );

      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('reports one close while typing text that matches nothing', async () => {
      const onOpenChange = vi.fn();
      const { getByRole, getByTestId } = renderWithRoot(
        <ComboBox label="Color" onOpenChange={onOpenChange}>
          {colorItems}
        </ComboBox>,
      );
      const combobox = getByRole('combobox');
      const expanded: (string | null)[] = [];

      await userEvent.click(getByTestId('ComboBoxTrigger'));
      await waitFor(() => expect(getByRole('listbox')).toBeVisible());

      for (const char of 'zzz') {
        await userEvent.keyboard(char);
        expanded.push(combobox.getAttribute('aria-expanded'));
      }

      expect(combobox).toHaveValue('zzz');

      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
      expect(expanded).toEqual(['false', 'false', 'false']);
    });
  });

  describe('labels of the selected key', () => {
    it('shows the label once items arrive after a controlled selectedKey', async () => {
      const countries = [{ key: 'us', label: 'United States' }];
      const renderCountry = (list: typeof countries) => (
        <ComboBox label="Country" selectedKey="us" items={list}>
          {(item: (typeof countries)[number]) => (
            <ComboBox.Item key={item.key}>{item.label}</ComboBox.Item>
          )}
        </ComboBox>
      );
      const { getByRole, rerender } = renderWithRoot(renderCountry([]));

      rerender(renderCountry(countries));

      await waitFor(() =>
        expect(getByRole('combobox')).toHaveValue('United States'),
      );
    });

    const users = [
      { key: 'u-1', name: 'Alice' },
      { key: 'u-2', name: 'Bob' },
    ];

    function renderUsers(
      list: typeof users,
      props: Record<string, unknown> = {},
    ) {
      return (
        <ComboBox label="User" filter={false} items={list} {...props}>
          {(item: (typeof users)[number]) => (
            <ComboBox.Item key={item.key}>{item.name}</ComboBox.Item>
          )}
        </ComboBox>
      );
    }

    it('keeps the picked label when the options drop the selected item', async () => {
      const { getByRole, rerender } = renderWithRoot(renderUsers(users));
      const combobox = getByRole('combobox');

      await userEvent.click(getByRole('button', { name: 'Show options' }));
      await userEvent.click(getByRole('option', { name: 'Alice' }));
      await waitFor(() => expect(combobox).toHaveValue('Alice'));

      // A refetch or a server-side search that leaves the item out.
      rerender(renderUsers([]));

      expect(combobox).toHaveValue('Alice');
    });

    it('keeps the picked label when the pick itself empties the options', async () => {
      function Search() {
        const [list, setList] = useState(users);

        // A server-side search: the new query has no results yet.
        return renderUsers(list, { onSelectionChange: () => setList([]) });
      }

      const { getByRole, queryByRole } = renderWithRoot(<Search />);
      const combobox = getByRole('combobox');

      await userEvent.click(getByRole('button', { name: 'Show options' }));
      await userEvent.click(getByRole('option', { name: 'Alice' }));

      await waitFor(() => expect(queryByRole('listbox')).toBeNull());
      expect(combobox).toHaveValue('Alice');
    });

    it('keeps a controlled label shown once, and not for another key', () => {
      const { getByRole, rerender } = renderWithRoot(
        renderUsers(users, { selectedKey: 'u-1' }),
      );
      const combobox = getByRole('combobox');

      expect(combobox).toHaveValue('Alice');

      rerender(renderUsers([], { selectedKey: 'u-1' }));
      expect(combobox).toHaveValue('Alice');

      // A key whose label never loaded shows the key until it does.
      rerender(renderUsers([], { selectedKey: 'u-2' }));
      expect(combobox).toHaveValue('u-2');

      rerender(renderUsers(users, { selectedKey: 'u-2' }));
      expect(combobox).toHaveValue('Bob');
    });

    it('shows the label of defaultSelectedKey in the first commit', () => {
      const firstValue = vi.fn();

      function ReadFirstCommit() {
        useLayoutEffect(() => {
          firstValue(
            document.querySelector<HTMLInputElement>('[role="combobox"]')
              ?.value,
          );
        }, []);

        return null;
      }

      renderWithRoot(
        <>
          <ComboBox label="Color" defaultSelectedKey="blue">
            {colorItems}
          </ComboBox>
          <ReadFirstCommit />
        </>,
      );

      expect(firstValue).toHaveBeenCalledWith('Blue');
    });
  });

  it('picks the first match on an Enter pressed right after typing, without submitting the form', async () => {
    const onSubmit = vi.fn();
    const { getByRole, formInstance } = renderWithForm(
      <ComboBox name="fruit" label="Fruit">
        <ComboBox.Item key="apple">Apple</ComboBox.Item>
        <ComboBox.Item key="cherry">Cherry</ComboBox.Item>
      </ComboBox>,
      { formProps: { onSubmit } },
    );
    const combobox = getByRole('combobox');
    const user = userEvent.setup({ delay: null });

    await user.type(combobox, 'Cherry{Enter}');

    await waitFor(() =>
      expect(formInstance.getFieldValue('fruit')).toBe('cherry'),
    );
    expect(combobox).toHaveValue('Cherry');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  describe('chevron and clear button', () => {
    it('leaves them out of the Tab order and closes the list on Tab', async () => {
      const { getByRole, queryByRole } = renderWithRoot(
        <>
          <ComboBox isClearable label="Color" defaultSelectedKey="red">
            {colorItems}
          </ComboBox>
          <TextInput label="Next" />
        </>,
      );
      const combobox = getByRole('combobox');

      await act(async () => combobox.focus());
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(getByRole('listbox')).toBeVisible());

      await userEvent.tab();

      expect(getByRole('textbox', { name: 'Next' })).toHaveFocus();
      await waitFor(() => expect(queryByRole('listbox')).toBeNull());
    });

    it('returns focus to the input when the chevron closes the list', async () => {
      const { getByRole, getByTestId, queryByRole } = renderWithRoot(
        <ComboBox label="Color">{colorItems}</ComboBox>,
      );
      const trigger = getByTestId('ComboBoxTrigger');

      await userEvent.click(trigger);
      await waitFor(() => expect(getByRole('listbox')).toBeVisible());
      await userEvent.click(trigger);

      await waitFor(() => expect(queryByRole('listbox')).toBeNull());
      expect(getByRole('combobox')).toHaveFocus();
    });
  });

  it('matches the typed text exactly with the same collator as the filter', async () => {
    const onSelectionChange = vi.fn();
    const onBlur = vi.fn();
    const { getByRole } = renderWithRoot(
      <ComboBox
        label="Season"
        onSelectionChange={onSelectionChange}
        onBlur={onBlur}
      >
        <ComboBox.Item key="summer">Été</ComboBox.Item>
        <ComboBox.Item key="indian-summer">Été indien</ComboBox.Item>
      </ComboBox>,
    );
    const combobox = getByRole('combobox');

    // The filter shows both items for "ete"; the first is an exact match.
    await userEvent.type(combobox, 'ete');
    await waitFor(() =>
      expect(document.querySelectorAll('[role="option"]')).toHaveLength(2),
    );
    await act(async () => combobox.blur());
    await waitFor(() => expect(onBlur).toHaveBeenCalled());

    expect(onSelectionChange.mock.calls).toEqual([['summer']]);
    expect(combobox).toHaveValue('Été');
  });

  it('keeps showing the controlled label when the parent rejects a pick', async () => {
    const onSelectionChange = vi.fn();
    const { getByRole, getByTestId, queryByRole } = renderWithRoot(
      <ComboBox
        label="Color"
        selectedKey="red"
        onSelectionChange={onSelectionChange}
      >
        {colorItems}
      </ComboBox>,
    );
    const combobox = getByRole('combobox');

    await userEvent.click(getByTestId('ComboBoxTrigger'));
    await waitFor(() => expect(getByRole('listbox')).toBeVisible());
    await userEvent.click(getByRole('option', { name: 'Blue' }));

    await waitFor(() => expect(queryByRole('listbox')).toBeNull());
    expect(onSelectionChange).toHaveBeenCalledWith('blue');
    expect(combobox).toHaveValue('Red');
  });

  it.each([
    ['isComposing', { isComposing: true }],
    ['keyCode 229', { keyCode: 229 }],
  ])(
    'leaves an Enter during IME composition to the IME (%s)',
    async (_, init) => {
      const onSelectionChange = vi.fn();
      const { getByRole } = renderWithRoot(
        <ComboBox
          allowsCustomValue
          label="Word"
          onSelectionChange={onSelectionChange}
        >
          {colorItems}
        </ComboBox>,
      );
      const combobox = getByRole('combobox');

      await userEvent.type(combobox, 'r');
      await waitFor(() =>
        expect(getActiveDescendant(combobox)).toHaveAttribute(
          'data-key',
          'red',
        ),
      );
      onSelectionChange.mockClear();

      fireEvent.keyDown(combobox, { key: 'Enter', ...init });

      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(combobox).toHaveValue('r');
      expect(getByRole('listbox')).toBeVisible();
    },
  );

  it('gives the options the size of the field', async () => {
    const { getByRole, getAllByRole, getByTestId } = renderWithRoot(
      <ComboBox label="Color" size="large">
        {colorItems}
      </ComboBox>,
    );

    await userEvent.click(getByTestId('ComboBoxTrigger'));
    await waitFor(() => expect(getByRole('listbox')).toBeVisible());

    expect(getAllByRole('option')[0]).toHaveAttribute('data-size', 'large');
  });
});
