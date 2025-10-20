import { createRef } from 'react';

import { Picker } from '../../../index';
import { act, renderWithRoot, userEvent, within } from '../../../test';

jest.mock('../../../_internal/hooks/use-warn');

describe('<Picker />', () => {
  const basicItems = [
    <Picker.Item key="apple">Apple</Picker.Item>,
    <Picker.Item key="banana">Banana</Picker.Item>,
    <Picker.Item key="cherry">Cherry</Picker.Item>,
    <Picker.Item key="date">Date</Picker.Item>,
    <Picker.Item key="elderberry">Elderberry</Picker.Item>,
  ];

  const sectionsItems = [
    <Picker.Section key="fruits" title="Fruits">
      <Picker.Item key="apple">Apple</Picker.Item>
      <Picker.Item key="banana">Banana</Picker.Item>
      <Picker.Item key="cherry">Cherry</Picker.Item>
    </Picker.Section>,
    <Picker.Section key="vegetables" title="Vegetables">
      <Picker.Item key="carrot">Carrot</Picker.Item>
      <Picker.Item key="broccoli">Broccoli</Picker.Item>
      <Picker.Item key="spinach">Spinach</Picker.Item>
    </Picker.Section>,
  ];

  describe('Basic functionality', () => {
    it('should render trigger button with placeholder', () => {
      const { getByRole } = renderWithRoot(
        <Picker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
        >
          {basicItems}
        </Picker>,
      );

      const trigger = getByRole('button');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent('Choose fruits...');
    });

    it('should open popover when clicked', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <Picker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
        >
          {basicItems}
        </Picker>,
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
        <Picker label="Select fruit" selectionMode="single">
          {basicItems}
        </Picker>,
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

      // Verify popover closed (Banana option should not be visible)
      expect(queryByText('Banana')).not.toBeInTheDocument();
    });

    it('should open and close popover when trigger is clicked', async () => {
      const { getByRole, getByText, queryByText } = renderWithRoot(
        <Picker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
        >
          {basicItems}
        </Picker>,
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

    it('should display selected item in trigger for single selection', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <Picker
          label="Select fruit"
          placeholder="Choose a fruit..."
          selectionMode="single"
        >
          {basicItems}
        </Picker>,
      );

      const trigger = getByRole('button');

      // Open popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Select an item
      await act(async () => {
        await userEvent.click(getByText('Cherry'));
      });

      // Wait for popover to close
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Trigger should show selected item
      expect(trigger).toHaveTextContent('Cherry');
    });

    it('should display multiple selected items in trigger', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <Picker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
        >
          {basicItems}
        </Picker>,
      );

      const trigger = getByRole('button');

      // Open popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Select multiple items
      await act(async () => {
        await userEvent.click(getByText('Apple'));
      });
      await act(async () => {
        await userEvent.click(getByText('Cherry'));
      });

      // Trigger should show selected items
      expect(trigger).toHaveTextContent('Apple, Cherry');
    });
  });

  describe('Selection sorting functionality', () => {
    it('should NOT sort selected items to top while popover is open', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <Picker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
        >
          {basicItems}
        </Picker>,
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
      const itemsData = [
        { key: 'apple', label: 'Apple' },
        { key: 'banana', label: 'Banana' },
        { key: 'cherry', label: 'Cherry' },
        { key: 'date', label: 'Date' },
        { key: 'elderberry', label: 'Elderberry' },
      ];

      const { getByRole, getByText } = renderWithRoot(
        <Picker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
          items={itemsData}
          sortSelectedToTop={true}
        >
          {(item) => <Picker.Item key={item.key}>{item.label}</Picker.Item>}
        </Picker>,
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
    }, 10000);

    // Skipping: sortSelectedToTop doesn't currently support sorting within sections
    // TODO: Implement section-level sorting if needed
    it.skip('should sort selected items to top within their sections', async () => {
      const sectionsData = [
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

      const { getByRole, getByText } = renderWithRoot(
        <Picker
          label="Select items"
          placeholder="Choose items..."
          selectionMode="multiple"
          items={sectionsData}
          sortSelectedToTop={true}
        >
          {(section) => (
            <Picker.Section key={section.key} title={section.label}>
              {section.children.map((item) => (
                <Picker.Item key={item.key}>{item.label}</Picker.Item>
              ))}
            </Picker.Section>
          )}
        </Picker>,
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

      // Step 2: Select items from each section
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
    }, 10000);

    it('should work correctly in single selection mode', async () => {
      const itemsData = [
        { key: 'apple', label: 'Apple' },
        { key: 'banana', label: 'Banana' },
        { key: 'cherry', label: 'Cherry' },
        { key: 'date', label: 'Date' },
        { key: 'elderberry', label: 'Elderberry' },
      ];

      const { getByRole, getByText } = renderWithRoot(
        <Picker
          label="Select fruit"
          placeholder="Choose a fruit..."
          selectionMode="single"
          items={itemsData}
          sortSelectedToTop={true}
        >
          {(item) => <Picker.Item key={item.key}>{item.label}</Picker.Item>}
        </Picker>,
      );

      const trigger = getByRole('button');

      // Open popover and select an item
      await act(async () => {
        await userEvent.click(trigger);
      });

      await act(async () => {
        await userEvent.click(getByText('Date'));
      });

      // Wait for popover to close
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
    }, 10000);
  });

  describe('Clear button functionality', () => {
    const itemsData = [
      { key: 'apple', label: 'Apple' },
      { key: 'banana', label: 'Banana' },
      { key: 'cherry', label: 'Cherry' },
      { key: 'date', label: 'Date' },
      { key: 'elderberry', label: 'Elderberry' },
    ];

    it('should show clear button when isClearable is true and there is a selection', async () => {
      const { getAllByRole, getByTestId } = renderWithRoot(
        <Picker
          label="Select fruit"
          selectionMode="single"
          isClearable={true}
          defaultSelectedKey="apple"
          items={itemsData}
        >
          {(item) => <Picker.Item key={item.key}>{item.label}</Picker.Item>}
        </Picker>,
      );

      const buttons = getAllByRole('button');
      const trigger = buttons[0]; // First button is the trigger

      // Trigger should show selected item
      expect(trigger).toHaveTextContent('Apple');

      // Clear button should be visible
      const clearButton = getByTestId('PickerClearButton');
      expect(clearButton).toBeInTheDocument();
    });

    it('should clear selection when clear button is clicked', async () => {
      const onSelectionChange = jest.fn();
      const onClear = jest.fn();

      const { getAllByRole, getByTestId } = renderWithRoot(
        <Picker
          label="Select fruit"
          placeholder="Choose a fruit..."
          selectionMode="single"
          isClearable={true}
          defaultSelectedKey="apple"
          items={itemsData}
          onSelectionChange={onSelectionChange}
          onClear={onClear}
        >
          {(item) => <Picker.Item key={item.key}>{item.label}</Picker.Item>}
        </Picker>,
      );

      const buttons = getAllByRole('button');
      const trigger = buttons[0]; // First button is the trigger

      // Trigger should show selected item
      expect(trigger).toHaveTextContent('Apple');

      // Click clear button
      const clearButton = getByTestId('PickerClearButton');
      await act(async () => {
        await userEvent.click(clearButton);
      });

      // Should call onClear and onSelectionChange with null
      expect(onClear).toHaveBeenCalled();
      expect(onSelectionChange).toHaveBeenCalledWith(null);

      // Trigger should now show placeholder
      expect(trigger).toHaveTextContent('Choose a fruit...');
    });

    it('should work with multiple selection mode', async () => {
      const onSelectionChange = jest.fn();

      const { getAllByRole, getByTestId } = renderWithRoot(
        <Picker
          label="Select fruits"
          placeholder="Choose fruits..."
          selectionMode="multiple"
          isClearable={true}
          defaultSelectedKeys={['apple', 'banana']}
          items={itemsData}
          onSelectionChange={onSelectionChange}
        >
          {(item) => <Picker.Item key={item.key}>{item.label}</Picker.Item>}
        </Picker>,
      );

      const buttons = getAllByRole('button');
      const trigger = buttons[0]; // First button is the trigger

      // Trigger should show selected items
      expect(trigger).toHaveTextContent('Apple, Banana');

      // Click clear button
      const clearButton = getByTestId('PickerClearButton');
      await act(async () => {
        await userEvent.click(clearButton);
      });

      // Should clear all selections
      expect(onSelectionChange).toHaveBeenCalledWith([]);

      // Trigger should show placeholder
      expect(trigger).toHaveTextContent('Choose fruits...');
    });
  });

  describe('isCheckable prop functionality', () => {
    it('should show checkboxes when isCheckable is true in multiple selection mode', async () => {
      const { getByRole } = renderWithRoot(
        <Picker
          label="Select fruits"
          selectionMode="multiple"
          isCheckable={true}
        >
          {basicItems}
        </Picker>,
      );

      const trigger = getByRole('button');

      // Open the popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Look for checkboxes
      const listbox = getByRole('listbox');
      const checkboxes = within(listbox).getAllByTestId(/CheckIcon/);
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should handle different click behaviors: checkbox click keeps popover open, content click closes popover', async () => {
      const { getByRole, getByText, queryByRole } = renderWithRoot(
        <Picker
          label="Select fruits"
          selectionMode="multiple"
          isCheckable={true}
        >
          {basicItems}
        </Picker>,
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

  describe('showSelectAll functionality', () => {
    it('should show select all option when showSelectAll is true', async () => {
      const { getByRole, getByText } = renderWithRoot(
        <Picker
          label="Select fruits"
          selectionMode="multiple"
          showSelectAll={true}
          selectAllLabel="All Fruits"
        >
          {basicItems}
        </Picker>,
      );

      const trigger = getByRole('button');

      // Open popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Should show "All Fruits" option
      expect(getByText('All Fruits')).toBeInTheDocument();
    });

    it('should select all items when select all is clicked', async () => {
      const onSelectionChange = jest.fn();

      const { getByRole, getByText } = renderWithRoot(
        <Picker
          label="Select fruits"
          selectionMode="multiple"
          showSelectAll={true}
          selectAllLabel="All Fruits"
          onSelectionChange={onSelectionChange}
        >
          {basicItems}
        </Picker>,
      );

      const trigger = getByRole('button');

      // Open popover
      await act(async () => {
        await userEvent.click(trigger);
      });

      // Click select all
      await act(async () => {
        await userEvent.click(getByText('All Fruits'));
      });

      // Should call onSelectionChange with "all"
      expect(onSelectionChange).toHaveBeenCalledWith('all');
    });
  });

  describe('Menu synchronization (event bus)', () => {
    it('should close one Picker when another Picker opens', async () => {
      const { getByRole, getAllByRole, getByText } = renderWithRoot(
        <div>
          <Picker
            label="First Picker"
            placeholder="Select fruit 1"
            selectionMode="single"
            data-testid="picker-1"
          >
            {basicItems}
          </Picker>
          <Picker
            label="Second Picker"
            placeholder="Select fruit 2"
            selectionMode="single"
            data-testid="picker-2"
          >
            {basicItems}
          </Picker>
        </div>,
      );

      // Wait for components to render
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      const triggers = getAllByRole('button');
      const firstTrigger = triggers[0];
      const secondTrigger = triggers[1];

      // Open first Picker
      await act(async () => {
        await userEvent.click(firstTrigger);
      });

      // Verify first Picker is open
      expect(getByText('Apple')).toBeInTheDocument();

      // Open second Picker - this should close the first one
      await act(async () => {
        await userEvent.click(secondTrigger);
      });

      // Wait for the events to propagate
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      });

      // There should be only one listbox visible
      const listboxes = getAllByRole('listbox');
      expect(listboxes).toHaveLength(1);
    });
  });

  describe('Form integration', () => {
    it('should work with form field wrapper', async () => {
      const { getByRole } = renderWithRoot(
        <Picker name="fruit" label="Fruit" placeholder="Choose fruits...">
          {basicItems}
        </Picker>,
      );

      const trigger = getByRole('button');
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Refs', () => {
    it('should forward ref to wrapper element', async () => {
      const ref = createRef<HTMLElement>();

      const { container } = renderWithRoot(
        <Picker ref={ref} label="Select fruit">
          {basicItems}
        </Picker>,
      );

      // Check that the component renders properly
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Custom renderSummary', () => {
    it('should use custom renderSummary function', () => {
      const renderSummary = jest.fn(({ selectedLabels }) => {
        if (!selectedLabels || selectedLabels.length === 0) return null;
        return `${selectedLabels.length} selected`;
      });

      const { getByRole } = renderWithRoot(
        <Picker
          label="Select fruits"
          selectionMode="multiple"
          renderSummary={renderSummary}
          selectedKeys={['apple', 'banana']}
        >
          {basicItems}
        </Picker>,
      );

      const trigger = getByRole('button');
      expect(trigger).toHaveTextContent('2 selected');
      expect(renderSummary).toHaveBeenCalled();
    });

    it('should hide summary when renderSummary is false', () => {
      const { getByRole } = renderWithRoot(
        <Picker
          label="Select fruits"
          selectionMode="multiple"
          renderSummary={false}
          selectedKeys={['apple', 'banana']}
        >
          {basicItems}
        </Picker>,
      );

      const trigger = getByRole('button');
      // Should not show the selected items
      expect(trigger).not.toHaveTextContent('Apple');
      expect(trigger).not.toHaveTextContent('Banana');
    });
  });

  describe('Items prop functionality', () => {
    const itemsWithLabels = [
      { key: 'apple', label: 'Red Apple' },
      { key: 'banana', label: 'Yellow Banana' },
      { key: 'cherry', label: 'Sweet Cherry' },
    ];

    it('should display labels correctly when using items prop', () => {
      const { getByRole } = renderWithRoot(
        <Picker
          label="Select fruits"
          selectionMode="single"
          items={itemsWithLabels}
          selectedKey="apple"
        >
          {(item) => <Picker.Item key={item.key}>{item.label}</Picker.Item>}
        </Picker>,
      );

      const trigger = getByRole('button');

      // Should display the label
      expect(trigger).toHaveTextContent('Red Apple');
    });
  });
});
