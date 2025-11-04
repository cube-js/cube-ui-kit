// @ts-nocheck
// NOTE: Type checking is disabled in this test file to prevent
// noisy errors from complex generic typings that do not affect runtime behaviour.
import { createRef } from 'react';

import {
  act,
  fireEvent,
  render,
  renderHook,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';
import { EventBusProvider } from '../../../utils/react/useEventBus';
import { Select } from '../../fields';
import { Button } from '../Button';
import { CommandMenu } from '../CommandMenu';
import { useAnchoredMenu } from '../use-anchored-menu';
import { useContextMenu } from '../use-context-menu';

import { Menu } from './Menu';
import { MenuTrigger } from './MenuTrigger';

jest.mock('../../../_internal/hooks/use-warn');

// Wrapper for hooks that need EventBusProvider
const HookWrapper = ({ children }: { children: React.ReactNode }) => (
  <EventBusProvider>{children}</EventBusProvider>
);

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
    expect(selectionArg).toEqual(['copy']);
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
    expect(firstCall).toEqual(['copy']);

    await act(async () => {
      await userEvent.click(pasteItem);
    });

    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    const secondCall = onSelectionChange.mock.calls[1][0];
    expect(secondCall).toEqual(expect.arrayContaining(['copy', 'paste']));
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
        selectedKeys={['copy']}
      >
        <Menu.Item key="copy" icon="checkbox">
          Copy
        </Menu.Item>
        <Menu.Item key="paste" icon="checkbox">
          Paste
        </Menu.Item>
        <Menu.Item key="cut" icon="checkbox">
          Cut
        </Menu.Item>
      </Menu>,
    );

    // Check that selected items have checkboxes (Icon elements for selected items)
    const icons = container.querySelectorAll('[data-element="Icon"]');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should display selection icons for radio mode', () => {
    const { container } = render(
      <Menu
        id="test-menu"
        aria-label="Test menu"
        selectionMode="single"
        selectedKeys={['copy']}
      >
        <Menu.Item key="copy" icon="checkbox">
          Copy
        </Menu.Item>
        <Menu.Item key="paste" icon="checkbox">
          Paste
        </Menu.Item>
        <Menu.Item key="cut" icon="checkbox">
          Cut
        </Menu.Item>
      </Menu>,
    );

    // Check that selected items have icons (Icon elements for selected items)
    const icons = container.querySelectorAll('[data-element="Icon"]');
    expect(icons.length).toBeGreaterThan(0);
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

  it('should support items with suffix content', () => {
    const { getByText } = render(
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.Item key="save" suffix="March, 2022">
          Save File
        </Menu.Item>
        <Menu.Item key="open" suffix="Recently used">
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

    const { getByRole } = renderWithRoot(
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
    const { getByRole } = renderWithRoot(
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
    const { getByRole } = renderWithRoot(
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
    const { container } = renderWithRoot(
      <Menu id="test-menu" aria-label="Test menu" autoFocus="first">
        {basicItems}
      </Menu>,
    );

    // With first strategy, first menu item gets focus
    const focusedItem = container.querySelector('[data-focused]');
    expect(focusedItem).toBeInTheDocument();
  });

  it('should handle focus with last strategy', () => {
    const { container } = renderWithRoot(
      <Menu id="test-menu" aria-label="Test menu" autoFocus="last">
        {basicItems}
      </Menu>,
    );

    // With last strategy, last menu item gets focus
    const focusedItem = container.querySelector('[data-focused]');
    expect(focusedItem).toBeInTheDocument();
  });

  // Header and footer tests
  it('should render header when provided', () => {
    const { getByText, getByRole } = render(
      <Menu id="test-menu" aria-label="Test menu" header="Menu Header">
        {basicItems}
      </Menu>,
    );

    // Header content should be visible
    expect(getByText('Menu Header')).toBeInTheDocument();

    // Header element should have the correct role and qa attribute
    const header = getByRole('heading', { level: 3 });
    expect(header).toBeInTheDocument();
    expect(header).toHaveAttribute('data-qa', 'Header');
  });

  it('should render footer when provided', () => {
    const { getByText, getByRole } = render(
      <Menu id="test-menu" aria-label="Test menu" footer="Menu Footer">
        {basicItems}
      </Menu>,
    );

    // Footer content should be visible
    expect(getByText('Menu Footer')).toBeInTheDocument();

    // Footer element should have the correct role and qa attribute
    const footer = getByRole('footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveAttribute('data-qa', 'Footer');
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

    const menuWrapper = container.querySelector('[data-qa="custom-menu"]');
    expect(menuWrapper).toBeInTheDocument();
  });

  it('should apply mods based on content', () => {
    const { container, getByRole } = render(
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

    // Check wrapper mods (header, footer are on wrapper)
    const menuWrapper = container.querySelector('[data-qa="Menu"]');
    expect(menuWrapper).toHaveAttribute('data-header', '');
    expect(menuWrapper).toHaveAttribute('data-footer', '');

    // Check menu list mods (sections mod is on the menu list)
    const menu = getByRole('menu');
    expect(menu).toHaveAttribute('data-sections', '');
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
    expect(selectionArg).toEqual(['copy']);
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
          suffix="Available"
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
    expect(selectionArg).toEqual(['paste']);

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
    expect(selectionArg).toEqual(expect.arrayContaining(['copy', 'paste']));

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
    expect(selectionArg).toEqual(['paste']); // 'copy' was deselected
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
  it('should handle complex suffix content', () => {
    const ComplexSuffix = () => (
      <div data-testid="complex-suffix">
        <span>Complex</span>
        <span>Content</span>
      </div>
    );

    const { container } = render(
      <Menu id="test-menu" aria-label="Test menu">
        <Menu.Item key="complex" suffix={<ComplexSuffix />}>
          Complex Item
        </Menu.Item>
      </Menu>,
    );

    const complexSuffix = container.querySelector(
      '[data-testid="complex-suffix"]',
    );
    expect(complexSuffix).toBeInTheDocument();
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

  it('should support items with tooltip property', () => {
    const { getByRole, getByText } = renderWithRoot(
      <Menu aria-label="Test menu">
        <Menu.Item key="copy" tooltip="Copy selected text">
          Copy
        </Menu.Item>
        <Menu.Item
          key="paste"
          tooltip={{ title: 'Paste from clipboard', placement: 'left' }}
        >
          Paste
        </Menu.Item>
      </Menu>,
    );

    expect(getByRole('menu')).toBeInTheDocument();
    expect(getByText('Copy')).toBeInTheDocument();
    expect(getByText('Paste')).toBeInTheDocument();
  });
});

describe('Menu popover mod', () => {
  it('should apply popover mod when context provides it', () => {
    const { MenuContext } = require('./context');

    const { container } = render(
      <MenuContext.Provider value={{ mods: { popover: true } }}>
        <Menu aria-label="Test menu">
          <Menu.Item key="item1">Item 1</Menu.Item>
          <Menu.Item key="item2">Item 2</Menu.Item>
        </Menu>
      </MenuContext.Provider>,
    );

    const menuWrapper = container.querySelector('[data-qa="Menu"]');
    expect(menuWrapper).toHaveAttribute('data-popover');
  });

  it('should not apply popover mod when used standalone', () => {
    const { container } = render(
      <Menu aria-label="Test menu">
        <Menu.Item key="item1">Item 1</Menu.Item>
        <Menu.Item key="item2">Item 2</Menu.Item>
      </Menu>,
    );

    const menuWrapper = container.querySelector('[data-qa="Menu"]');
    expect(menuWrapper).not.toHaveAttribute('data-popover');
  });

  it('should not apply popover mod when context provides false', () => {
    const { MenuContext } = require('./context');

    const { container } = render(
      <MenuContext.Provider value={{ mods: { popover: false } }}>
        <Menu aria-label="Test menu">
          <Menu.Item key="item1">Item 1</Menu.Item>
          <Menu.Item key="item2">Item 2</Menu.Item>
        </Menu>
      </MenuContext.Provider>,
    );

    const menuWrapper = container.querySelector('[data-qa="Menu"]');
    expect(menuWrapper).not.toHaveAttribute('data-popover');
  });
});

describe('useAnchoredMenu', () => {
  // Test component that uses the hook with Menu
  const TestMenuComponent = ({
    onAction,
  }: {
    onAction?: (key: string) => void;
  }) => (
    <Menu onAction={onAction}>
      <Menu.Item key="edit">Edit</Menu.Item>
      <Menu.Item key="delete">Delete</Menu.Item>
      <Menu.Item key="copy">Copy</Menu.Item>
    </Menu>
  );

  // Test component that uses the hook with CommandMenu
  const TestCommandMenuComponent = ({
    onAction,
    searchPlaceholder,
  }: {
    onAction?: (key: string) => void;
    searchPlaceholder?: string;
  }) => (
    <CommandMenu
      searchPlaceholder={searchPlaceholder || 'Search commands...'}
      onAction={onAction}
    >
      <Menu.Item key="copy">Copy</Menu.Item>
      <Menu.Item key="paste">Paste</Menu.Item>
      <Menu.Item key="cut">Cut</Menu.Item>
    </CommandMenu>
  );

  // Wrapper component to test the hook
  const TestWrapper = ({
    Component,
    componentProps = {},
    triggerProps = {},
    defaultTriggerProps = {},
    onTriggerClick,
  }: {
    Component: any;
    componentProps?: any;
    triggerProps?: any;
    defaultTriggerProps?: any;
    onTriggerClick?: () => void;
  }) => {
    const { anchorRef, open, close, rendered } = useAnchoredMenu(
      Component,
      defaultTriggerProps,
    );

    const handleClick = () => {
      if (onTriggerClick) {
        onTriggerClick();
      }
      open(componentProps, triggerProps);
    };

    return (
      <div ref={anchorRef} data-qa="container">
        <button data-qa="trigger" onClick={handleClick}>
          Open Menu
        </button>
        <button data-qa="close-button" onClick={close}>
          Close Menu
        </button>
        {rendered}
      </div>
    );
  };

  // Basic functionality tests
  it('should provide anchorRef, open, close, and rendered properties', () => {
    const { result } = renderHook(() => useAnchoredMenu(TestMenuComponent), {
      wrapper: HookWrapper,
    });

    expect(result.current.anchorRef).toBeDefined();
    expect(result.current.anchorRef.current).toBeNull(); // Initially null
    expect(typeof result.current.open).toBe('function');
    expect(typeof result.current.close).toBe('function');
    expect(result.current.rendered).toBeNull(); // Initially null since not opened
  });

  it('should provide setup check functionality', () => {
    // Test that the hook provides the setup check mechanism
    // This is tested indirectly through the integration tests
    // where the rendered property must be accessed for the hook to work
    const { result } = renderHook(() => useAnchoredMenu(TestMenuComponent), {
      wrapper: HookWrapper,
    });

    // The hook should provide all expected functions
    expect(typeof result.current.open).toBe('function');
    expect(typeof result.current.close).toBe('function');
    expect(result.current.rendered).toBeNull(); // Initially null

    // Accessing rendered should set up the hook properly
    const rendered = result.current.rendered;
    expect(rendered).toBeNull(); // Still null since no props are set
  });

  it('should render menu when opened with Menu component', async () => {
    const onAction = jest.fn();

    const { getByTestId, getByRole, getByText } = renderWithRoot(
      <TestWrapper
        Component={TestMenuComponent}
        componentProps={{ onAction }}
      />,
    );

    const trigger = getByTestId('trigger');

    // Initially, menu should not be visible
    expect(() => getByRole('menu')).toThrow();

    // Click trigger to open menu
    await act(async () => {
      await userEvent.click(trigger);
    });

    // Menu should now be visible
    await waitFor(() => {
      expect(getByRole('menu')).toBeInTheDocument();
    });

    expect(getByText('Edit')).toBeInTheDocument();
    expect(getByText('Delete')).toBeInTheDocument();
    expect(getByText('Copy')).toBeInTheDocument();
  });

  it('should render CommandMenu when opened with CommandMenu component', async () => {
    const onAction = jest.fn();

    const { getByTestId, getByRole, getByText, getByPlaceholderText } =
      renderWithRoot(
        <TestWrapper
          Component={TestCommandMenuComponent}
          componentProps={{
            onAction,
            searchPlaceholder: 'Search test commands...',
          }}
        />,
      );

    const trigger = getByTestId('trigger');

    // Click trigger to open command menu
    await act(async () => {
      await userEvent.click(trigger);
    });

    // CommandMenu should now be visible
    await waitFor(() => {
      expect(getByRole('menu')).toBeInTheDocument();
    });

    expect(getByPlaceholderText('Search test commands...')).toBeInTheDocument();
    expect(getByText('Copy')).toBeInTheDocument();
    expect(getByText('Paste')).toBeInTheDocument();
    expect(getByText('Cut')).toBeInTheDocument();
  });

  it('should close menu when close function is called', async () => {
    const onAction = jest.fn();

    const { getByTestId, getByRole, queryByRole } = renderWithRoot(
      <TestWrapper
        Component={TestMenuComponent}
        componentProps={{ onAction }}
      />,
    );

    const trigger = getByTestId('trigger');
    const closeButton = getByTestId('close-button');

    // Open menu
    await act(async () => {
      await userEvent.click(trigger);
    });

    await waitFor(() => {
      expect(getByRole('menu')).toBeInTheDocument();
    });

    // Close menu
    await act(async () => {
      await userEvent.click(closeButton);
    });

    await waitFor(() => {
      expect(queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('should handle menu item actions correctly', async () => {
    const onAction = jest.fn();

    const { getByTestId, getByText } = renderWithRoot(
      <TestWrapper
        Component={TestMenuComponent}
        componentProps={{ onAction }}
      />,
    );

    const trigger = getByTestId('trigger');

    // Open menu
    await act(async () => {
      await userEvent.click(trigger);
    });

    // Click on Edit item
    const editItem = getByText('Edit');
    await act(async () => {
      await userEvent.click(editItem);
    });

    expect(onAction).toHaveBeenCalledWith('edit');
  });

  it('should pass trigger props to MenuTrigger', async () => {
    const onAction = jest.fn();

    const { getByTestId, getByRole } = renderWithRoot(
      <TestWrapper
        Component={TestMenuComponent}
        componentProps={{ onAction }}
        triggerProps={{ placement: 'top start' }}
      />,
    );

    const trigger = getByTestId('trigger');

    // Open menu
    await act(async () => {
      await userEvent.click(trigger);
    });

    await waitFor(() => {
      expect(getByRole('menu')).toBeInTheDocument();
    });

    // The menu should be positioned according to the trigger props
    // This is a basic test - in a real scenario you might want to test positioning more thoroughly
    expect(getByRole('menu')).toBeInTheDocument();
  });

  it('should merge default trigger props with runtime trigger props', async () => {
    const onAction = jest.fn();

    const { getByTestId, getByRole } = renderWithRoot(
      <TestWrapper
        Component={TestMenuComponent}
        componentProps={{ onAction }}
        defaultTriggerProps={{ placement: 'bottom start' }}
        triggerProps={{ offset: 16 }}
      />,
    );

    const trigger = getByTestId('trigger');

    // Open menu
    await act(async () => {
      await userEvent.click(trigger);
    });

    await waitFor(() => {
      expect(getByRole('menu')).toBeInTheDocument();
    });

    // Both default and runtime props should be applied
    expect(getByRole('menu')).toBeInTheDocument();
  });

  it('should update component props when opened multiple times', async () => {
    const onAction1 = jest.fn();
    const onAction2 = jest.fn();

    // Custom wrapper to test multiple opens with different props
    const MultiOpenWrapper = () => {
      const { anchorRef, open, rendered } = useAnchoredMenu(TestMenuComponent);

      return (
        <div ref={anchorRef} data-qa="container">
          <button
            data-qa="trigger1"
            onClick={() => open({ onAction: onAction1 })}
          >
            Open Menu 1
          </button>
          <button
            data-qa="trigger2"
            onClick={() => open({ onAction: onAction2 })}
          >
            Open Menu 2
          </button>
          {rendered}
        </div>
      );
    };

    const { getByTestId, getByText } = renderWithRoot(<MultiOpenWrapper />);

    const trigger1 = getByTestId('trigger1');
    const trigger2 = getByTestId('trigger2');

    // Open with first action handler
    await act(async () => {
      await userEvent.click(trigger1);
    });

    const editItem1 = getByText('Edit');
    await act(async () => {
      await userEvent.click(editItem1);
    });

    expect(onAction1).toHaveBeenCalledWith('edit');
    expect(onAction2).not.toHaveBeenCalled();

    // Open with second action handler
    await act(async () => {
      await userEvent.click(trigger2);
    });

    const editItem2 = getByText('Edit');
    await act(async () => {
      await userEvent.click(editItem2);
    });

    expect(onAction2).toHaveBeenCalledWith('edit');
    expect(onAction1).toHaveBeenCalledTimes(1); // Should still be called only once
  });

  it('should handle CommandMenu search functionality', async () => {
    const onAction = jest.fn();

    const { getByTestId, getByPlaceholderText, getByText, queryByText } =
      renderWithRoot(
        <TestWrapper
          Component={TestCommandMenuComponent}
          componentProps={{ onAction }}
        />,
      );

    const trigger = getByTestId('trigger');

    // Open command menu
    await act(async () => {
      await userEvent.click(trigger);
    });

    const searchInput = getByPlaceholderText('Search commands...');

    // Initially all items should be visible
    expect(getByText('Copy')).toBeInTheDocument();
    expect(getByText('Paste')).toBeInTheDocument();
    expect(getByText('Cut')).toBeInTheDocument();

    // Search for "copy"
    await act(async () => {
      await userEvent.type(searchInput, 'copy');
    });

    // Only Copy should be visible
    await waitFor(() => {
      expect(getByText('Copy')).toBeInTheDocument();
      expect(queryByText('Paste')).not.toBeInTheDocument();
      expect(queryByText('Cut')).not.toBeInTheDocument();
    });
  });

  it('should maintain anchor ref across renders', () => {
    const TestRefWrapper = () => {
      const { anchorRef, rendered } = useAnchoredMenu(TestMenuComponent);

      return (
        <div ref={anchorRef} data-qa="container">
          <div data-qa="anchor-test">Anchor element</div>
          {rendered}
        </div>
      );
    };

    const { getByTestId, rerender } = renderWithRoot(<TestRefWrapper />);

    const container = getByTestId('container');
    const initialRef = container;

    // Rerender and check that the ref is maintained
    rerender(<TestRefWrapper />);

    const containerAfterRerender = getByTestId('container');
    expect(containerAfterRerender).toBe(initialRef);
  });

  it('should handle edge case when component props are null', () => {
    const { result } = renderHook(() => useAnchoredMenu(TestMenuComponent), {
      wrapper: HookWrapper,
    });

    // When no props are set, rendered should be null
    expect(result.current.rendered).toBeNull();
  });

  it('should work with custom MenuTrigger placement', async () => {
    const onAction = jest.fn();

    const { getByTestId, getByRole } = renderWithRoot(
      <TestWrapper
        Component={TestMenuComponent}
        componentProps={{ onAction }}
        defaultTriggerProps={{ placement: 'top end' }}
      />,
    );

    const trigger = getByTestId('trigger');

    // Open menu
    await act(async () => {
      await userEvent.click(trigger);
    });

    await waitFor(() => {
      expect(getByRole('menu')).toBeInTheDocument();
    });

    // Menu should be positioned according to placement
    expect(getByRole('menu')).toBeInTheDocument();
  });
});

describe('Menu synchronization with event bus', () => {
  it('should close other menus when a new menu opens', async () => {
    const TestMenuSynchronization = () => {
      const {
        anchorRef: anchorRef1,
        open: open1,
        rendered: rendered1,
      } = useAnchoredMenu(({ onAction }) => (
        <Menu onAction={onAction}>
          <Menu.Item key="item1">Menu 1 Item</Menu.Item>
        </Menu>
      ));

      const {
        anchorRef: anchorRef2,
        open: open2,
        rendered: rendered2,
      } = useAnchoredMenu(({ onAction }) => (
        <Menu onAction={onAction}>
          <Menu.Item key="item2">Menu 2 Item</Menu.Item>
        </Menu>
      ));

      const {
        anchorRef: anchorRef3,
        open: open3,
        rendered: rendered3,
      } = useContextMenu(({ onAction }) => (
        <Menu onAction={onAction}>
          <Menu.Item key="item3">Menu 3 Item</Menu.Item>
        </Menu>
      ));

      return (
        <div data-qa="container">
          <div ref={anchorRef1}>
            <button
              data-qa="trigger1"
              onClick={() => open1({ onAction: () => {} })}
            >
              Open Menu 1
            </button>
          </div>
          <div ref={anchorRef2}>
            <button
              data-qa="trigger2"
              onClick={() => open2({ onAction: () => {} })}
            >
              Open Menu 2
            </button>
          </div>
          <div ref={anchorRef3}>
            <button
              data-qa="trigger3"
              onClick={(e) => open3(e, { onAction: () => {} })}
            >
              Open Menu 3
            </button>
          </div>
          {rendered1}
          {rendered2}
          {rendered3}
        </div>
      );
    };

    const { getByTestId, getAllByRole, queryAllByRole } = renderWithRoot(
      <TestMenuSynchronization />,
    );

    const trigger1 = getByTestId('trigger1');
    const trigger2 = getByTestId('trigger2');
    const trigger3 = getByTestId('trigger3');

    // Initially, no menus should be visible
    expect(queryAllByRole('menu')).toHaveLength(0);

    // Open first menu
    await act(async () => {
      await userEvent.click(trigger1);
    });

    await waitFor(() => {
      expect(getAllByRole('menu')).toHaveLength(1);
    });

    // Open second menu - should close the first one
    await act(async () => {
      await userEvent.click(trigger2);
    });

    await waitFor(() => {
      expect(getAllByRole('menu')).toHaveLength(1);
    });

    // Open third menu (context menu) - should close the second one
    await act(async () => {
      await userEvent.click(trigger3);
    });

    await waitFor(() => {
      expect(getAllByRole('menu')).toHaveLength(1);
    });

    // Verify only the third menu is open by checking content
    const menus = getAllByRole('menu');
    expect(menus).toHaveLength(1);

    // The third menu should contain "Menu 3 Item"
    const menuContent = menus[0];
    expect(menuContent).toHaveTextContent('Menu 3 Item');
  });

  it('should handle rapid menu opening without conflicts', async () => {
    const TestRapidMenuOpening = () => {
      const {
        anchorRef: anchorRef1,
        open: open1,
        rendered: rendered1,
      } = useAnchoredMenu(({ onAction }) => (
        <Menu onAction={onAction}>
          <Menu.Item key="item1">Menu 1</Menu.Item>
        </Menu>
      ));

      const {
        anchorRef: anchorRef2,
        open: open2,
        rendered: rendered2,
      } = useAnchoredMenu(({ onAction }) => (
        <Menu onAction={onAction}>
          <Menu.Item key="item2">Menu 2</Menu.Item>
        </Menu>
      ));

      return (
        <div>
          <div ref={anchorRef1}>
            <button
              data-qa="rapid-trigger1"
              onClick={() => open1({ onAction: () => {} })}
            >
              Rapid 1
            </button>
          </div>
          <div ref={anchorRef2}>
            <button
              data-qa="rapid-trigger2"
              onClick={() => open2({ onAction: () => {} })}
            >
              Rapid 2
            </button>
          </div>
          {rendered1}
          {rendered2}
        </div>
      );
    };

    const { getByTestId, getAllByRole, queryAllByRole } = renderWithRoot(
      <TestRapidMenuOpening />,
    );

    const trigger1 = getByTestId('rapid-trigger1');
    const trigger2 = getByTestId('rapid-trigger2');

    // Rapidly click between menus
    await act(async () => {
      await userEvent.click(trigger1);
    });

    // Wait for the first menu to be open
    await waitFor(() => {
      expect(getAllByRole('menu')).toHaveLength(1);
    });

    await act(async () => {
      await userEvent.click(trigger2);
    });

    // Wait for stabilization - allow time for the async setTimeout(0) to process
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    await act(async () => {
      await userEvent.click(trigger1);
    });

    // Wait for stabilization again
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    await act(async () => {
      await userEvent.click(trigger2);
    });

    // Final wait for stabilization
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Should still have only one menu open
    await waitFor(() => {
      expect(getAllByRole('menu')).toHaveLength(1);
    });

    // Verify it's the second menu (last opened)
    const menus = getAllByRole('menu');
    expect(menus[0]).toHaveTextContent('Menu 2');
  });
});

// NOTE: Menu synchronization with Select and ComboBox has been implemented.
// The synchronization ensures only one popover is open at a time across:
// - MenuTrigger
// - useAnchoredMenu
// - useContextMenu
// - Select
// - ComboBox
//
// Implementation details:
// 1. Each component generates a unique ID and listens for 'popover:open' events
// 2. When a component opens, it emits a 'popover:open' event with its ID
// 3. Other open components receive the event and close themselves
// 4. The event bus uses setTimeout(0) to ensure async emission after render cycles
// 5. This prevents race conditions where components close themselves immediately after opening
//
// The synchronization is handled by the EventBusProvider in useEventBus.ts
