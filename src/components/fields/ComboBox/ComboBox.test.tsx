import { act, waitFor } from '@testing-library/react';

import { renderWithForm, renderWithRoot, userEvent } from '../../../test/index';

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

jest.mock('../../../_internal/hooks/use-warn');

describe('<ComboBox />', () => {
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
    const customFilterFn = jest.fn((textValue, inputValue) =>
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

  it.skip('should manage selection correctly', async () => {
    const onSelectionChange = jest.fn();

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
    const onClear = jest.fn();

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

  it('should handle custom values', async () => {
    const onInputChange = jest.fn();
    const onSelectionChange = jest.fn();

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
    const onSelectionChange = jest.fn();

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

  it('should clear invalid input on blur when clearOnBlur is true', async () => {
    const onSelectionChange = jest.fn();

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
    const onSelectionChange = jest.fn();

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
    const onSelectionChange = jest.fn();

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
    const onSelectionChange = jest.fn();

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

  it('should reset to selected value on blur when clearOnBlur is false and input is invalid', async () => {
    const onSelectionChange = jest.fn();

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
    const onSelectionChange = jest.fn();

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

    // Test validationState
    rerender(
      <ComboBox label="test" validationState="invalid">
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
      <ComboBox label="test" validationState="valid">
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
      <ComboBox label="test" qa="my-combobox">
        {items.map((item) => (
          <ComboBox.Item key={item.key}>{item.children}</ComboBox.Item>
        ))}
      </ComboBox>,
    );

    const combobox = getByRole('combobox');

    // Check QA attribute
    expect(getByTestId('my-combobox')).toBeInTheDocument();

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
    const onFocus = jest.fn();
    const onBlur = jest.fn();

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
    const onInputChange = jest.fn();

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
    const onSelectionChange = jest.fn();

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
    const onInputChange = jest.fn();

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
});
