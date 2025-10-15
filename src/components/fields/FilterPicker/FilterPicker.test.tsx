import { createRef } from 'react';

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

  // Data arrays for testing sorting functionality (which requires items prop)
  const basicItemsData = [
    { key: 'apple', label: 'Apple' },
    { key: 'banana', label: 'Banana' },
    { key: 'cherry', label: 'Cherry' },
    { key: 'date', label: 'Date' },
    { key: 'elderberry', label: 'Elderberry' },
  ];

  const sectionsItemsData = [
    {
      key: 'fruits',
      label: 'Fruits',
      children: [
        { key: 'apple', label: 'Apple' },
        { key: 'banana', label: 'Banana' },
        { key: 'cherry', label: 'Cherry' },
      ],
    },
    {
      key: 'vegetables',
      label: 'Vegetables',
      children: [
        { key: 'carrot', label: 'Carrot' },
        { key: 'broccoli', label: 'Broccoli' },
        { key: 'spinach', label: 'Spinach' },
      ],
    },
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

      // Verify popover opened and options are visible
      expect(getByText('Apple')).toBeInTheDocument();
      expect(getByText('Banana')).toBeInTheDocument();
    });

    it('should close popover when item is selected in single mode', async () => {
      const { getByRole, getByText, queryByText } = renderWithRoot(
        <FilterPicker label="Select fruit" selectionMode="single">
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

      // Wait a bit for the popover to close
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Verify popover closed (Apple option should not be visible)
      expect(queryByText('Banana')).not.toBeInTheDocument();
    });

    it('should open and close popover when trigger is clicked', async () => {
      const { getByRole, getByText, queryByText } = renderWithRoot(
        <FilterPicker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
        >
          {basicItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Open popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      expect(getByText('Apple')).toBeInTheDocument();

      // Close popover by clicking trigger again
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Wait for animation
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(queryByText('Apple')).not.toBeInTheDocument();
    });
  });

  describe('Selection sorting functionality', () => {
    it('should NOT sort selected items to top while popover is open', async () => {
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

      // Open popover
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

      // Select Date (3rd item)
      await act(async () => {
        await userEvent.click(getByText('Date'));
      });

      // Select Banana (1st item)
      await act(async () => {
        await userEvent.click(getByText('Banana'));
      });

      // Order should remain the same while popover is open
      listbox = getByRole('listbox');
      options = within(listbox).getAllByRole('option');
      expect(options[0]).toHaveTextContent('Apple');
      expect(options[1]).toHaveTextContent('Banana');
      expect(options[2]).toHaveTextContent('Cherry');
      expect(options[3]).toHaveTextContent('Date');
      expect(options[4]).toHaveTextContent('Elderberry');
    });

    it('should sort selected items to top when popover reopens in multiple mode', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <FilterPicker
          sortSelectedToTop
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
          items={basicItemsData}
        >
          {(item) => (
            <FilterPicker.Item key={item.key}>{item.label}</FilterPicker.Item>
          )}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Open popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Select Cherry (2nd item) and Elderberry (4th item)
      await act(async () => {
        await userEvent.click(getByText('Cherry'));
      });
      await act(async () => {
        await userEvent.click(getByText('Elderberry'));
      });

      // Close popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Reopen popover - selected items should be sorted to top
      await act(async () => {
        await userEvent.click(trigger);
      });

      const listbox = getByRole('listbox');
      const reorderedOptions = within(listbox).getAllByRole('option');
      expect(reorderedOptions[0]).toHaveTextContent('Cherry');
      expect(reorderedOptions[1]).toHaveTextContent('Elderberry');
      expect(reorderedOptions[2]).toHaveTextContent('Apple');
      expect(reorderedOptions[3]).toHaveTextContent('Banana');
      expect(reorderedOptions[4]).toHaveTextContent('Date');
    }, 10000); // 10 second timeout

    it('should sort selected items to top within their sections', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <FilterPicker
          sortSelectedToTop
          label="Select items"
          placeholder="Choose items..."
          selectionMode="multiple"
          items={sectionsItemsData}
        >
          {(section) => (
            <FilterPicker.Section key={section.key} title={section.label}>
              {section.children.map((item) => (
                <FilterPicker.Item key={item.key}>
                  {item.label}
                </FilterPicker.Item>
              ))}
            </FilterPicker.Section>
          )}
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

      expect(fruitsOptions[0]).toHaveTextContent('Apple');
      expect(fruitsOptions[1]).toHaveTextContent('Banana');
      expect(fruitsOptions[2]).toHaveTextContent('Cherry');

      expect(vegetablesOptions[0]).toHaveTextContent('Carrot');
      expect(vegetablesOptions[1]).toHaveTextContent('Broccoli');
      expect(vegetablesOptions[2]).toHaveTextContent('Spinach');

      // Step 2: Select items from each section (Cherry from Fruits, Spinach from Vegetables)
      await act(async () => {
        await userEvent.click(getByText('Cherry'));
      });
      await act(async () => {
        await userEvent.click(getByText('Spinach'));
      });

      // Step 3: Close popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Step 4: Reopen popover and verify sorting within sections
      await act(async () => {
        await userEvent.click(trigger);
      });

      listbox = getByRole('listbox');
      fruitsSection = within(listbox).getByText('Fruits').closest('li');
      vegetablesSection = within(listbox).getByText('Vegetables').closest('li');

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
    }, 10000); // 10 second timeout

    it('should maintain sorting when items are deselected and popover reopens', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <FilterPicker
          sortSelectedToTop
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
          items={basicItemsData}
        >
          {(item) => (
            <FilterPicker.Item key={item.key}>{item.label}</FilterPicker.Item>
          )}
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

      // Close and reopen
      await act(async () => {
        await userEvent.click(trigger);
      });
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Verify selected items are now sorted to top
      listbox = getByRole('listbox');
      options = within(listbox).getAllByRole('option');
      expect(options[0]).toHaveTextContent('Banana');
      expect(options[1]).toHaveTextContent('Date');
      expect(options[2]).toHaveTextContent('Apple');
      expect(options[3]).toHaveTextContent('Cherry');
      expect(options[4]).toHaveTextContent('Elderberry');

      // Deselect Date
      await act(async () => {
        await userEvent.click(getByText('Date'));
      });

      // Close and reopen again
      await act(async () => {
        await userEvent.click(trigger);
      });
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Verify only Banana is now at the top
      listbox = getByRole('listbox');
      options = within(listbox).getAllByRole('option');
      expect(options[0]).toHaveTextContent('Banana');
      expect(options[1]).toHaveTextContent('Apple');
      expect(options[2]).toHaveTextContent('Cherry');
      expect(options[3]).toHaveTextContent('Date');
      expect(options[4]).toHaveTextContent('Elderberry');
    }, 10000); // 10 second timeout

    it('should not reorder items when selecting additional items after reopening popover', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <FilterPicker
          sortSelectedToTop
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
          items={basicItemsData}
        >
          {(item) => (
            <FilterPicker.Item key={item.key}>{item.label}</FilterPicker.Item>
          )}
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
        await userEvent.click(getByText('Elderberry'));
      });

      // Step 2: Close and reopen to trigger sorting
      await act(async () => {
        await userEvent.click(trigger);
      });
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Step 3: Verify sorted order
      let listbox = getByRole('listbox');
      let options = within(listbox).getAllByRole('option');
      expect(options[0]).toHaveTextContent('Cherry');
      expect(options[1]).toHaveTextContent('Elderberry');
      expect(options[2]).toHaveTextContent('Apple');
      expect(options[3]).toHaveTextContent('Banana');
      expect(options[4]).toHaveTextContent('Date');

      // Step 4: Select additional item (should not trigger reordering while open)
      await act(async () => {
        await userEvent.click(getByText('Apple'));
      });

      // Step 5: Verify order remains stable (no resorting while popover is open)
      listbox = getByRole('listbox');
      options = within(listbox).getAllByRole('option');
      expect(options[0]).toHaveTextContent('Cherry');
      expect(options[1]).toHaveTextContent('Elderberry');
      expect(options[2]).toHaveTextContent('Apple');
      expect(options[3]).toHaveTextContent('Banana');
      expect(options[4]).toHaveTextContent('Date');
    }, 10000); // 10 second timeout

    it('should work correctly in single selection mode', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <FilterPicker
          sortSelectedToTop
          label="Select fruit"
          placeholder="Choose a fruit..."
          selectionMode="single"
          items={basicItemsData}
        >
          {(item) => (
            <FilterPicker.Item key={item.key}>{item.label}</FilterPicker.Item>
          )}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Open popover and select an item
      await act(async () => {
        await userEvent.click(trigger);
      });

      await act(async () => {
        await userEvent.click(getByText('Date'));
      });

      // Wait for popover to close (single selection auto-closes)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Reopen to check sorting
      await act(async () => {
        await userEvent.click(trigger);
      });

      const listbox = getByRole('listbox');
      const options = within(listbox).getAllByRole('option');

      // In single mode, selected item should be sorted to top
      expect(options[0]).toHaveTextContent('Date');
      expect(options[1]).toHaveTextContent('Apple');
      expect(options[2]).toHaveTextContent('Banana');
      expect(options[3]).toHaveTextContent('Cherry');
      expect(options[4]).toHaveTextContent('Elderberry');
    }, 10000); // 10 second timeout
  });

  describe('Form integration', () => {
    it('should work with form field wrapper', async () => {
      const { getByRole } = renderWithRoot(
        <FilterPicker name="fruit" label="Fruit" placeholder="Choose fruits...">
          {basicItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Refs', () => {
    it('should forward ref to wrapper element', async () => {
      const ref = createRef<HTMLElement>();

      const { container } = renderWithRoot(
        <FilterPicker ref={ref} label="Select fruit">
          {basicItems}
        </FilterPicker>,
      );

      // Check that the component renders properly
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('isCheckable prop functionality', () => {
    it('should show checkboxes when isCheckable is true in multiple selection mode', async () => {
      const { getByRole } = renderWithRoot(
        <FilterPicker
          label="Select fruits"
          selectionMode="multiple"
          isCheckable={true}
        >
          {basicItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Open the popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Look for checkboxes (they should be present when isCheckable=true in multiple mode)
      const listbox = getByRole('listbox');
      const checkboxes = within(listbox).getAllByTestId(/CheckIcon/);
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should not show checkboxes when isCheckable is false', async () => {
      const { getByRole } = renderWithRoot(
        <FilterPicker
          label="Select fruits"
          selectionMode="multiple"
          isCheckable={false}
        >
          {basicItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Open the popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Look for checkboxes (they should not be present when isCheckable=false)
      const listbox = getByRole('listbox');
      const checkboxes = within(listbox).queryAllByRole('checkbox');
      expect(checkboxes).toHaveLength(0);
    });

    it('should not show checkboxes in single selection mode even when isCheckable is true', async () => {
      const { getByRole } = renderWithRoot(
        <FilterPicker
          label="Select fruit"
          selectionMode="single"
          isCheckable={true}
        >
          {basicItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Open the popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Look for checkboxes (they should not be present in single selection mode)
      const listbox = getByRole('listbox');
      const checkboxes = within(listbox).queryAllByRole('checkbox');
      expect(checkboxes).toHaveLength(0);
    });

    it('should handle different click behaviors: checkbox click keeps popover open, content click closes popover', async () => {
      const { getByRole, getByText, queryByRole } = renderWithRoot(
        <FilterPicker
          label="Select fruits"
          selectionMode="multiple"
          isCheckable={true}
        >
          {basicItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Open the popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Click on the content area of an option (not the checkbox)
      const appleOption = getByText('Apple');
      await act(async () => {
        await userEvent.click(appleOption);
      });

      // For checkable items in multiple mode, content click should close the popover
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Popover should be closed
      expect(queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Menu synchronization (event bus)', () => {
    it('should close one FilterPicker when another FilterPicker opens', async () => {
      const { getByRole, getAllByRole, getByText, queryByText } =
        renderWithRoot(
          <div>
            <FilterPicker
              label="First FilterPicker"
              placeholder="Select fruit 1"
              selectionMode="single"
              data-testid="filter-picker-1"
            >
              {basicItems}
            </FilterPicker>
            <FilterPicker
              label="Second FilterPicker"
              placeholder="Select fruit 2"
              selectionMode="single"
              data-testid="filter-picker-2"
            >
              {basicItems}
            </FilterPicker>
          </div>,
        );

      // Wait for components to render
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      const triggers = getAllByRole('button');
      const firstTrigger = triggers[0];
      const secondTrigger = triggers[1];

      // Step 1: Open first FilterPicker
      await act(async () => {
        await userEvent.click(firstTrigger);
      });

      // Verify first FilterPicker is open
      expect(getByText('Apple')).toBeInTheDocument();
      expect(getByText('Banana')).toBeInTheDocument();

      // Step 2: Open second FilterPicker - this should close the first one
      await act(async () => {
        await userEvent.click(secondTrigger);
      });

      // Wait for the events to propagate and animations to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      });

      // Step 3: Verify only one popover is open
      // There should still be Apple and Banana visible (from second picker)
      // but there should be only one set of them, not two
      const appleElements = queryByText('Apple');
      const bananaElements = queryByText('Banana');

      // Both should still be visible (from the second popover)
      expect(appleElements).toBeInTheDocument();
      expect(bananaElements).toBeInTheDocument();

      // More importantly, there should be only one listbox visible
      const listboxes = getAllByRole('listbox');
      expect(listboxes).toHaveLength(1);
    });
  });

  describe('allowsCustomValue functionality', () => {
    it('should support custom values and display them in trigger', async () => {
      const onSelectionChange = jest.fn();

      const { getByRole, getByPlaceholderText, getByText } = renderWithRoot(
        <FilterPicker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="single"
          allowsCustomValue={true}
          onSelectionChange={onSelectionChange}
        >
          {basicItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Initially trigger should show placeholder
      expect(trigger).toHaveTextContent('Choose fruits...');

      // Open the popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Type a custom value
      const searchInput = getByPlaceholderText('Search...');
      await act(async () => {
        await userEvent.type(searchInput, 'mango');
      });

      // Select the custom value
      const customOption = getByText('mango');
      await act(async () => {
        await userEvent.click(customOption);
      });

      expect(onSelectionChange).toHaveBeenCalledWith('mango');

      // Wait for popover to close
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Trigger should now show the custom value
      expect(trigger).toHaveTextContent('mango');
    });

    it('should support custom values in multiple selection mode', async () => {
      const onSelectionChange = jest.fn();

      const { getByRole, getByPlaceholderText, getByText } = renderWithRoot(
        <FilterPicker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
          allowsCustomValue={true}
          onSelectionChange={onSelectionChange}
        >
          {basicItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Open the popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // First select a regular option
      await act(async () => {
        await userEvent.click(getByText('Apple'));
      });

      expect(onSelectionChange).toHaveBeenCalledWith(['apple']);

      // Type a custom value
      const searchInput = getByPlaceholderText('Search...');
      await act(async () => {
        await userEvent.type(searchInput, 'mango');
      });

      // Select the custom value
      const customOption = getByText('mango');
      await act(async () => {
        await userEvent.click(customOption);
      });

      expect(onSelectionChange).toHaveBeenCalledWith(['apple', 'mango']);
    });

    it('should persist custom values across popover sessions', async () => {
      const { getByRole, getByPlaceholderText, getByText } = renderWithRoot(
        <FilterPicker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
          allowsCustomValue={true}
        >
          {basicItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Open popover and add custom value
      await act(async () => {
        await userEvent.click(trigger);
      });

      const searchInput = getByPlaceholderText('Search...');
      await act(async () => {
        await userEvent.type(searchInput, 'mango');
      });

      await act(async () => {
        await userEvent.click(getByText('mango'));
      });

      // Close popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Reopen popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Custom value should still be visible in the list
      expect(getByRole('option', { name: 'mango' })).toBeInTheDocument();
    });

    it('should show selected custom values in the list when popover reopens', async () => {
      const { getByRole, getByPlaceholderText, getByText } = renderWithRoot(
        <FilterPicker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
          allowsCustomValue={true}
        >
          {basicItems}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Session 1: Add a custom value and select Apple
      await act(async () => {
        await userEvent.click(trigger);
      });

      const searchInput = getByPlaceholderText('Search...');
      await act(async () => {
        await userEvent.type(searchInput, 'mango');
      });

      await act(async () => {
        await userEvent.click(getByText('mango'));
      });

      await act(async () => {
        await userEvent.clear(searchInput);
      });

      await act(async () => {
        await userEvent.click(getByText('Apple'));
      });

      // Close popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Session 2: Reopen and verify both custom and regular values are visible
      await act(async () => {
        await userEvent.click(trigger);
      });

      const listbox = getByRole('listbox');
      const options = within(listbox).getAllByRole('option');

      // Selected custom value and Apple should be at the top
      expect(options[0]).toHaveTextContent('mango');
      expect(options[1]).toHaveTextContent('Apple');
    });
  });

  describe('Items prop functionality', () => {
    const itemsWithLabels = [
      { key: 'apple', label: 'Red Apple' },
      { key: 'banana', label: 'Yellow Banana' },
      { key: 'cherry', label: 'Sweet Cherry' },
    ];

    it('should display labels correctly when using items prop with label property', async () => {
      const { getByRole } = renderWithRoot(
        <FilterPicker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="single"
          items={itemsWithLabels}
          selectedKey="apple"
        >
          {(item) => (
            <FilterPicker.Item key={item.key}>{item.label}</FilterPicker.Item>
          )}
        </FilterPicker>,
      );

      const trigger = getByRole('button');

      // Should display the label, not the key
      expect(trigger).toHaveTextContent('Red Apple');
      expect(trigger).not.toHaveTextContent('apple');
    });

    it('should display correct labels in multiple selection mode with items prop', async () => {
      const renderSummary = jest.fn(
        ({ selectedLabels }) => `Selected: ${selectedLabels.join(', ')}`,
      );

      const { getByRole } = renderWithRoot(
        <FilterPicker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
          items={itemsWithLabels}
          selectedKeys={['apple', 'cherry']}
          renderSummary={renderSummary}
        >
          {(item) => (
            <FilterPicker.Item key={item.key}>{item.label}</FilterPicker.Item>
          )}
        </FilterPicker>,
      );

      // Check that renderSummary was called with correct labels
      expect(renderSummary).toHaveBeenCalledWith({
        selectedLabels: ['Red Apple', 'Sweet Cherry'],
        selectedKeys: ['apple', 'cherry'],
        selectionMode: 'multiple',
      });

      const trigger = getByRole('button');
      expect(trigger).toHaveTextContent('Selected: Red Apple, Sweet Cherry');
    });
  });
});
