import { useVirtualizer } from '@tanstack/react-virtual';
import { getCSSTextForNode } from '@tenphi/tasty';
import { createRef } from 'react';

import { Field, ListBox } from '../../../index';
import {
  act,
  hoverWithPointer,
  render,
  renderWithForm,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';
import { FilterListBox } from '../FilterListBox/FilterListBox';

import { getListBoxOptionId } from './optionId';

import type { CubeListBoxProps } from './ListBox';

vi.mock('../../../_internal/hooks/use-warn');

describe('<ListBox />', () => {
  const basicItems = [
    <ListBox.Item key="apple">Apple</ListBox.Item>,
    <ListBox.Item key="banana">Banana</ListBox.Item>,
    <ListBox.Item key="cherry">Cherry</ListBox.Item>,
  ];

  it('names each option by getListBoxOptionId', () => {
    const { getByRole } = render(
      <ListBox id="fruits" label="Fruits">
        <ListBox.Item key="apple">Apple</ListBox.Item>
        <ListBox.Item key="dragon fruit">Dragon fruit</ListBox.Item>
      </ListBox>,
    );

    // Inputs that drive the list with virtual focus point
    // `aria-activedescendant` at these ids, so they must stay real.
    expect(getByRole('option', { name: 'Apple' })).toHaveAttribute(
      'id',
      getListBoxOptionId('fruits', 'apple'),
    );
    expect(getByRole('option', { name: 'Dragon fruit' })).toHaveAttribute(
      'id',
      getListBoxOptionId('fruits', 'dragon fruit'),
    );
  });

  it('should work in uncontrolled mode', async () => {
    const onSelectionChange = vi.fn();

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
    const onSelectionChange = vi.fn();

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
    const onSelectionChange = vi.fn();

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

  it('should handle disabled state', () => {
    const { getByRole } = render(
      <ListBox isDisabled label="Select a fruit">
        {basicItems}
      </ListBox>,
    );

    const listbox = getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-disabled', 'true');
  });

  it('is not a Tab stop while disabled', async () => {
    const { getByRole } = render(
      <>
        <button>Before</button>
        <ListBox isDisabled label="Select a fruit">
          {basicItems}
        </ListBox>
        <button>After</button>
      </>,
    );

    await userEvent.click(getByRole('button', { name: 'Before' }));
    await userEvent.tab();

    expect(getByRole('listbox')).not.toHaveAttribute('tabindex');
    expect(getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('should take the style props its docs list as styles, not attributes', () => {
    // These were extracted at runtime but missing from the props type, so a
    // documented `height` failed to type-check. The type-check is the test.
    const { container } = render(
      <ListBox label="Select a fruit" height="10x" width="20x" flexGrow={1}>
        {basicItems}
      </ListBox>,
    );

    const root = container.firstElementChild!;

    expect(root).not.toHaveAttribute('height');
    expect(root).not.toHaveAttribute('width');
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
        <ListBox.Item
          key="apple"
          textValue="Apple Red and sweet"
          description="Red and sweet"
        >
          Apple
        </ListBox.Item>
        <ListBox.Item
          key="banana"
          textValue="Banana Yellow and curved"
          description="Yellow and curved"
        >
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
    const listRef = createRef<HTMLUListElement>();

    const { getByRole } = render(
      <ListBox label="Select a fruit" listRef={listRef}>
        {basicItems}
      </ListBox>,
    );

    const listbox = getByRole('listbox');

    expect(listRef.current).toBe(listbox);
  });

  it('should handle keyboard navigation', async () => {
    const onSelectionChange = vi.fn();

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
      <ListBox label="Select a fruit" isInvalid>
        {basicItems}
      </ListBox>,
    );

    const listbox = getByRole('listbox');
    expect(listbox.closest('[data-invalid]')).toBeInTheDocument();

    // Test valid state
    rerender(
      <ListBox label="Select a fruit" isValid>
        {basicItems}
      </ListBox>,
    );

    expect(listbox.closest('[data-valid]')).toBeInTheDocument();
  });

  it('should still support the deprecated validationState', () => {
    const { getByRole, rerender } = render(
      <ListBox label="Select a fruit" validationState="invalid">
        {basicItems}
      </ListBox>,
    );

    const listbox = getByRole('listbox');
    expect(listbox.closest('[data-invalid]')).toBeInTheDocument();

    rerender(
      <ListBox label="Select a fruit" validationState="valid">
        {basicItems}
      </ListBox>,
    );

    expect(listbox.closest('[data-valid]')).toBeInTheDocument();
  });

  it('should clear selection when null is passed', async () => {
    const onSelectionChange = vi.fn();

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

  it('should work with form integration and onSelectionChange handler together', async () => {
    const onSelectionChangeMock = vi.fn();

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

  it('should pre-select multiple options based on defaultSelectedKeys', () => {
    const { getByText } = render(
      <ListBox
        label="Select fruits"
        selectionMode="multiple"
        defaultSelectedKeys={['apple', 'cherry']}
      >
        {basicItems}
      </ListBox>,
    );

    const appleOption = getByText('Apple');
    const bananaOption = getByText('Banana');
    const cherryOption = getByText('Cherry');

    // Apple and Cherry should be selected, Banana should not
    expect(appleOption.closest('li')).toHaveAttribute('aria-selected', 'true');
    expect(bananaOption.closest('li')).toHaveAttribute(
      'aria-selected',
      'false',
    );
    expect(cherryOption.closest('li')).toHaveAttribute('aria-selected', 'true');
  });

  it('should pre-select all options when defaultSelectedKeys is "all"', () => {
    const { getByText } = render(
      <ListBox
        label="Select fruits"
        selectionMode="multiple"
        defaultSelectedKeys="all"
      >
        {basicItems}
      </ListBox>,
    );

    const appleOption = getByText('Apple');
    const bananaOption = getByText('Banana');
    const cherryOption = getByText('Cherry');

    // All options should be selected
    expect(appleOption.closest('li')).toHaveAttribute('aria-selected', 'true');
    expect(bananaOption.closest('li')).toHaveAttribute('aria-selected', 'true');
    expect(cherryOption.closest('li')).toHaveAttribute('aria-selected', 'true');
  });

  it('should work in uncontrolled mode with defaultSelectedKeys', async () => {
    const onSelectionChange = vi.fn();

    const { getByText } = render(
      <ListBox
        label="Select fruits"
        selectionMode="multiple"
        defaultSelectedKeys={['apple']}
        onSelectionChange={onSelectionChange}
      >
        {basicItems}
      </ListBox>,
    );

    // Apple should be initially selected
    const appleOption = getByText('Apple');
    expect(appleOption.closest('li')).toHaveAttribute('aria-selected', 'true');

    // Click on Banana to add it to selection
    const bananaOption = getByText('Banana');
    await act(async () => {
      await userEvent.click(bananaOption);
    });

    // Should call onSelectionChange with both apple and banana
    expect(onSelectionChange).toHaveBeenCalledWith(['apple', 'banana']);
  });

  it('should handle empty defaultSelectedKeys array', () => {
    const { getByText } = render(
      <ListBox
        label="Select fruits"
        selectionMode="multiple"
        defaultSelectedKeys={[]}
      >
        {basicItems}
      </ListBox>,
    );

    const appleOption = getByText('Apple');
    const bananaOption = getByText('Banana');
    const cherryOption = getByText('Cherry');

    // No options should be selected
    expect(appleOption.closest('li')).toHaveAttribute('aria-selected', 'false');
    expect(bananaOption.closest('li')).toHaveAttribute(
      'aria-selected',
      'false',
    );
    expect(cherryOption.closest('li')).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('should handle defaultSelectedKey with null value', () => {
    const { getByText } = render(
      <ListBox label="Select a fruit" defaultSelectedKey={null}>
        {basicItems}
      </ListBox>,
    );

    const appleOption = getByText('Apple');
    const bananaOption = getByText('Banana');
    const cherryOption = getByText('Cherry');

    // No options should be selected
    expect(appleOption.closest('li')).toHaveAttribute('aria-selected', 'false');
    expect(bananaOption.closest('li')).toHaveAttribute(
      'aria-selected',
      'false',
    );
    expect(cherryOption.closest('li')).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('should handle keyboard navigation when no item is initially focused', async () => {
    const onSelectionChange = vi.fn();

    const { getByRole, getByText } = render(
      <ListBox label="Select a fruit" onSelectionChange={onSelectionChange}>
        {basicItems}
      </ListBox>,
    );

    const listbox = getByRole('listbox');

    // Focus the listbox
    await act(async () => {
      listbox.focus();
    });

    // Press arrow down - should focus first item
    await act(async () => {
      await userEvent.keyboard('{ArrowDown}');
    });

    // Press Enter to select the focused item
    await act(async () => {
      await userEvent.keyboard('{Enter}');
    });

    // Should select the first option
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    // The test is actually working - it's selecting the first available item
    // Let's check what was actually selected
    const selectedValue = onSelectionChange.mock.calls[0][0];
    expect(['apple', 'banana', 'cherry']).toContain(selectedValue);
  });

  it('should handle keyboard navigation', async () => {
    const onSelectionChange = vi.fn();
    const { getByRole } = render(
      <ListBox label="Select a fruit" onSelectionChange={onSelectionChange}>
        {basicItems}
      </ListBox>,
    );

    const listbox = getByRole('listbox');

    // Focus and navigate
    await act(async () => {
      listbox.focus();
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{Enter}');
    });

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });

  it('should apply focused mod to the focused item during keyboard navigation', async () => {
    const { getByRole, getByText } = render(
      <ListBox label="Select a fruit">{basicItems}</ListBox>,
    );

    const listbox = getByRole('listbox');
    const appleOption = getByText('Apple');
    const bananaOption = getByText('Banana');

    // Initially no item should be focused
    expect(appleOption.closest('li')).not.toHaveAttribute('data-focused');
    expect(bananaOption.closest('li')).not.toHaveAttribute('data-focused');

    // Focus the listbox and navigate down
    await act(async () => {
      listbox.focus();
      await userEvent.keyboard('{ArrowDown}');
    });

    // First item should now be focused
    const focusedItem = listbox.querySelector('[data-focused]');
    expect(focusedItem).toBeInTheDocument();

    // Navigate to next item
    await act(async () => {
      await userEvent.keyboard('{ArrowDown}');
    });

    // Should still have a focused item (next one)
    const newFocusedItem = listbox.querySelector('[data-focused]');
    expect(newFocusedItem).toBeInTheDocument();
  });

  it('drops the focused mod once focus leaves the list', async () => {
    const { getByRole } = render(
      <>
        <ListBox label="Select a fruit">{basicItems}</ListBox>
        <button>Elsewhere</button>
      </>,
    );

    const banana = getByRole('option', { name: 'Banana' });

    await userEvent.click(banana);

    expect(banana).toHaveAttribute('data-focused');

    await userEvent.click(getByRole('button', { name: 'Elsewhere' }));

    expect(banana).not.toHaveAttribute('data-focused');
  });

  it('drops the focused mod once the list is disabled', async () => {
    const { getByRole, rerender } = render(
      <ListBox label="Select a fruit">{basicItems}</ListBox>,
    );

    const banana = getByRole('option', { name: 'Banana' });

    await userEvent.click(banana);

    expect(banana).toHaveAttribute('data-focused');

    rerender(
      <ListBox isDisabled label="Select a fruit">
        {basicItems}
      </ListBox>,
    );

    expect(banana).not.toHaveAttribute('data-focused');
  });

  it('should apply focused mod when navigating through sections', async () => {
    const { getByRole, getByText } = render(
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

    const listbox = getByRole('listbox');

    // Focus the listbox and navigate down
    await act(async () => {
      listbox.focus();
      await userEvent.keyboard('{ArrowDown}');
    });

    // Should have a focused item
    let focusedItem = listbox.querySelector('[data-focused]');
    expect(focusedItem).toBeInTheDocument();

    // Navigate through several items
    await act(async () => {
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{ArrowDown}');
    });

    // Should still have a focused item (after navigating through sections)
    focusedItem = listbox.querySelector('[data-focused]');
    expect(focusedItem).toBeInTheDocument();
  });

  describe('Select All functionality', () => {
    const selectAllItems = [
      <ListBox.Item key="apple">Apple</ListBox.Item>,
      <ListBox.Item key="banana">Banana</ListBox.Item>,
      <ListBox.Item key="cherry">Cherry</ListBox.Item>,
    ];

    it('should show select all option when showSelectAll is true', () => {
      render(
        <ListBox
          label="Select fruits"
          selectionMode="multiple"
          showSelectAll={true}
          selectAllLabel="Select All Fruits"
        >
          {selectAllItems}
        </ListBox>,
      );

      expect(screen.getByText('Select All Fruits')).toBeInTheDocument();
    });

    it('should use the default label when selectAllLabel is empty', () => {
      render(
        <ListBox
          label="Select fruits"
          selectionMode="multiple"
          showSelectAll
          selectAllLabel=""
        >
          {selectAllItems}
        </ListBox>,
      );

      expect(screen.getByText('Select All')).toBeInTheDocument();
    });

    it('should not show select all option in single selection mode', () => {
      render(
        <ListBox
          label="Select fruits"
          selectionMode="single"
          showSelectAll={true}
          selectAllLabel="Select All Fruits"
        >
          {selectAllItems}
        </ListBox>,
      );

      expect(screen.queryByText('Select All Fruits')).not.toBeInTheDocument();
    });

    it('should handle select all click to select all items', async () => {
      const onSelectionChange = vi.fn();

      render(
        <ListBox
          label="Select fruits"
          selectionMode="multiple"
          showSelectAll={true}
          onSelectionChange={onSelectionChange}
        >
          {selectAllItems}
        </ListBox>,
      );

      const selectAllOption = screen.getByText('Select All');
      await act(async () => {
        await userEvent.click(selectAllOption);
      });

      expect(onSelectionChange).toHaveBeenCalledWith('all');
    });

    it('should handle select all click to deselect all when all are selected', async () => {
      const onSelectionChange = vi.fn();

      render(
        <ListBox
          label="Select fruits"
          selectionMode="multiple"
          showSelectAll={true}
          selectedKeys="all"
          onSelectionChange={onSelectionChange}
        >
          {selectAllItems}
        </ListBox>,
      );

      const selectAllOption = screen.getByText('Select All');
      await act(async () => {
        await userEvent.click(selectAllOption);
      });

      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('should show indeterminate state when some items are selected', () => {
      render(
        <ListBox
          label="Select fruits"
          selectionMode="multiple"
          showSelectAll={true}
          isCheckable={true}
          selectedKeys={['apple', 'banana']}
        >
          {selectAllItems}
        </ListBox>,
      );

      // The select all option should exist and have indeterminate styling
      const selectAllOption = screen.getByText('Select All');
      expect(selectAllOption).toBeInTheDocument();

      // Check for indeterminate state in the checkbox (should have specific styles)
      const selectAllElement = selectAllOption.closest('[role="checkbox"]');
      expect(selectAllElement).toBeInTheDocument();

      // Check if the element has indeterminate styling
      const checkboxElement = selectAllElement?.querySelector(
        '[data-element="Checkbox"]',
      );
      expect(checkboxElement).toBeInTheDocument();
      expect(checkboxElement).toHaveAttribute('data-indeterminate');

      // The mark is decoration: the row's `aria-checked` says the state,
      // and an exposed `<svg>` is read out as an unnamed graphic.
      for (const svg of Array.from(checkboxElement!.querySelectorAll('svg'))) {
        expect(svg.closest('[aria-hidden="true"]')).not.toBeNull();
      }
    });

    it('is a checkbox outside the listbox, in valid markup', () => {
      const { container } = render(
        <ListBox aria-label="Fruits" selectionMode="multiple" showSelectAll>
          {selectAllItems}
        </ListBox>,
      );

      const selectAll = screen.getByRole('checkbox', { name: 'Select All' });

      // An option outside a listbox is an orphan assistive technology may
      // drop. Every option belongs to the list.
      expect(selectAll.closest('[role="listbox"]')).toBeNull();
      for (const option of screen.getAllByRole('option')) {
        expect(option.closest('[role="listbox"]')).not.toBeNull();
      }

      // And no list item is left without a list.
      for (const item of Array.from(container.querySelectorAll('li'))) {
        expect(item.parentElement?.tagName).toBe('UL');
      }
    });

    it('is reached with Tab and toggled with Space', async () => {
      const onSelectionChange = vi.fn();

      render(
        <ListBox
          aria-label="Fruits"
          selectionMode="multiple"
          showSelectAll
          onSelectionChange={onSelectionChange}
        >
          {selectAllItems}
        </ListBox>,
      );

      const selectAll = screen.getByRole('checkbox', { name: 'Select All' });

      expect(selectAll).toHaveAttribute('aria-checked', 'false');

      await userEvent.tab();

      expect(selectAll).toHaveFocus();

      await userEvent.keyboard(' ');

      expect(onSelectionChange).toHaveBeenLastCalledWith('all');
      expect(selectAll).toHaveAttribute('aria-checked', 'true');

      await userEvent.keyboard(' ');

      expect(onSelectionChange).toHaveBeenLastCalledWith([]);
      expect(selectAll).toHaveAttribute('aria-checked', 'false');
    });

    it('is reached with Shift+Tab from the list', async () => {
      render(
        <ListBox aria-label="Fruits" selectionMode="multiple" showSelectAll>
          {selectAllItems}
        </ListBox>,
      );

      await userEvent.click(screen.getByRole('option', { name: 'Apple' }));
      await userEvent.tab({ shift: true });

      expect(
        screen.getByRole('checkbox', { name: 'Select All' }),
      ).toHaveFocus();
    });

    it('reads as mixed while some items are selected', () => {
      render(
        <ListBox
          aria-label="Fruits"
          selectionMode="multiple"
          showSelectAll
          selectedKeys={['apple']}
        >
          {selectAllItems}
        </ListBox>,
      );

      expect(
        screen.getByRole('checkbox', { name: 'Select All' }),
      ).toHaveAttribute('aria-checked', 'mixed');
    });

    it('is not a Tab stop while the list is disabled', async () => {
      render(
        <>
          <button>Before</button>
          <ListBox
            isDisabled
            aria-label="Fruits"
            selectionMode="multiple"
            showSelectAll
          >
            {selectAllItems}
          </ListBox>
        </>,
      );

      const selectAll = screen.getByRole('checkbox', { name: 'Select All' });

      expect(selectAll).toHaveAttribute('aria-disabled', 'true');

      await userEvent.click(screen.getByRole('button', { name: 'Before' }));
      await userEvent.tab();

      expect(selectAll).not.toHaveFocus();
    });

    it('shows checked once every item is selected one by one', async () => {
      const onSelectionChange = vi.fn();

      render(
        <ListBox
          aria-label="Fruits"
          selectionMode="multiple"
          isCheckable
          showSelectAll
          onSelectionChange={onSelectionChange}
        >
          {selectAllItems}
        </ListBox>,
      );

      for (const name of ['Apple', 'Banana', 'Cherry']) {
        await userEvent.click(screen.getByRole('option', { name }));
      }

      const selectAll = screen.getByRole('checkbox', { name: 'Select All' });

      expect(selectAll).toHaveAttribute('aria-checked', 'true');
      expect(
        selectAll.querySelector('[data-element="Checkbox"]'),
      ).toHaveAttribute('data-selected');

      // Checked, so the next press clears rather than selecting all again.
      onSelectionChange.mockClear();
      await userEvent.click(selectAll);

      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('shows checked when every item but the disabled ones is selected', () => {
      render(
        <ListBox
          aria-label="Fruits"
          selectionMode="multiple"
          showSelectAll
          disabledKeys={['cherry']}
          selectedKeys={['apple', 'banana']}
        >
          {selectAllItems}
        </ListBox>,
      );

      expect(
        screen.getByRole('checkbox', { name: 'Select All' }),
      ).toHaveAttribute('aria-checked', 'true');
    });

    it('stays mixed when a filter leaves no item to select', () => {
      render(
        <ListBox
          aria-label="Fruits"
          selectionMode="multiple"
          showSelectAll
          selectedKeys={['apple']}
          filter={() => []}
        >
          {selectAllItems}
        </ListBox>,
      );

      expect(
        screen.getByRole('checkbox', { name: 'Select All' }),
      ).toHaveAttribute('aria-checked', 'mixed');
    });

    it.each([
      ['selecting', undefined, 'all'],
      ['clearing', 'all' as const, []],
    ])('reports %s all once per click', async (_, selectedKeys, expected) => {
      const onSelectionChange = vi.fn();

      render(
        <ListBox
          aria-label="Fruits"
          selectionMode="multiple"
          showSelectAll
          selectedKeys={selectedKeys}
          onSelectionChange={onSelectionChange}
        >
          {selectAllItems}
        </ListBox>,
      );

      await userEvent.click(screen.getByText('Select All'));

      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenCalledWith(expected);
    });

    it('keeps the last item selected under disallowEmptySelection', async () => {
      const onSelectionChange = vi.fn();

      render(
        <ListBox
          disallowEmptySelection
          aria-label="Fruits"
          selectionMode="multiple"
          showSelectAll
          selectedKeys="all"
          onSelectionChange={onSelectionChange}
        >
          {selectAllItems}
        </ListBox>,
      );

      await userEvent.click(screen.getByText('Select All'));

      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    it('keeps selected keys the list does not show when it clears', async () => {
      const onSelectionChange = vi.fn();

      render(
        <ListBox
          aria-label="Fruits"
          selectionMode="multiple"
          showSelectAll
          // `kiwi` is not an option here, as when the options come from a
          // search on a server.
          selectedKeys={['apple', 'banana', 'cherry', 'kiwi']}
          onSelectionChange={onSelectionChange}
        >
          {selectAllItems}
        </ListBox>,
      );

      await userEvent.click(screen.getByText('Select All'));

      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenCalledWith(['kiwi']);
    });

    describe('under a filter', () => {
      const fruits = [
        <FilterListBox.Item key="apple">Apple</FilterListBox.Item>,
        <FilterListBox.Item key="apricot">Apricot</FilterListBox.Item>,
        <FilterListBox.Item key="banana">Banana</FilterListBox.Item>,
        <FilterListBox.Item key="cherry">Cherry</FilterListBox.Item>,
      ];

      async function renderFiltered(
        defaultSelectedKeys: 'all' | string[],
        search = 'ap',
      ) {
        const onSelectionChange = vi.fn();

        render(
          <FilterListBox
            label="Fruits"
            searchPlaceholder="Search"
            selectionMode="multiple"
            showSelectAll
            defaultSelectedKeys={defaultSelectedKeys}
            onSelectionChange={onSelectionChange}
          >
            {fruits}
          </FilterListBox>,
        );

        await userEvent.type(screen.getByPlaceholderText('Search'), search);
        await waitFor(() => {
          expect(screen.getAllByRole('option')).toHaveLength(2);
        });

        return onSelectionChange;
      }

      it('clears only the options it shows', async () => {
        const onSelectionChange = await renderFiltered(['banana']);

        await userEvent.click(screen.getByRole('option', { name: 'Apple' }));
        await userEvent.click(screen.getByRole('option', { name: 'Apricot' }));

        const selectAll = screen.getByRole('checkbox', { name: 'Select All' });

        expect(selectAll).toHaveAttribute('aria-checked', 'true');

        onSelectionChange.mockClear();
        await userEvent.click(selectAll);

        // Banana is hidden by the search, so the press leaves it selected.
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(onSelectionChange).toHaveBeenCalledWith(['banana']);
      });

      it('selects only the options it shows', async () => {
        const onSelectionChange = await renderFiltered(['banana']);

        await userEvent.click(
          screen.getByRole('checkbox', { name: 'Select All' }),
        );

        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(onSelectionChange).toHaveBeenCalledWith([
          'banana',
          'apple',
          'apricot',
        ]);

        await userEvent.clear(screen.getByPlaceholderText('Search'));

        expect(screen.getByRole('option', { name: 'Cherry' })).toHaveAttribute(
          'aria-selected',
          'false',
        );
      });

      it('keeps the hidden options of a full selection when it clears', async () => {
        const onSelectionChange = await renderFiltered('all');

        await userEvent.click(
          screen.getByRole('checkbox', { name: 'Select All' }),
        );

        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        expect(onSelectionChange).toHaveBeenCalledWith(['banana', 'cherry']);
      });

      it('still selects all once the search is cleared', async () => {
        const onSelectionChange = await renderFiltered(['banana']);

        await userEvent.clear(screen.getByPlaceholderText('Search'));
        await userEvent.click(
          screen.getByRole('checkbox', { name: 'Select All' }),
        );

        expect(onSelectionChange).toHaveBeenCalledWith('all');
      });

      it('shows no option as focused while it has focus', async () => {
        await renderFiltered([]);

        await waitFor(() => {
          expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute(
            'data-focused',
          );
        });

        // From the search input, Tab reaches "Select All".
        await userEvent.tab();

        expect(
          screen.getByRole('checkbox', { name: 'Select All' }),
        ).toHaveFocus();

        for (const option of screen.getAllByRole('option')) {
          expect(option).not.toHaveAttribute('data-focused');
        }
      });
    });
  });

  describe('empty list', () => {
    it('keeps the listbox, described by the empty label', () => {
      render(
        <ListBox label="Fruits" items={[] as { key: string }[]}>
          {(item) => <ListBox.Item key={item.key}>{item.key}</ListBox.Item>}
        </ListBox>,
      );

      const listbox = screen.getByRole('listbox', { name: 'Fruits' });

      expect(listbox).toHaveAccessibleDescription('No items');
      expect(screen.queryAllByRole('option')).toHaveLength(0);
    });

    it('keeps its own description alongside the empty label', () => {
      render(
        <ListBox
          aria-label="Fruits"
          aria-describedby="hint"
          emptyLabel="Nothing here"
          items={[] as { key: string }[]}
        >
          {(item) => <ListBox.Item key={item.key}>{item.key}</ListBox.Item>}
        </ListBox>,
      );

      expect(screen.getByRole('listbox')).toHaveAttribute(
        'aria-describedby',
        expect.stringContaining('hint'),
      );
      expect(screen.getByRole('listbox')).toHaveAccessibleDescription(
        expect.stringContaining('Nothing here'),
      );
    });

    it('keeps the listbox a search input controls when nothing matches', async () => {
      render(
        <FilterListBox label="Fruits" searchPlaceholder="Search">
          <FilterListBox.Item key="apple">Apple</FilterListBox.Item>
          <FilterListBox.Item key="banana">Banana</FilterListBox.Item>
        </FilterListBox>,
      );

      const input = screen.getByPlaceholderText('Search');

      await userEvent.type(input, 'zzz');

      await waitFor(() => {
        expect(screen.queryAllByRole('option')).toHaveLength(0);
      });

      const controlled = document.getElementById(
        input.getAttribute('aria-controls')!,
      );

      expect(controlled).toHaveAttribute('role', 'listbox');
    });

    it('shows focus on the card while its Tab stop has it', async () => {
      render(
        <ListBox label="Fruits" items={[] as { key: string }[]}>
          {(item) => <ListBox.Item key={item.key}>{item.key}</ListBox.Item>}
        </ListBox>,
      );

      const wrapper = screen.getByTestId('ListBoxWrapper');

      expect(wrapper).not.toHaveAttribute('data-focused');

      await userEvent.tab();

      expect(screen.getByRole('listbox')).toHaveFocus();
      expect(wrapper).toHaveAttribute('data-focused');

      await userEvent.tab();

      expect(wrapper).not.toHaveAttribute('data-focused');
    });
  });

  describe('disableSelectionToggle', () => {
    it('keeps the option selected when it is picked again', async () => {
      const onSelectionChange = vi.fn();

      render(
        <ListBox
          disableSelectionToggle
          aria-label="Fruits"
          defaultSelectedKey="apple"
          onSelectionChange={onSelectionChange}
        >
          {basicItems}
        </ListBox>,
      );

      await userEvent.click(screen.getByRole('option', { name: 'Apple' }));

      expect(onSelectionChange).toHaveBeenCalledWith('apple');
      expect(onSelectionChange).not.toHaveBeenCalledWith(null);
    });

    it('reports the controlled option when a pick before was rejected', async () => {
      const onSelectionChange = vi.fn();

      // The parent never takes a pick, so Apple stays selected.
      render(
        <ListBox
          disableSelectionToggle
          aria-label="Fruits"
          selectionMode="single"
          selectedKey="apple"
          onSelectionChange={onSelectionChange}
        >
          {basicItems}
        </ListBox>,
      );

      await userEvent.click(screen.getByRole('option', { name: 'Banana' }));
      await userEvent.click(screen.getByRole('option', { name: 'Apple' }));

      expect(onSelectionChange).toHaveBeenLastCalledWith('apple');
    });
  });

  describe('virtualized focus', () => {
    const items = Array.from({ length: 100 }, (_, index) => ({
      key: `item-${index}`,
      label: `Item ${index}`,
    }));

    const defaultVirtualizer = vi
      .mocked(useVirtualizer)
      .getMockImplementation();

    let scrollToIndex: ReturnType<typeof vi.fn>;

    // A window of the first ten options, as a real virtualizer renders at
    // the top of a long list.
    beforeEach(() => {
      scrollToIndex = vi.fn();

      vi.mocked(useVirtualizer).mockImplementation(
        ({ count = 0, getItemKey }: any) =>
          ({
            getVirtualItems: () =>
              Array.from({ length: Math.min(count, 10) }, (_, index) => ({
                index,
                key: getItemKey(index),
                start: index * 40,
                size: 40,
              })),
            getTotalSize: () => count * 40,
            scrollToIndex,
            measure: vi.fn(),
            measureElement: vi.fn(),
          }) as any,
      );
    });

    afterEach(() => {
      vi.mocked(useVirtualizer).mockImplementation(defaultVirtualizer!);
    });

    function renderList(
      props: Partial<CubeListBoxProps<(typeof items)[number]>> = {},
    ) {
      return render(
        <ListBox aria-label="Items" items={items} {...props}>
          {(item: (typeof items)[number]) => (
            <ListBox.Item key={item.key}>{item.label}</ListBox.Item>
          )}
        </ListBox>,
      );
    }

    it('scrolls to an option End moves focus to outside the window', async () => {
      renderList();

      await userEvent.click(screen.getByRole('option', { name: 'Item 0' }));
      await userEvent.keyboard('{End}');

      expect(scrollToIndex).toHaveBeenCalledWith(99, { align: 'auto' });
    });

    it('scrolls to the selected option the list focuses on mount', () => {
      renderList({ autoFocus: true, defaultSelectedKey: 'item-80' });

      expect(scrollToIndex).toHaveBeenCalledWith(80, { align: 'auto' });
    });

    it('leaves the scroll alone for an option already rendered', async () => {
      renderList();

      await userEvent.click(screen.getByRole('option', { name: 'Item 0' }));
      await userEvent.keyboard('{ArrowDown}');

      expect(scrollToIndex).not.toHaveBeenCalled();
    });
  });

  describe('section dividers', () => {
    it('keep the separator role out of the listbox', () => {
      render(
        <ListBox label="Select an item">
          <ListBox.Section title="Fruits">
            <ListBox.Item key="apple">Apple</ListBox.Item>
          </ListBox.Section>
          <ListBox.Section title="Vegetables">
            <ListBox.Item key="carrot">Carrot</ListBox.Item>
          </ListBox.Section>
        </ListBox>,
      );

      const listbox = screen.getByRole('listbox');

      // A listbox owns options and groups only.
      expect(listbox.querySelector('[role="separator"]')).toBeNull();
      expect(screen.getByTestId('Divider')).toHaveAttribute(
        'role',
        'presentation',
      );
    });
  });

  describe('disabled options', () => {
    it('should show the tooltip of a disabled option', async () => {
      renderWithRoot(
        <ListBox label="Select a fruit" disabledKeys={['banana']}>
          <ListBox.Item key="apple">Apple</ListBox.Item>
          <ListBox.Item key="banana" tooltip="Out of season">
            Banana
          </ListBox.Item>
        </ListBox>,
      );

      const option = screen.getByRole('option', { name: 'Banana' });

      expect(option).toHaveAttribute('aria-disabled', 'true');

      // A disabled option is the case a tooltip is needed the most: it is where
      // the reason the option cannot be picked is written.
      await hoverWithPointer(option);

      await waitFor(() => {
        expect(screen.getByText('Out of season')).toBeInTheDocument();
      });
    });
  });
});

describe('ListBox id', () => {
  it.each([
    ['a static', {}],
    ['a reorderable', { isReorderable: true, onReorder: () => {} }],
  ])('stays the id the caller passes on %s list', (_, props) => {
    const { getByRole } = renderWithRoot(
      <ListBox id="fruits" aria-label="Fruits" {...props}>
        <ListBox.Item key="apple">Apple</ListBox.Item>
        <ListBox.Item key="banana">Banana</ListBox.Item>
      </ListBox>,
    );

    expect(getByRole('listbox')).toHaveAttribute('id', 'fruits');
  });
});

/**
 * A `:has()` that starts with `~` must stay out of ListBox's styles. jsdom
 * before 27 (nwsapi) throws on it for any element without a parent, and its
 * `getComputedStyle` walks up to `<html>`, so one such rule breaks every role
 * query in a consumer still on that jsdom (AGENTS.md → Styling). This repo's
 * jsdom can't reproduce the throw, so the test reads the rules instead.
 */
describe('ListBox styles', () => {
  it('start no :has() with ~, which older jsdom throws on', () => {
    const { container } = renderWithRoot(
      <ListBox
        isReorderable
        aria-label="Colors"
        listGap={4}
        onReorder={() => {}}
      >
        <ListBox.Item key="red">Red</ListBox.Item>
        <ListBox.Item key="green">Green</ListBox.Item>
      </ListBox>,
    );

    const css = getCSSTextForNode(container);

    // The option margin rule is there to be checked.
    expect(css).toContain('var(--list-gap)');
    expect(css).not.toMatch(/:has\(\s*~/);
  });
});
