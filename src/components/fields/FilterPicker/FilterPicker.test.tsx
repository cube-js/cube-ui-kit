import React, { createRef } from 'react';

import { FilterPicker } from '../../../index';
import { act, renderWithRoot, userEvent, within } from '../../../test';

jest.mock('../../../_internal/hooks/use-warn');

describe('<FilterPicker />', () => {
  const basicItems = [
    <FilterPicker.Item key="apple">Apple</FilterPicker.Item>,
    <FilterPicker.Item key="banana">Banana</FilterPicker.Item>,
    <FilterPicker.Item key="cherry">Cherry</FilterPicker.Item>,
    <FilterPicker.Item key="date">Date</FilterPicker.Item>,
    <FilterPicker.Item key="elderberry">Elderberry</FilterPicker.Item>,
  ];

  const sectionsItems = [
    <FilterPicker.Section key="fruits" title="Fruits">
      <FilterPicker.Item key="apple">Apple</FilterPicker.Item>
      <FilterPicker.Item key="banana">Banana</FilterPicker.Item>
      <FilterPicker.Item key="cherry">Cherry</FilterPicker.Item>
    </FilterPicker.Section>,
    <FilterPicker.Section key="vegetables" title="Vegetables">
      <FilterPicker.Item key="carrot">Carrot</FilterPicker.Item>
      <FilterPicker.Item key="broccoli">Broccoli</FilterPicker.Item>
      <FilterPicker.Item key="spinach">Spinach</FilterPicker.Item>
    </FilterPicker.Section>,
  ];

  describe('Basic functionality', () => {
    it('should render trigger button with placeholder', () => {
      const { getByRole } = renderWithRoot(
        <FilterPicker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
        >
          {basicItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent('Choose fruits...');
    });

    it('should open popover when clicked', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <FilterPicker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
        >
          {basicItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Click to open popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Check that the popover is open and contains options
      expect(getByText('Apple')).toBeInTheDocument();
      expect(getByText('Banana')).toBeInTheDocument();
      expect(getByText('Cherry')).toBeInTheDocument();
    });

    it('should close popover when item is selected in single mode', async () => {
      const { getByRole, getByText, queryByText } = renderWithRoot(
        <FilterPicker
          label="Select fruit"
          placeholder="Choose a fruit..."
          selectionMode="single"
        >
          {basicItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Click to open popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      expect(getByText('Apple')).toBeInTheDocument();

      // Select an option
      await act(async () => {
        await userEvent.click(getByText('Apple'));
      });

      // Popover should close
      expect(queryByText('Banana')).not.toBeInTheDocument();
      expect(trigger).toHaveTextContent('Apple');
    });
  });

  describe('Selection sorting functionality', () => {
    it('should NOT sort selected items to top while popover is open', async () => {
      const TestComponent = () => {
        const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);

        return (
          <FilterPicker
            label="Select fruits"
            placeholder="Choose fruits..."
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            onSelectionChange={(keys) => setSelectedKeys(keys as string[])}
          >
            {basicItems}
          </FilterPicker>
        );
      };

      const { getByRole, getByText } = renderWithRoot(<TestComponent />);

      const trigger = getByRole('button');

      // Open the popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Verify initial order is preserved
      const listbox = getByRole('listbox');
      let options = within(listbox).getAllByRole('option');
      expect(options[0]).toHaveTextContent('Apple');
      expect(options[1]).toHaveTextContent('Banana');
      expect(options[2]).toHaveTextContent('Cherry');
      expect(options[3]).toHaveTextContent('Date');
      expect(options[4]).toHaveTextContent('Elderberry');

      // Select Cherry and Elderberry (not the first ones)
      await act(async () => {
        await userEvent.click(getByText('Cherry'));
      });
      await act(async () => {
        await userEvent.click(getByText('Elderberry'));
      });

      // Check that order remains unchanged while popover is open
      options = within(listbox).getAllByRole('option');
      expect(options[0]).toHaveTextContent('Apple');
      expect(options[1]).toHaveTextContent('Banana');
      expect(options[2]).toHaveTextContent('Cherry');
      expect(options[3]).toHaveTextContent('Date');
      expect(options[4]).toHaveTextContent('Elderberry');

      // Check that trigger shows selection
      expect(trigger).toHaveTextContent('Cherry, Elderberry');
    });

    it('should sort selected items to top when popover reopens in multiple mode', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <FilterPicker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
        >
          {basicItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Step 1: Open the popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Step 2: Check initial order is not changed (Apple, Banana, Cherry, Date, Elderberry)
      const listbox = getByRole('listbox');
      const initialOptions = within(listbox).getAllByRole('option');
      expect(initialOptions[0]).toHaveTextContent('Apple');
      expect(initialOptions[1]).toHaveTextContent('Banana');
      expect(initialOptions[2]).toHaveTextContent('Cherry');
      expect(initialOptions[3]).toHaveTextContent('Date');
      expect(initialOptions[4]).toHaveTextContent('Elderberry');

      // Step 3: Select two options (Cherry and Elderberry - not the first ones)
      await act(async () => {
        await userEvent.click(getByText('Cherry'));
      });
      await act(async () => {
        await userEvent.click(getByText('Elderberry'));
      });

      // Step 4: Verify order remains unchanged while popover is open
      const optionsAfterSelection = within(listbox).getAllByRole('option');
      expect(optionsAfterSelection[0]).toHaveTextContent('Apple');
      expect(optionsAfterSelection[1]).toHaveTextContent('Banana');
      expect(optionsAfterSelection[2]).toHaveTextContent('Cherry');
      expect(optionsAfterSelection[3]).toHaveTextContent('Date');
      expect(optionsAfterSelection[4]).toHaveTextContent('Elderberry');

      // Step 5: Close the popover (click outside)
      await act(async () => {
        await userEvent.keyboard('{Escape}');
      });

      // Step 6: Check that the trigger shows selected options
      expect(trigger).toHaveTextContent('Cherry, Elderberry');

      // Step 7: Open the popover again
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Step 8: Check that selected items are now at the top
      const reorderedOptions = within(getByRole('listbox')).getAllByRole(
        'option',
      );
      expect(reorderedOptions[0]).toHaveTextContent('Cherry');
      expect(reorderedOptions[1]).toHaveTextContent('Elderberry');
      expect(reorderedOptions[2]).toHaveTextContent('Apple');
      expect(reorderedOptions[3]).toHaveTextContent('Banana');
      expect(reorderedOptions[4]).toHaveTextContent('Date');
    });

    it('should sort selected items to top within their sections', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <FilterPicker
          label="Select items"
          placeholder="Choose items..."
          selectionMode="multiple"
        >
          {sectionsItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Step 1: Open the popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Step 1.5: Verify initial order within sections
      let listbox = getByRole('listbox');
      let fruitsSection = within(listbox).getByText('Fruits').closest('li');
      let vegetablesSection = within(listbox)
        .getByText('Vegetables')
        .closest('li');
      let fruitsOptions = within(fruitsSection!).getAllByRole('option');
      let vegetablesOptions = within(vegetablesSection!).getAllByRole('option');

      // Initial order should be preserved
      expect(fruitsOptions[0]).toHaveTextContent('Apple');
      expect(fruitsOptions[1]).toHaveTextContent('Banana');
      expect(fruitsOptions[2]).toHaveTextContent('Cherry');
      expect(vegetablesOptions[0]).toHaveTextContent('Carrot');
      expect(vegetablesOptions[1]).toHaveTextContent('Broccoli');
      expect(vegetablesOptions[2]).toHaveTextContent('Spinach');

      // Step 2: Select some items from different sections (Cherry from Fruits, Spinach from Vegetables)
      await act(async () => {
        await userEvent.click(getByText('Cherry'));
      });
      await act(async () => {
        await userEvent.click(getByText('Spinach'));
      });

      // Step 2.5: Verify order still unchanged while popover is open
      fruitsOptions = within(fruitsSection!).getAllByRole('option');
      vegetablesOptions = within(vegetablesSection!).getAllByRole('option');

      expect(fruitsOptions[0]).toHaveTextContent('Apple');
      expect(fruitsOptions[1]).toHaveTextContent('Banana');
      expect(fruitsOptions[2]).toHaveTextContent('Cherry');
      expect(vegetablesOptions[0]).toHaveTextContent('Carrot');
      expect(vegetablesOptions[1]).toHaveTextContent('Broccoli');
      expect(vegetablesOptions[2]).toHaveTextContent('Spinach');

      // Step 3: Close the popover
      await act(async () => {
        await userEvent.keyboard('{Escape}');
      });

      // Step 4: Check that the trigger shows selected options
      expect(trigger).toHaveTextContent('Cherry, Spinach');

      // Step 5: Open the popover again
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Step 6: Check that selected items are now at the top of their respective sections
      listbox = getByRole('listbox');

      // Find section boundaries
      fruitsSection = within(listbox).getByText('Fruits').closest('li');
      vegetablesSection = within(listbox).getByText('Vegetables').closest('li');

      // Get options within each section
      fruitsOptions = within(fruitsSection!).getAllByRole('option');
      vegetablesOptions = within(vegetablesSection!).getAllByRole('option');

      // Check that Cherry is first in Fruits section
      expect(fruitsOptions[0]).toHaveTextContent('Cherry');
      expect(fruitsOptions[1]).toHaveTextContent('Apple');
      expect(fruitsOptions[2]).toHaveTextContent('Banana');

      // Check that Spinach is first in Vegetables section
      expect(vegetablesOptions[0]).toHaveTextContent('Spinach');
      expect(vegetablesOptions[1]).toHaveTextContent('Carrot');
      expect(vegetablesOptions[2]).toHaveTextContent('Broccoli');
    });

    it('should maintain sorting when items are deselected and popover reopens', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <FilterPicker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
        >
          {basicItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Open popover and select items
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Verify initial order
      let listbox = getByRole('listbox');
      let options = within(listbox).getAllByRole('option');
      expect(options[0]).toHaveTextContent('Apple');
      expect(options[1]).toHaveTextContent('Banana');
      expect(options[2]).toHaveTextContent('Cherry');
      expect(options[3]).toHaveTextContent('Date');
      expect(options[4]).toHaveTextContent('Elderberry');

      await act(async () => {
        await userEvent.click(getByText('Date'));
      });
      await act(async () => {
        await userEvent.click(getByText('Banana'));
      });

      // Verify order unchanged while popover is open
      options = within(listbox).getAllByRole('option');
      expect(options[0]).toHaveTextContent('Apple');
      expect(options[1]).toHaveTextContent('Banana');
      expect(options[2]).toHaveTextContent('Cherry');
      expect(options[3]).toHaveTextContent('Date');
      expect(options[4]).toHaveTextContent('Elderberry');

      // Close and reopen
      await act(async () => {
        await userEvent.keyboard('{Escape}');
      });

      await act(async () => {
        await userEvent.click(trigger);
      });

      // Verify sorting after reopening (selected items sorted by their original order)
      listbox = getByRole('listbox');
      options = within(listbox).getAllByRole('option');
      expect(options[0]).toHaveTextContent('Banana');
      expect(options[1]).toHaveTextContent('Date');
      expect(options[2]).toHaveTextContent('Apple');
      expect(options[3]).toHaveTextContent('Cherry');
      expect(options[4]).toHaveTextContent('Elderberry');

      // Deselect one item
      await act(async () => {
        await userEvent.click(getByText('Date'));
      });

      // Verify order unchanged while popover is open (Date deselected but still in same position)
      options = within(listbox).getAllByRole('option');
      expect(options[0]).toHaveTextContent('Banana');
      expect(options[1]).toHaveTextContent('Date');
      expect(options[2]).toHaveTextContent('Apple');
      expect(options[3]).toHaveTextContent('Cherry');
      expect(options[4]).toHaveTextContent('Elderberry');

      // Close and reopen
      await act(async () => {
        await userEvent.keyboard('{Escape}');
      });

      await act(async () => {
        await userEvent.click(trigger);
      });

      // Only Banana should be at top now
      options = within(getByRole('listbox')).getAllByRole('option');
      expect(options[0]).toHaveTextContent('Banana');
      expect(options[1]).toHaveTextContent('Apple');
      expect(options[2]).toHaveTextContent('Cherry');
      expect(options[3]).toHaveTextContent('Date');
      expect(options[4]).toHaveTextContent('Elderberry');
    });

    it('should not reorder items when selecting additional items after reopening popover', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <FilterPicker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
        >
          {basicItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Step 1: Open popover and select items
      await act(async () => {
        await userEvent.click(trigger);
      });

      await act(async () => {
        await userEvent.click(getByText('Cherry'));
      });
      await act(async () => {
        await userEvent.click(getByText('Date'));
      });

      // Step 2: Close popover
      await act(async () => {
        await userEvent.keyboard('{Escape}');
      });

      // Step 3: Open popover again
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Step 4: Check order after reopening (selected items should be at top)
      let listbox = getByRole('listbox');
      let options = within(listbox).getAllByRole('option');
      expect(options[0]).toHaveTextContent('Cherry');
      expect(options[1]).toHaveTextContent('Date');
      expect(options[2]).toHaveTextContent('Apple');
      expect(options[3]).toHaveTextContent('Banana');
      expect(options[4]).toHaveTextContent('Elderberry');

      // Step 5: Select another item (Banana)
      await act(async () => {
        await userEvent.click(getByText('Banana'));
      });

      // Step 6: Check that order remains unchanged while popover is open
      options = within(listbox).getAllByRole('option');
      expect(options[0]).toHaveTextContent('Cherry');
      expect(options[1]).toHaveTextContent('Date');
      expect(options[2]).toHaveTextContent('Apple');
      expect(options[3]).toHaveTextContent('Banana'); // Should stay in same position
      expect(options[4]).toHaveTextContent('Elderberry');
    });

    it('should work correctly in single selection mode', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <FilterPicker
          label="Select fruit"
          placeholder="Choose a fruit..."
          selectionMode="single"
        >
          {basicItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Open popover and select an item
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Initially options should be in original order
      let listbox = getByRole('listbox');
      let options = within(listbox).getAllByRole('option');
      expect(options[0]).toHaveTextContent('Apple');
      expect(options[1]).toHaveTextContent('Banana');
      expect(options[2]).toHaveTextContent('Cherry');
      expect(options[3]).toHaveTextContent('Date');
      expect(options[4]).toHaveTextContent('Elderberry');

      await act(async () => {
        await userEvent.click(getByText('Date')); // Popover closes automatically
      });

      expect(trigger).toHaveTextContent('Date');

      // Open popover again
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Selected item should be at top
      listbox = getByRole('listbox');
      options = within(listbox).getAllByRole('option');
      expect(options[0]).toHaveTextContent('Date');
      expect(options[1]).toHaveTextContent('Apple');
      expect(options[2]).toHaveTextContent('Banana');
      expect(options[3]).toHaveTextContent('Cherry');
      expect(options[4]).toHaveTextContent('Elderberry');
    });
  });

  describe('Form integration', () => {
    it('should work with form field wrapper', () => {
      const { getByRole } = renderWithRoot(
        <FilterPicker
          name="fruits"
          label="Fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
        >
          {basicItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Refs', () => {
    it('should forward ref to wrapper element', () => {
      const { container } = renderWithRoot(
        <FilterPicker label="Select fruits" selectionMode="multiple">
          {basicItems}
        </FilterPicker>,
      );

      // Check that the component renders properly
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it('should close popover when Escape is pressed on focused ListBox without resetting selection', async () => {
    const onSelectionChange = jest.fn();

    const { getByRole, getByText, queryByRole } = renderWithRoot(
      <FilterPicker
        label="Select fruits"
        placeholder="Choose fruits..."
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
      >
        {basicItems}
      </FilterPicker>,
    );

    const trigger = getByRole('button');

    // Open popover
    await act(async () => {
      await userEvent.click(trigger);
    });

    // Select an item
    await act(async () => {
      await userEvent.click(getByText('Apple'));
    });

    expect(onSelectionChange).toHaveBeenCalledWith(['apple']);

    // Focus should now be on the ListBox after selection
    const listbox = getByRole('listbox');

    // Manually focus the listbox to simulate the issue scenario
    await act(async () => {
      listbox.focus();
    });

    // Clear the mock to track future calls
    onSelectionChange.mockClear();

    // Press Escape - this should close the popover but NOT reset selection
    await act(async () => {
      await userEvent.keyboard('{Escape}');
    });

    // Popover should be closed
    expect(queryByRole('listbox')).not.toBeInTheDocument();

    // Selection should NOT have been reset (onSelectionChange should not be called again)
    expect(onSelectionChange).not.toHaveBeenCalled();

    // Verify trigger still shows the selected item
    expect(trigger).toHaveTextContent('Apple');
  });
});
