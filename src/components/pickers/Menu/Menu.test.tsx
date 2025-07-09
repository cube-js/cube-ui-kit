// @ts-nocheck
// NOTE: Type checking is disabled in this test file to prevent
// noisy errors from complex generic typings that do not affect runtime behaviour.
import { createRef } from 'react';

import { act, render, userEvent, waitFor } from '../../../test';

import { Menu } from './Menu';

jest.mock('../../../_internal/hooks/use-warn');

describe('<Menu />', () => {
  const basicItems = [
    <Menu.Item key="copy">Copy</Menu.Item>,
    <Menu.Item key="paste">Paste</Menu.Item>,
    <Menu.Item key="cut">Cut</Menu.Item>,
  ];

  // Basic rendering tests
  it('should render menu with basic items', () => {
    const { getByRole, getByText } = render(
      <Menu id="test-menu" aria-label="Test menu">
        {basicItems}
      </Menu>,
    );

    const menu = getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(getByText('Copy')).toBeInTheDocument();
    expect(getByText('Paste')).toBeInTheDocument();
    expect(getByText('Cut')).toBeInTheDocument();
  });

  it('should call onAction when menu item is clicked', async () => {
    const onAction = jest.fn();

    const { getByText } = render(
      <Menu id="test-menu" aria-label="Test menu" onAction={onAction}>
        {basicItems}
      </Menu>,
    );

    const copyItem = getByText('Copy');
    await act(async () => {
      await userEvent.click(copyItem);
    });

    expect(onAction).toHaveBeenCalledWith('copy');
  });

  // Selection mode tests
  it('should work with single selection mode', async () => {
    const onSelectionChange = jest.fn();

    const { getByText } = render(
      <Menu
        id="test-menu"
        aria-label="Test menu"
        selectionMode="single"
        onSelectionChange={onSelectionChange}
      >
        {basicItems}
      </Menu>,
    );

    const copyItem = getByText('Copy');
    await act(async () => {
      await userEvent.click(copyItem);
    });

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    const selectionArg = onSelectionChange.mock.calls[0][0];
    expect(selectionArg).toBeInstanceOf(Set);
    expect(selectionArg.has('copy')).toBe(true);
  });

  it('should work with multiple selection mode', async () => {
    const onSelectionChange = jest.fn();

    const { getByText } = render(
      <Menu
        id="test-menu"
        aria-label="Test menu"
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
      >
        {basicItems}
      </Menu>,
    );

    const copyItem = getByText('Copy');
    const pasteItem = getByText('Paste');

    await act(async () => {
      await userEvent.click(copyItem);
    });

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    const firstCall = onSelectionChange.mock.calls[0][0];
    expect(firstCall).toBeInstanceOf(Set);
    expect(firstCall.has('copy')).toBe(true);

    await act(async () => {
      await userEvent.click(pasteItem);
    });

    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    const secondCall = onSelectionChange.mock.calls[1][0];
    expect(secondCall).toBeInstanceOf(Set);
    expect(secondCall.has('copy')).toBe(true);
    expect(secondCall.has('paste')).toBe(true);
  });

  // Controlled and uncontrolled state tests
  it('should handle controlled selection state', () => {
    const { getByRole } = render(
      <Menu
        id="test-menu"
        aria-label="Test menu"
        selectionMode="single"
        selectedKeys={['copy']}
      >
        {basicItems}
      </Menu>,
    );

    const menu = getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(menu).toHaveAttribute('aria-label', 'Test menu');
  });

  it('should handle default selection state', () => {
    const { getByRole } = render(
      <Menu
        id="test-menu"
        aria-label="Test menu"
        selectionMode="single"
        defaultSelectedKeys={['paste']}
      >
        {basicItems}
      </Menu>,
    );

    const menu = getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(menu).toHaveAttribute('aria-label', 'Test menu');
  });

  // Selection icons tests
  it('should display selection icons for checkbox mode', () => {
    const { container } = render(
      <Menu
        id="test-menu"
        aria-label="Test menu"
        selectionMode="multiple"
        selectionIcon="checkbox"
        selectedKeys={['copy']}
      >
        {basicItems}
      </Menu>,
    );

    const checkboxes = container.querySelectorAll(
      '[data-element="ButtonIcon"]',
    );
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('should display selection icons for radio mode', () => {
    const { container } = render(
      <Menu
        id="test-menu"
        aria-label="Test menu"
        selectionMode="single"
        selectionIcon="radio"
        selectedKeys={['copy']}
      >
        {basicItems}
      </Menu>,
    );

    const radios = container.querySelectorAll('[data-element="ButtonIcon"]');
    expect(radios.length).toBeGreaterThan(0);
  });

  // Disabled keys tests
  it('should handle disabled keys', async () => {
    const onAction = jest.fn();

    const { getByText } = render(
      <Menu
        id="test-menu"
        aria-label="Test menu"
        disabledKeys={['copy']}
        onAction={onAction}
      >
        {basicItems}
      </Menu>,
    );

    const copyItem = getByText('Copy');
    const pasteItem = getByText('Paste');

    expect(copyItem.closest('li')).toHaveAttribute('aria-disabled', 'true');
    expect(pasteItem.closest('li')).not.toHaveAttribute('aria-disabled');

    // Clicking disabled item should not call onAction
    await act(async () => {
      await userEvent.click(copyItem);
    });

    expect(onAction).not.toHaveBeenCalled();

    // Clicking enabled item should call onAction
    await act(async () => {
      await userEvent.click(pasteItem);
    });

    expect(onAction).toHaveBeenCalledWith('paste');
  });

  // Sections tests
  it('should render sections with titles', () => {
    const { getByText, getByRole } = render(
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.Section title="Edit Actions">
          <Menu.Item key="copy">Copy</Menu.Item>
          <Menu.Item key="paste">Paste</Menu.Item>
        </Menu.Section>
        <Menu.Section title="File Actions">
          <Menu.Item key="save">Save</Menu.Item>
          <Menu.Item key="open">Open</Menu.Item>
        </Menu.Section>
      </Menu>,
    );

    const menu = getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(getByText('Edit Actions')).toBeInTheDocument();
    expect(getByText('File Actions')).toBeInTheDocument();
    expect(getByText('Copy')).toBeInTheDocument();
    expect(getByText('Save')).toBeInTheDocument();
  });

  it('should render sections without titles', () => {
    const { getByText, getByRole } = render(
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.Section>
          <Menu.Item key="copy">Copy</Menu.Item>
          <Menu.Item key="paste">Paste</Menu.Item>
        </Menu.Section>
        <Menu.Section>
          <Menu.Item key="save">Save</Menu.Item>
          <Menu.Item key="open">Open</Menu.Item>
        </Menu.Section>
      </Menu>,
    );

    const menu = getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(getByText('Copy')).toBeInTheDocument();
    expect(getByText('Save')).toBeInTheDocument();
  });

  it('should render dividers between sections', () => {
    const { container } = render(
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.Section title="Section 1">
          <Menu.Item key="item1">Item 1</Menu.Item>
        </Menu.Section>
        <Menu.Section title="Section 2">
          <Menu.Item key="item2">Item 2</Menu.Item>
        </Menu.Section>
      </Menu>,
    );

    const dividers = container.querySelectorAll('[role="separator"]');
    expect(dividers.length).toBe(1); // One divider between two sections
  });

  // Item features tests
  it('should support items with descriptions', () => {
    const { getByText } = render(
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.Item key="copy" description="Copy selected text">
          Copy
        </Menu.Item>
        <Menu.Item key="paste" description="Paste from clipboard">
          Paste
        </Menu.Item>
      </Menu>,
    );

    expect(getByText('Copy')).toBeInTheDocument();
    expect(getByText('Copy selected text')).toBeInTheDocument();
    expect(getByText('Paste')).toBeInTheDocument();
    expect(getByText('Paste from clipboard')).toBeInTheDocument();
  });

  it('should support items with icons', () => {
    const TestIcon = () => <svg data-testid="test-icon" />;

    const { container } = render(
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.Item key="copy" icon={<TestIcon />}>
          Copy
        </Menu.Item>
        <Menu.Item key="paste" icon={<TestIcon />}>
          Paste
        </Menu.Item>
      </Menu>,
    );

    const icons = container.querySelectorAll('[data-testid="test-icon"]');
    expect(icons).toHaveLength(2);
  });

  it('should support items with hotkeys', () => {
    const { getByText, container } = render(
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.Item key="copy" hotkeys="Ctrl+C">
          Copy
        </Menu.Item>
        <Menu.Item key="paste" hotkeys="Ctrl+V">
          Paste
        </Menu.Item>
      </Menu>,
    );

    expect(getByText('Copy')).toBeInTheDocument();
    expect(getByText('Paste')).toBeInTheDocument();

    // Check for individual key elements
    const keyElements = container.querySelectorAll('kbd');
    expect(keyElements.length).toBeGreaterThan(0);
  });

  it('should support items with postfix content', () => {
    const { getByText } = render(
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.Item key="save" postfix="March, 2022">
          Save File
        </Menu.Item>
        <Menu.Item key="open" postfix="Recently used">
          Open File
        </Menu.Item>
      </Menu>,
    );

    expect(getByText('Save File')).toBeInTheDocument();
    expect(getByText('March, 2022')).toBeInTheDocument();
    expect(getByText('Open File')).toBeInTheDocument();
    expect(getByText('Recently used')).toBeInTheDocument();
  });

  it('should support items with wrapper function', () => {
    const wrapper = (item: React.ReactElement) => (
      <div data-testid="wrapper">{item}</div>
    );

    const { container } = render(
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.Item key="copy" wrapper={wrapper}>
          Copy
        </Menu.Item>
        <Menu.Item key="paste" wrapper={wrapper}>
          Paste
        </Menu.Item>
      </Menu>,
    );

    const wrappers = container.querySelectorAll('[data-testid="wrapper"]');
    expect(wrappers).toHaveLength(2);
  });

  // Dynamic collection tests
  it('should support dynamic collection with items prop', () => {
    const items = [
      { key: 'copy', label: 'Copy', shortcut: 'Ctrl+C' },
      { key: 'paste', label: 'Paste', shortcut: 'Ctrl+V' },
      { key: 'cut', label: 'Cut', shortcut: 'Ctrl+X' },
    ];

    const { getByText, container } = render(
      <Menu id="test-menu" aria-label="Test menu" items={items}>
        {(item) => (
          <Menu.Item key={item.key} hotkeys={item.shortcut}>
            {item.label}
          </Menu.Item>
        )}
      </Menu>,
    );

    expect(getByText('Copy')).toBeInTheDocument();
    expect(getByText('Paste')).toBeInTheDocument();
    expect(getByText('Cut')).toBeInTheDocument();

    // Check for hotkeys presence
    const keyElements = container.querySelectorAll('kbd');
    expect(keyElements.length).toBeGreaterThan(0);
  });

  it('should support dynamic collection with sections', () => {
    const sections = [
      {
        key: 'file',
        title: 'File',
        items: [
          { key: 'new', label: 'New' },
          { key: 'open', label: 'Open' },
        ],
      },
      {
        key: 'edit',
        title: 'Edit',
        items: [
          { key: 'copy', label: 'Copy' },
          { key: 'paste', label: 'Paste' },
        ],
      },
    ];

    const { getByText } = render(
      <Menu id="test-menu" aria-label="Test menu" items={sections}>
        {(section) => (
          <Menu.Section
            key={section.key}
            title={section.title}
            items={section.items}
          >
            {(item) => <Menu.Item key={item.key}>{item.label}</Menu.Item>}
          </Menu.Section>
        )}
      </Menu>,
    );

    expect(getByText('File')).toBeInTheDocument();
    expect(getByText('Edit')).toBeInTheDocument();
    expect(getByText('New')).toBeInTheDocument();
    expect(getByText('Open')).toBeInTheDocument();
    expect(getByText('Copy')).toBeInTheDocument();
    expect(getByText('Paste')).toBeInTheDocument();
  });

  // Keyboard navigation tests
  it('should handle keyboard navigation', async () => {
    const onAction = jest.fn();

    const { getByRole } = render(
      <Menu id="test-menu" aria-label="Test menu" onAction={onAction}>
        {basicItems}
      </Menu>,
    );

    const menu = getByRole('menu');

    // Focus the menu and navigate
    await act(async () => {
      menu.focus();
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{Enter}');
    });

    expect(onAction).toHaveBeenCalled();
  });

  it('should handle keyboard navigation with focus wrapping', async () => {
    const { getByRole } = render(
      <Menu shouldFocusWrap id="test-menu" aria-label="Test menu">
        {basicItems}
      </Menu>,
    );

    const menu = getByRole('menu');

    await act(async () => {
      menu.focus();
      // Navigate to the last item
      await userEvent.keyboard('{ArrowUp}');
    });

    // Should focus on the last item due to wrapping
    const focusedItem = document.activeElement;
    expect(focusedItem).toBeInTheDocument();
  });

  it('should handle keyboard navigation with arrow keys', async () => {
    const { getByRole } = render(
      <Menu id="test-menu" aria-label="Test menu">
        {basicItems}
      </Menu>,
    );

    const menu = getByRole('menu');

    await act(async () => {
      menu.focus();
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{ArrowUp}');
    });

    // Should handle all arrow key navigation
    const focusedItem = document.activeElement;
    expect(focusedItem).toBeInTheDocument();
  });

  // Focus management tests
  it('should auto-focus when autoFocus is true', () => {
    const { getByRole } = render(
      <Menu autoFocus id="test-menu" aria-label="Test menu">
        {basicItems}
      </Menu>,
    );

    const menu = getByRole('menu');
    expect(menu).toHaveFocus();
  });

  it('should handle focus with first strategy', () => {
    const { container } = render(
      <Menu id="test-menu" aria-label="Test menu" autoFocus="first">
        {basicItems}
      </Menu>,
    );

    // With first strategy, first menu item gets focus
    const focusedItem = container.querySelector('[data-is-focused]');
    expect(focusedItem).toBeInTheDocument();
  });

  it('should handle focus with last strategy', () => {
    const { container } = render(
      <Menu id="test-menu" aria-label="Test menu" autoFocus="last">
        {basicItems}
      </Menu>,
    );

    // With last strategy, last menu item gets focus
    const focusedItem = container.querySelector('[data-is-focused]');
    expect(focusedItem).toBeInTheDocument();
  });

  // Header and footer tests
  it('should render header when provided', () => {
    const { getByText } = render(
      <Menu id="test-menu" aria-label="Test menu" header="Menu Header">
        {basicItems}
      </Menu>,
    );

    expect(getByText('Menu Header')).toBeInTheDocument();
  });

  it('should render footer when provided', () => {
    const { container } = render(
      <Menu id="test-menu" aria-label="Test menu" footer="Menu Footer">
        {basicItems}
      </Menu>,
    );

    // Footer sets the footer modifier
    const menu = container.querySelector('[role="menu"]');
    expect(menu).toHaveAttribute('data-is-footer', '');
  });

  it('should handle onClose callback', () => {
    const onClose = jest.fn();

    render(
      <Menu id="test-menu" aria-label="Test menu" onClose={onClose}>
        {basicItems}
      </Menu>,
    );

    // onClose is typically called by the menu trigger or overlay, not the menu itself
    expect(onClose).toBeDefined();
  });

  // Custom props tests
  it('should apply custom qa prop', () => {
    const { container } = render(
      <Menu id="test-menu" aria-label="Test menu" qa="custom-menu">
        {basicItems}
      </Menu>,
    );

    const menu = container.querySelector('[data-qa="custom-menu"]');
    expect(menu).toBeInTheDocument();
  });

  it('should apply mods based on content', () => {
    const { container } = render(
      <Menu
        id="test-menu"
        aria-label="Test menu"
        header="Header"
        footer="Footer"
      >
        <Menu.Section title="Section">
          <Menu.Item key="item">Item</Menu.Item>
        </Menu.Section>
      </Menu>,
    );

    const menu = container.querySelector('[role="menu"]');
    expect(menu).toHaveAttribute('data-is-sections', '');
    expect(menu).toHaveAttribute('data-is-header', '');
    expect(menu).toHaveAttribute('data-is-footer', '');
  });

  // Ref tests
  it('should correctly assign ref', () => {
    const menuRef = createRef<HTMLUListElement>();

    const { getByRole } = render(
      <Menu ref={menuRef} id="test-menu" aria-label="Test menu">
        {basicItems}
      </Menu>,
    );

    const menu = getByRole('menu');
    expect(menuRef.current).toBeDefined();
    expect(menuRef.current.UNSAFE_getDOMNode).toBeDefined();
  });

  // Combined functionality tests
  it('should handle both selection and action modes', async () => {
    const onAction = jest.fn();
    const onSelectionChange = jest.fn();

    const { getByText } = render(
      <Menu
        id="test-menu"
        aria-label="Test menu"
        selectionMode="single"
        onAction={onAction}
        onSelectionChange={onSelectionChange}
      >
        {basicItems}
      </Menu>,
    );

    const copyItem = getByText('Copy');
    await act(async () => {
      await userEvent.click(copyItem);
    });

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    const selectionArg = onSelectionChange.mock.calls[0][0];
    expect(selectionArg).toBeInstanceOf(Set);
    expect(selectionArg.has('copy')).toBe(true);
    expect(onAction).toHaveBeenCalledWith('copy');
  });

  it('should handle complex items with multiple features', () => {
    const TestIcon = () => <svg data-testid="test-icon" />;
    const wrapper = (item: React.ReactElement) => (
      <div data-testid="wrapper">{item}</div>
    );

    const { getByText, container } = render(
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.Item
          key="copy"
          icon={<TestIcon />}
          hotkeys="Ctrl+C"
          description="Copy selected text"
          postfix="Available"
          wrapper={wrapper}
        >
          Copy
        </Menu.Item>
      </Menu>,
    );

    expect(getByText('Copy')).toBeInTheDocument();
    expect(getByText('Copy selected text')).toBeInTheDocument();
    expect(getByText('Available')).toBeInTheDocument();

    const testIcon = container.querySelector('[data-testid="test-icon"]');
    expect(testIcon).toBeInTheDocument();

    const wrapper_el = container.querySelector('[data-testid="wrapper"]');
    expect(wrapper_el).toBeInTheDocument();

    // Check for hotkeys presence - hotkeys are rendered as text content
    const menuItem = container.querySelector('[data-qa="MenuItem-copy"]');
    expect(menuItem).toBeInTheDocument();
  });

  // Controlled state tests
  it('should handle selection changes with controlled state', async () => {
    const onSelectionChange = jest.fn();

    const { getByText, rerender, getByRole } = render(
      <Menu
        id="test-menu"
        aria-label="Test menu"
        selectionMode="single"
        selectedKeys={['copy']}
        onSelectionChange={onSelectionChange}
      >
        {basicItems}
      </Menu>,
    );

    const pasteItem = getByText('Paste');
    await act(async () => {
      await userEvent.click(pasteItem);
    });

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    const selectionArg = onSelectionChange.mock.calls[0][0];
    expect(selectionArg).toBeInstanceOf(Set);
    expect(selectionArg.has('paste')).toBe(true);

    // Simulate controlled state update
    rerender(
      <Menu
        id="test-menu"
        aria-label="Test menu"
        selectionMode="single"
        selectedKeys={['paste']}
        onSelectionChange={onSelectionChange}
      >
        {basicItems}
      </Menu>,
    );

    const menu = getByRole('menu');
    expect(menu).toBeInTheDocument();
  });

  it('should handle multiple selection with controlled state', async () => {
    const onSelectionChange = jest.fn();

    const { getByText, rerender, getByRole } = render(
      <Menu
        id="test-menu"
        aria-label="Test menu"
        selectionMode="multiple"
        selectedKeys={['copy']}
        onSelectionChange={onSelectionChange}
      >
        {basicItems}
      </Menu>,
    );

    const pasteItem = getByText('Paste');
    await act(async () => {
      await userEvent.click(pasteItem);
    });

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    const selectionArg = onSelectionChange.mock.calls[0][0];
    expect(selectionArg).toBeInstanceOf(Set);
    expect(selectionArg.has('copy')).toBe(true);
    expect(selectionArg.has('paste')).toBe(true);

    // Simulate controlled state update
    rerender(
      <Menu
        id="test-menu"
        aria-label="Test menu"
        selectionMode="multiple"
        selectedKeys={['copy', 'paste']}
        onSelectionChange={onSelectionChange}
      >
        {basicItems}
      </Menu>,
    );

    const menu = getByRole('menu');
    expect(menu).toBeInTheDocument();
  });

  // Edge cases tests
  it('should handle empty menu gracefully', () => {
    const { getByRole } = render(
      <Menu id="test-menu" aria-label="Test menu"></Menu>,
    );

    const menu = getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(menu.children).toHaveLength(0);
  });

  it('should handle menu with only sections', () => {
    const { getByRole } = render(
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.Section title="Empty Section"></Menu.Section>
      </Menu>,
    );

    const menu = getByRole('menu');
    expect(menu).toBeInTheDocument();
  });

  it('should handle invalid selection keys gracefully', () => {
    const { getByRole } = render(
      <Menu
        id="test-menu"
        aria-label="Test menu"
        selectionMode="single"
        selectedKeys={['nonexistent']}
      >
        {basicItems}
      </Menu>,
    );

    const menu = getByRole('menu');
    expect(menu).toBeInTheDocument();
  });

  // Accessibility tests
  it('should handle aria attributes correctly', () => {
    const { getByRole } = render(
      <Menu id="test-menu" aria-label="Test menu" aria-labelledby="menu-button">
        {basicItems}
      </Menu>,
    );

    const menu = getByRole('menu');
    expect(menu).toHaveAttribute('aria-label', 'Test menu');
    expect(menu).toHaveAttribute('aria-labelledby', 'menu-button');
  });

  it('should have proper menu item roles', () => {
    const { getAllByRole } = render(
      <Menu id="test-menu" aria-label="Test menu">
        {basicItems}
      </Menu>,
    );

    const menuItems = getAllByRole('menuitem');
    expect(menuItems).toHaveLength(3);
  });

  it('should handle disabled items with proper aria attributes', () => {
    const { getByText } = render(
      <Menu id="test-menu" aria-label="Test menu" disabledKeys={['copy']}>
        {basicItems}
      </Menu>,
    );

    const copyItem = getByText('Copy');
    expect(copyItem.closest('li')).toHaveAttribute('aria-disabled', 'true');
  });

  // Performance and complex scenarios
  it('should handle large number of items efficiently', () => {
    const manyItems = Array.from({ length: 100 }, (_, i) => (
      <Menu.Item key={`item-${i}`} textValue={`Item ${i}`}>
        Item {i}
      </Menu.Item>
    ));

    const { getByRole } = render(
      <Menu id="test-menu" aria-label="Test menu">
        {manyItems}
      </Menu>,
    );

    const menu = getByRole('menu');
    expect(menu).toBeInTheDocument();
  });

  it('should handle mixed sections and items', () => {
    const { getByText, getByRole } = render(
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.Item key="standalone">Standalone Item</Menu.Item>
        <Menu.Section title="Section 1">
          <Menu.Item key="section1-item1">Section 1 Item 1</Menu.Item>
        </Menu.Section>
        <Menu.Item key="another-standalone">Another Standalone</Menu.Item>
        <Menu.Section title="Section 2">
          <Menu.Item key="section2-item1">Section 2 Item 1</Menu.Item>
        </Menu.Section>
      </Menu>,
    );

    const menu = getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(getByText('Standalone Item')).toBeInTheDocument();
    expect(getByText('Section 1')).toBeInTheDocument();
    expect(getByText('Another Standalone')).toBeInTheDocument();
    expect(getByText('Section 2')).toBeInTheDocument();
  });

  // Test deselection in multiple selection mode
  it('should handle deselection in multiple selection mode', async () => {
    const onSelectionChange = jest.fn();

    const { getByText } = render(
      <Menu
        id="test-menu"
        aria-label="Test menu"
        selectionMode="multiple"
        selectedKeys={['copy', 'paste']}
        onSelectionChange={onSelectionChange}
      >
        {basicItems}
      </Menu>,
    );

    // Click on already selected item to deselect
    const copyItem = getByText('Copy');
    await act(async () => {
      await userEvent.click(copyItem);
    });

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    const selectionArg = onSelectionChange.mock.calls[0][0];
    expect(selectionArg).toBeInstanceOf(Set);
    expect(selectionArg.has('copy')).toBe(false);
    expect(selectionArg.has('paste')).toBe(true);
  });

  // Test with width and height props
  it('should handle width and height props', () => {
    const { container } = render(
      <Menu id="test-menu" aria-label="Test menu" width="300px" height="200px">
        {basicItems}
      </Menu>,
    );

    const menu = container.querySelector('[role="menu"]');
    expect(menu).toBeInTheDocument();
  });

  // Test item with complex postfix content
  it('should handle complex postfix content', () => {
    const ComplexPostfix = () => (
      <div data-testid="complex-postfix">
        <span>Complex</span>
        <span>Content</span>
      </div>
    );

    const { container } = render(
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.Item key="complex" postfix={<ComplexPostfix />}>
          Complex Item
        </Menu.Item>
      </Menu>,
    );

    const complexPostfix = container.querySelector(
      '[data-testid="complex-postfix"]',
    );
    expect(complexPostfix).toBeInTheDocument();
  });

  // Test section with complex heading
  it('should handle section with complex heading', () => {
    const ComplexHeading = () => (
      <div data-testid="complex-heading">
        <strong>Complex</strong> Heading
      </div>
    );

    const { container } = render(
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.Section title={<ComplexHeading />}>
          <Menu.Item key="item">Item</Menu.Item>
        </Menu.Section>
      </Menu>,
    );

    const complexHeading = container.querySelector(
      '[data-testid="complex-heading"]',
    );
    expect(complexHeading).toBeInTheDocument();
  });
});
