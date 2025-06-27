import { createRef } from 'react';

import { Field, ListBox } from '../../../index';
import { act, render, renderWithForm, userEvent, waitFor } from '../../../test';

jest.mock('../../../_internal/hooks/use-warn');

describe('<ListBox />', () => {
  const basicItems = [
    <ListBox.Item key="apple">Apple</ListBox.Item>,
    <ListBox.Item key="banana">Banana</ListBox.Item>,
    <ListBox.Item key="cherry">Cherry</ListBox.Item>,
  ];

  it('should work in uncontrolled mode', async () => {
    const onSelectionChange = jest.fn();

    const { getByRole, getByText } = render(
      <ListBox
        label="Select a fruit"
        defaultSelectedKey="apple"
        onSelectionChange={onSelectionChange}
      >
        {basicItems}
      </ListBox>,
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
      <ListBox
        label="Select a fruit"
        selectedKey="apple"
        onSelectionChange={onSelectionChange}
      >
        {basicItems}
      </ListBox>,
    );

    // Check that Apple is initially selected
    const appleOption = getByText('Apple');
    expect(appleOption.closest('li')).toHaveAttribute('aria-selected', 'true');

    // Click on Banana
    const bananaOption = getByText('Banana');
    await act(async () => {
      await userEvent.click(bananaOption);
    });

    expect(onSelectionChange).toHaveBeenCalledWith('banana');

    // Rerender with new selectedKey to simulate controlled update
    rerender(
      <ListBox
        label="Select a fruit"
        selectedKey="banana"
        onSelectionChange={onSelectionChange}
      >
        {basicItems}
      </ListBox>,
    );

    // Now Banana should be selected
    expect(bananaOption.closest('li')).toHaveAttribute('aria-selected', 'true');
    expect(appleOption.closest('li')).toHaveAttribute('aria-selected', 'false');
  });

  it('should work with legacy <Field /> wrapper', async () => {
    const { getByRole, getByText, formInstance, findByText } = renderWithForm(
      <Field name="fruit">
        <ListBox label="Select a fruit">{basicItems}</ListBox>
      </Field>,
    );

    const listbox = getByRole('listbox');
    expect(listbox).toBeInTheDocument();

    // Select an option
    const appleOption = getByText('Apple');
    await act(async () => {
      await userEvent.click(appleOption);
    });

    await waitFor(() => {
      expect(appleOption.closest('li')).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });
  });

  it('should work with <Form /> integration', async () => {
    const { getByRole, getByText, formInstance } = renderWithForm(
      <ListBox name="fruit" label="Select a fruit">
        {basicItems}
      </ListBox>,
    );

    const listbox = getByRole('listbox');
    expect(listbox).toBeInTheDocument();

    // Select an option
    const bananaOption = getByText('Banana');
    await act(async () => {
      await userEvent.click(bananaOption);
    });

    expect(formInstance.getFieldValue('fruit')).toEqual('banana');
  });

  it('should support multiple selection', async () => {
    const onSelectionChange = jest.fn();

    const { getByText } = render(
      <ListBox
        label="Select fruits"
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
      >
        {basicItems}
      </ListBox>,
    );

    // Select multiple options
    const appleOption = getByText('Apple');
    const bananaOption = getByText('Banana');

    await act(async () => {
      await userEvent.click(appleOption);
    });

    // Check first call - should be array with 'apple'
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    const firstCall = onSelectionChange.mock.calls[0][0];
    expect(Array.isArray(firstCall)).toBe(true);
    expect(firstCall).toEqual(['apple']);

    await act(async () => {
      await userEvent.click(bananaOption);
    });

    // Check second call - should be array with both items
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    const secondCall = onSelectionChange.mock.calls[1][0];
    expect(Array.isArray(secondCall)).toBe(true);
    expect(secondCall.sort()).toEqual(['apple', 'banana']);
  });

  it('should support search functionality', async () => {
    const { getByRole, getByText, queryByText } = render(
      <ListBox isSearchable label="Select a fruit">
        {basicItems}
      </ListBox>,
    );

    const searchInput = getByRole('searchbox');
    expect(searchInput).toBeInTheDocument();

    // Type in search input
    await act(async () => {
      await userEvent.type(searchInput, 'app');
    });

    // Only Apple should be visible
    expect(getByText('Apple')).toBeInTheDocument();
    expect(queryByText('Banana')).not.toBeInTheDocument();
    expect(queryByText('Cherry')).not.toBeInTheDocument();
  });

  it('should handle disabled state', () => {
    const { getByRole } = render(
      <ListBox isDisabled label="Select a fruit">
        {basicItems}
      </ListBox>,
    );

    const listbox = getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-disabled', 'true');
  });

  it('should support sections', () => {
    const { getByText, getByRole } = render(
      <ListBox label="Select an item">
        <ListBox.Section title="Fruits">
          <ListBox.Item key="apple">Apple</ListBox.Item>
          <ListBox.Item key="banana">Banana</ListBox.Item>
        </ListBox.Section>
        <ListBox.Section title="Vegetables">
          <ListBox.Item key="carrot">Carrot</ListBox.Item>
          <ListBox.Item key="broccoli">Broccoli</ListBox.Item>
        </ListBox.Section>
      </ListBox>,
    );

    expect(getByRole('listbox')).toBeInTheDocument();
    expect(getByText('Fruits')).toBeInTheDocument();
    expect(getByText('Vegetables')).toBeInTheDocument();
    expect(getByText('Apple')).toBeInTheDocument();
    expect(getByText('Carrot')).toBeInTheDocument();
  });

  it('should support items with descriptions', () => {
    const { getByText } = render(
      <ListBox label="Select a fruit">
        <ListBox.Item key="apple" description="Red and sweet">
          Apple
        </ListBox.Item>
        <ListBox.Item key="banana" description="Yellow and curved">
          Banana
        </ListBox.Item>
      </ListBox>,
    );

    expect(getByText('Apple')).toBeInTheDocument();
    expect(getByText('Red and sweet')).toBeInTheDocument();
    expect(getByText('Banana')).toBeInTheDocument();
    expect(getByText('Yellow and curved')).toBeInTheDocument();
  });

  it('should correctly assign refs', () => {
    const listRef = createRef<HTMLElement>();
    const searchInputRef = createRef<HTMLInputElement>();

    const { getByRole } = render(
      <ListBox
        isSearchable
        label="Select a fruit"
        listRef={listRef}
        searchInputRef={searchInputRef}
      >
        {basicItems}
      </ListBox>,
    );

    const listbox = getByRole('listbox');
    const searchInput = getByRole('searchbox');

    expect(listRef.current).toBe(listbox);
    expect(searchInputRef.current).toBe(searchInput);
  });

  it('should handle keyboard navigation', async () => {
    const onSelectionChange = jest.fn();

    const { getByRole } = render(
      <ListBox label="Select a fruit" onSelectionChange={onSelectionChange}>
        {basicItems}
      </ListBox>,
    );

    const listbox = getByRole('listbox');

    // Focus the listbox and handle keyboard navigation
    await act(async () => {
      listbox.focus();
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{Enter}');
    });

    // Should select the focused option (first one after arrow down)
    expect(onSelectionChange).toHaveBeenCalled();
  });

  it('should handle validation states', () => {
    const { getByRole, rerender } = render(
      <ListBox label="Select a fruit" validationState="invalid">
        {basicItems}
      </ListBox>,
    );

    const listbox = getByRole('listbox');
    expect(listbox.closest('[data-is-invalid]')).toBeInTheDocument();

    // Test valid state
    rerender(
      <ListBox label="Select a fruit" validationState="valid">
        {basicItems}
      </ListBox>,
    );

    expect(listbox.closest('[data-is-valid]')).toBeInTheDocument();
  });

  it('should handle search loading state', () => {
    const { container } = render(
      <ListBox isSearchable isSearchLoading label="Select a fruit">
        {basicItems}
      </ListBox>,
    );

    // Check that LoadingIcon is rendered instead of SearchIcon
    const loadingIcon = container.querySelector(
      '[data-element="InputIcon"] svg',
    );
    expect(loadingIcon).toBeInTheDocument();
  });

  it('should filter sections when searching', async () => {
    const { getByRole, getByText, queryByText } = render(
      <ListBox isSearchable label="Select an item">
        <ListBox.Section title="Fruits">
          <ListBox.Item key="apple">Apple</ListBox.Item>
          <ListBox.Item key="banana">Banana</ListBox.Item>
        </ListBox.Section>
        <ListBox.Section title="Vegetables">
          <ListBox.Item key="carrot">Carrot</ListBox.Item>
          <ListBox.Item key="broccoli">Broccoli</ListBox.Item>
        </ListBox.Section>
      </ListBox>,
    );

    const searchInput = getByRole('searchbox');

    // Search for "app" - should only show Apple and Fruits section
    await act(async () => {
      await userEvent.type(searchInput, 'app');
    });

    expect(getByText('Fruits')).toBeInTheDocument();
    expect(getByText('Apple')).toBeInTheDocument();
    expect(queryByText('Banana')).not.toBeInTheDocument();
    expect(queryByText('Vegetables')).not.toBeInTheDocument();
    expect(queryByText('Carrot')).not.toBeInTheDocument();
  });

  it('should clear selection when null is passed', async () => {
    const onSelectionChange = jest.fn();

    const { getByText, rerender } = render(
      <ListBox
        label="Select a fruit"
        selectedKey="apple"
        onSelectionChange={onSelectionChange}
      >
        {basicItems}
      </ListBox>,
    );

    // Apple should be selected initially
    const appleOption = getByText('Apple');
    expect(appleOption.closest('li')).toHaveAttribute('aria-selected', 'true');

    // Clear selection
    rerender(
      <ListBox
        label="Select a fruit"
        selectedKey={null}
        onSelectionChange={onSelectionChange}
      >
        {basicItems}
      </ListBox>,
    );

    expect(appleOption.closest('li')).toHaveAttribute('aria-selected', 'false');
  });

  it('should handle empty search results', async () => {
    const { getByRole, queryByText } = render(
      <ListBox isSearchable label="Select a fruit">
        {basicItems}
      </ListBox>,
    );

    const searchInput = getByRole('searchbox');

    // Search for something that doesn't exist
    await act(async () => {
      await userEvent.type(searchInput, 'xyz');
    });

    // No items should be visible
    expect(queryByText('Apple')).not.toBeInTheDocument();
    expect(queryByText('Banana')).not.toBeInTheDocument();
    expect(queryByText('Cherry')).not.toBeInTheDocument();
  });

  it('should work with form integration and onSelectionChange handler together', async () => {
    const onSelectionChangeMock = jest.fn();

    const { getByText, formInstance } = renderWithForm(
      <ListBox
        name="fruit"
        label="Select a fruit"
        onSelectionChange={onSelectionChangeMock}
      >
        {basicItems}
      </ListBox>,
    );

    // Select an option
    const appleOption = getByText('Apple');
    await act(async () => {
      await userEvent.click(appleOption);
    });

    // onSelectionChange handler should be called
    expect(onSelectionChangeMock).toHaveBeenCalledWith('apple');

    // Form should also be updated
    expect(formInstance.getFieldValue('fruit')).toEqual('apple');

    // Select another option
    const bananaOption = getByText('Banana');
    await act(async () => {
      await userEvent.click(bananaOption);
    });

    // onSelectionChange handler should be called again
    expect(onSelectionChangeMock).toHaveBeenCalledWith('banana');

    // Form should be updated
    expect(formInstance.getFieldValue('fruit')).toEqual('banana');
  });

  it('should pre-select option based on defaultSelectedKey', () => {
    const { getByText } = render(
      <ListBox label="Select a fruit" defaultSelectedKey="banana">
        {basicItems}
      </ListBox>,
    );

    const bananaOption = getByText('Banana');
    const appleOption = getByText('Apple');

    // Banana should be aria-selected=true, others false
    expect(bananaOption.closest('li')).toHaveAttribute('aria-selected', 'true');
    expect(appleOption.closest('li')).toHaveAttribute('aria-selected', 'false');
  });
});
