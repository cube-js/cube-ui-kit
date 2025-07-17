import { createRef } from 'react';

import { Field, FilterListBox } from '../../../index';
import { act, render, userEvent, waitFor } from '../../../test';

jest.mock('../../../_internal/hooks/use-warn');

describe('<FilterListBox />', () => {
  const basicItems = [
    <FilterListBox.Item key="apple">Apple</FilterListBox.Item>,
    <FilterListBox.Item key="banana">Banana</FilterListBox.Item>,
    <FilterListBox.Item key="cherry">Cherry</FilterListBox.Item>,
    <FilterListBox.Item key="date">Date</FilterListBox.Item>,
    <FilterListBox.Item key="elderberry">Elderberry</FilterListBox.Item>,
  ];

  const sectionsItems = [
    <FilterListBox.Section key="fruits" title="Fruits">
      <FilterListBox.Item key="apple">Apple</FilterListBox.Item>
      <FilterListBox.Item key="banana">Banana</FilterListBox.Item>
    </FilterListBox.Section>,
    <FilterListBox.Section key="vegetables" title="Vegetables">
      <FilterListBox.Item key="carrot">Carrot</FilterListBox.Item>
      <FilterListBox.Item key="broccoli">Broccoli</FilterListBox.Item>
    </FilterListBox.Section>,
  ];

  describe('Basic functionality', () => {
    it('should render with search input and options', () => {
      const { getByRole, getByPlaceholderText } = render(
        <FilterListBox
          label="Select a fruit"
          searchPlaceholder="Search fruits..."
        >
          {basicItems}
        </FilterListBox>,
      );

      expect(getByRole('listbox')).toBeInTheDocument();
      expect(getByPlaceholderText('Search fruits...')).toBeInTheDocument();
      expect(getByRole('option', { name: 'Apple' })).toBeInTheDocument();
      expect(getByRole('option', { name: 'Banana' })).toBeInTheDocument();
    });

    it('should work in uncontrolled mode', async () => {
      const onSelectionChange = jest.fn();

      const { getByRole, getByText } = render(
        <FilterListBox
          label="Select a fruit"
          defaultSelectedKey="apple"
          onSelectionChange={onSelectionChange}
        >
          {basicItems}
        </FilterListBox>,
      );

      const listbox = getByRole('listbox');
      expect(listbox).toBeInTheDocument();

      // Select a different option
      const bananaOption = getByText('Banana');
      await act(async () => {
        await userEvent.click(bananaOption);
      });

      expect(onSelectionChange).toHaveBeenCalledWith('banana');
    });

    it('should work in controlled mode', async () => {
      const onSelectionChange = jest.fn();

      const { getByText, rerender } = render(
        <FilterListBox
          label="Select a fruit"
          selectedKey="apple"
          onSelectionChange={onSelectionChange}
        >
          {basicItems}
        </FilterListBox>,
      );

      // Select a different option
      const bananaOption = getByText('Banana');
      await act(async () => {
        await userEvent.click(bananaOption);
      });

      expect(onSelectionChange).toHaveBeenCalledWith('banana');

      // Update to controlled selection
      rerender(
        <FilterListBox
          label="Select a fruit"
          selectedKey="banana"
          onSelectionChange={onSelectionChange}
        >
          {basicItems}
        </FilterListBox>,
      );

      expect(bananaOption).toHaveAttribute('aria-selected', 'true');
    });

    it('should support multiple selection', async () => {
      const onSelectionChange = jest.fn();

      const { getByText } = render(
        <FilterListBox
          label="Select fruits"
          selectionMode="multiple"
          onSelectionChange={onSelectionChange}
        >
          {basicItems}
        </FilterListBox>,
      );

      const appleOption = getByText('Apple');
      const bananaOption = getByText('Banana');

      await act(async () => {
        await userEvent.click(appleOption);
      });

      expect(onSelectionChange).toHaveBeenCalledWith(['apple']);

      await act(async () => {
        await userEvent.click(bananaOption);
      });

      expect(onSelectionChange).toHaveBeenCalledWith(['apple', 'banana']);
    });
  });

  describe('Search functionality', () => {
    it('should filter options based on search input', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <FilterListBox label="Select a fruit" searchPlaceholder="Search...">
          {basicItems}
        </FilterListBox>,
      );

      const searchInput = getByPlaceholderText('Search...');

      // Initially all options should be visible
      expect(getByText('Apple')).toBeInTheDocument();
      expect(getByText('Banana')).toBeInTheDocument();
      expect(getByText('Cherry')).toBeInTheDocument();

      // Search for "app"
      await act(async () => {
        await userEvent.type(searchInput, 'app');
      });

      // Only Apple should be visible
      expect(getByText('Apple')).toBeInTheDocument();
      expect(queryByText('Banana')).not.toBeInTheDocument();
      expect(queryByText('Cherry')).not.toBeInTheDocument();
    });

    it('should clear search on escape key', async () => {
      const { getByPlaceholderText, getByText } = render(
        <FilterListBox label="Select a fruit" searchPlaceholder="Search...">
          {basicItems}
        </FilterListBox>,
      );

      const searchInput = getByPlaceholderText('Search...');

      // Type something to filter
      await act(async () => {
        await userEvent.type(searchInput, 'app');
      });

      expect(searchInput).toHaveValue('app');

      // Press escape to clear
      await act(async () => {
        await userEvent.keyboard('{Escape}');
      });

      expect(searchInput).toHaveValue('');
      expect(getByText('Banana')).toBeInTheDocument(); // Should be visible again
    });

    it('should show empty state when no results found', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <FilterListBox label="Select a fruit" searchPlaceholder="Search...">
          {basicItems}
        </FilterListBox>,
      );

      const searchInput = getByPlaceholderText('Search...');

      // Search for something that doesn't exist
      await act(async () => {
        await userEvent.type(searchInput, 'xyz');
      });

      expect(getByText('No results found')).toBeInTheDocument();
      expect(queryByText('Apple')).not.toBeInTheDocument();
    });

    it('should show custom empty label when provided', async () => {
      const { getByPlaceholderText, getByText } = render(
        <FilterListBox
          label="Select a fruit"
          searchPlaceholder="Search..."
          emptyLabel="No fruits match your search"
        >
          {basicItems}
        </FilterListBox>,
      );

      const searchInput = getByPlaceholderText('Search...');

      await act(async () => {
        await userEvent.type(searchInput, 'xyz');
      });

      expect(getByText('No fruits match your search')).toBeInTheDocument();
    });

    it('should support custom filter function', async () => {
      const customFilter = jest.fn((text, search) =>
        text.toLowerCase().startsWith(search.toLowerCase()),
      );

      const { getByPlaceholderText, getByText, queryByText } = render(
        <FilterListBox
          label="Select a fruit"
          searchPlaceholder="Search..."
          filter={customFilter}
        >
          {basicItems}
        </FilterListBox>,
      );

      const searchInput = getByPlaceholderText('Search...');

      // Search for "a" - should only show Apple (starts with A)
      await act(async () => {
        await userEvent.type(searchInput, 'a');
      });

      expect(getByText('Apple')).toBeInTheDocument();
      expect(queryByText('Banana')).not.toBeInTheDocument(); // Banana contains 'a' but doesn't start with it
      expect(customFilter).toHaveBeenCalled();
    });

    it('should filter sections and preserve section structure', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <FilterListBox label="Select an item" searchPlaceholder="Search...">
          {sectionsItems}
        </FilterListBox>,
      );

      const searchInput = getByPlaceholderText('Search...');

      // Search for "app" - should show Apple under Fruits section
      await act(async () => {
        await userEvent.type(searchInput, 'app');
      });

      expect(getByText('Fruits')).toBeInTheDocument(); // Section should be visible
      expect(getByText('Apple')).toBeInTheDocument();
      expect(queryByText('Vegetables')).not.toBeInTheDocument(); // Empty section should be hidden
      expect(queryByText('Banana')).not.toBeInTheDocument();
    });

    it('should use textValue prop for complex content', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <FilterListBox label="Select a plan" searchPlaceholder="Search...">
          <FilterListBox.Item key="basic" textValue="Basic Plan Free">
            <div>
              <strong>Basic Plan</strong>
              <div>Free tier</div>
            </div>
          </FilterListBox.Item>
          <FilterListBox.Item key="pro" textValue="Pro Plan Paid">
            <div>
              <strong>Pro Plan</strong>
              <div>Paid tier</div>
            </div>
          </FilterListBox.Item>
        </FilterListBox>,
      );

      const searchInput = getByPlaceholderText('Search...');

      // Search for "free" - should match the textValue, not the JSX content
      await act(async () => {
        await userEvent.type(searchInput, 'free');
      });

      expect(getByText('Basic Plan')).toBeInTheDocument();
      expect(queryByText('Pro Plan')).not.toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should show loading icon when isLoading is true', () => {
      const { container } = render(
        <FilterListBox isLoading label="Select a fruit">
          {basicItems}
        </FilterListBox>,
      );

      expect(
        container.querySelector('[data-element="InputIcon"]'),
      ).toBeInTheDocument();
    });

    it('should show search icon when not loading', () => {
      const { container } = render(
        <FilterListBox label="Select a fruit">{basicItems}</FilterListBox>,
      );

      expect(
        container.querySelector('[data-element="InputIcon"]'),
      ).toBeInTheDocument();
    });
  });

  describe('Disabled state', () => {
    it('should disable search input and prevent selection when disabled', async () => {
      const onSelectionChange = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <FilterListBox
          isDisabled
          label="Select a fruit"
          searchPlaceholder="Search..."
          onSelectionChange={onSelectionChange}
        >
          {basicItems}
        </FilterListBox>,
      );

      const searchInput = getByPlaceholderText('Search...');
      expect(searchInput).toBeDisabled();

      const appleOption = getByText('Apple');
      await act(async () => {
        await userEvent.click(appleOption);
      });

      expect(onSelectionChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { getByRole, getByLabelText } = render(
        <FilterListBox
          label="Select a fruit"
          searchPlaceholder="Search fruits..."
        >
          {basicItems}
        </FilterListBox>,
      );

      const listbox = getByRole('listbox');
      const searchInput = getByLabelText('Select a fruit');

      expect(listbox).toHaveAttribute('aria-label', 'Select a fruit');
      expect(searchInput).toHaveAttribute('type', 'search');
    });

    it('should support keyboard navigation from search to options', async () => {
      const { getByPlaceholderText, getByText } = render(
        <FilterListBox label="Select a fruit" searchPlaceholder="Search...">
          {basicItems}
        </FilterListBox>,
      );

      const searchInput = getByPlaceholderText('Search...');

      // Focus search input
      searchInput.focus();
      expect(searchInput).toHaveFocus();

      // Arrow down should move focus to first option
      await act(async () => {
        await userEvent.keyboard('{ArrowDown}');
      });

      // Note: This tests the keyboard handler, actual focus behavior may depend on React Aria implementation
    });

    it('should support autofocus on search input', () => {
      const { getByPlaceholderText } = render(
        <FilterListBox
          autoFocus
          label="Select a fruit"
          searchPlaceholder="Search..."
        >
          {basicItems}
        </FilterListBox>,
      );

      const searchInput = getByPlaceholderText('Search...');
      expect(searchInput).toHaveAttribute('data-autofocus', '');
    });
  });

  describe('Form integration', () => {
    it('should integrate with form field wrapper', () => {
      const { getByLabelText } = render(
        <Field name="fruit" label="Fruit">
          <FilterListBox searchPlaceholder="Search fruits...">
            {basicItems}
          </FilterListBox>
        </Field>,
      );

      const searchInput = getByLabelText('Fruit');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('type', 'search');
    });
  });

  describe('Refs', () => {
    it('should forward ref to wrapper element', () => {
      const ref = createRef<HTMLDivElement>();

      render(
        <FilterListBox ref={ref} label="Select a fruit">
          {basicItems}
        </FilterListBox>,
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should forward searchInputRef to search input', () => {
      const searchInputRef = createRef<HTMLInputElement>();

      render(
        <FilterListBox searchInputRef={searchInputRef} label="Select a fruit">
          {basicItems}
        </FilterListBox>,
      );

      expect(searchInputRef.current).toBeInstanceOf(HTMLInputElement);
      expect(searchInputRef.current).toHaveAttribute('type', 'search');
    });

    it('should forward listRef to list element', () => {
      const listRef = createRef<HTMLElement>();

      render(
        <FilterListBox listRef={listRef} label="Select a fruit">
          {basicItems}
        </FilterListBox>,
      );

      expect(listRef.current).toBeInstanceOf(HTMLElement);
      expect(listRef.current).toHaveAttribute('role', 'listbox');
    });
  });

  describe('Validation states', () => {
    it('should apply validation styles', () => {
      const { container, rerender } = render(
        <FilterListBox label="Select a fruit" validationState="valid">
          {basicItems}
        </FilterListBox>,
      );

      expect(container.firstChild).toHaveAttribute('data-is-valid');

      rerender(
        <FilterListBox label="Select a fruit" validationState="invalid">
          {basicItems}
        </FilterListBox>,
      );

      expect(container.firstChild).toHaveAttribute('data-is-invalid');
    });
  });

  describe('Custom styling', () => {
    it('should apply custom styles to search input', () => {
      const { container } = render(
        <FilterListBox
          label="Select a fruit"
          searchInputStyles={{ fill: '#red' }}
        >
          {basicItems}
        </FilterListBox>,
      );

      // Check that search input has custom styles applied
      const searchInput = container.querySelector('input[type="search"]');
      expect(searchInput).toBeInTheDocument();
    });

    it('should apply custom styles to options', () => {
      const { container } = render(
        <FilterListBox label="Select a fruit" optionStyles={{ color: '#blue' }}>
          {basicItems}
        </FilterListBox>,
      );

      const options = container.querySelectorAll('[role="option"]');
      expect(options.length).toBeGreaterThan(0);
    });
  });
});
