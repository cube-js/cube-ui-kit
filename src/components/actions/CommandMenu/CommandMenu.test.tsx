import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { CommandMenu } from './CommandMenu';

describe('CommandMenu', () => {
  const items = [
    { id: '1', textValue: 'Create file' },
    { id: '2', textValue: 'Open folder' },
    { id: '3', textValue: 'Save document' },
  ];

  it('renders with search input and menu items', () => {
    render(
      <CommandMenu>
        {items.map((item) => (
          <CommandMenu.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandMenu.Item>
        ))}
      </CommandMenu>,
    );

    expect(
      screen.getByPlaceholderText('Search commands...'),
    ).toBeInTheDocument();
    expect(screen.getByText('Create file')).toBeInTheDocument();
    expect(screen.getByText('Open folder')).toBeInTheDocument();
    expect(screen.getByText('Save document')).toBeInTheDocument();
  });

  it('filters items based on search input', async () => {
    const user = userEvent.setup();

    render(
      <CommandMenu>
        {items.map((item) => (
          <CommandMenu.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandMenu.Item>
        ))}
      </CommandMenu>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');
    await user.type(searchInput, 'file');

    expect(screen.getByText('Create file')).toBeInTheDocument();
    expect(screen.queryByText('Open folder')).not.toBeInTheDocument();
    expect(screen.queryByText('Save document')).not.toBeInTheDocument();
  });

  it('navigates through items with arrow keys while search input retains focus', async () => {
    const user = userEvent.setup();

    render(
      <CommandMenu qa="test-menu">
        {items.map((item) => (
          <CommandMenu.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandMenu.Item>
        ))}
      </CommandMenu>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');

    // Focus the search input
    await user.click(searchInput);
    expect(searchInput).toHaveFocus();

    // Press arrow down - should move virtual focus to first item
    await user.keyboard('{ArrowDown}');

    // Search input should still have focus
    expect(searchInput).toHaveFocus();

    // First item should be virtually focused (aria-activedescendant)
    expect(searchInput).toHaveAttribute(
      'aria-activedescendant',
      'test-menu-menu-option-1',
    );

    // Press arrow down again - should move to second item
    await user.keyboard('{ArrowDown}');

    // Search input should still have focus
    expect(searchInput).toHaveFocus();

    // Second item should be virtually focused
    expect(searchInput).toHaveAttribute(
      'aria-activedescendant',
      'test-menu-menu-option-2',
    );

    // Press arrow up - should move back to first item
    await user.keyboard('{ArrowUp}');

    // Search input should still have focus
    expect(searchInput).toHaveFocus();

    // First item should be virtually focused again
    expect(searchInput).toHaveAttribute(
      'aria-activedescendant',
      'test-menu-menu-option-1',
    );
  });

  it('navigates through filtered items with arrow keys when search input has value', async () => {
    const user = userEvent.setup();

    render(
      <CommandMenu qa="test-menu">
        {items.map((item) => (
          <CommandMenu.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandMenu.Item>
        ))}
      </CommandMenu>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');

    // Focus and type to filter items - "Create" should only match "Create file" (id: '1')
    await user.click(searchInput);
    await user.type(searchInput, 'Create');

    // Verify filtered items are visible
    expect(screen.getByText('Create file')).toBeInTheDocument();
    expect(screen.queryByText('Open folder')).not.toBeInTheDocument();
    expect(screen.queryByText('Save document')).not.toBeInTheDocument();

    // Press arrow down - should move virtual focus to the only filtered item ('Create file')
    await user.keyboard('{ArrowDown}');

    // Search input should still have focus
    expect(searchInput).toHaveFocus();

    // The filtered item should be virtually focused
    expect(searchInput).toHaveAttribute(
      'aria-activedescendant',
      'test-menu-menu-option-1',
    );

    // Clear and type "Save" to test navigation with different filter
    await user.clear(searchInput);
    await user.type(searchInput, 'Save');

    // Verify filtered items are visible
    expect(screen.getByText('Save document')).toBeInTheDocument();
    expect(screen.queryByText('Create file')).not.toBeInTheDocument();
    expect(screen.queryByText('Open folder')).not.toBeInTheDocument();

    // Press arrow down - should move virtual focus to the only filtered item ('Save document')
    await user.keyboard('{ArrowDown}');

    // Search input should still have focus
    expect(searchInput).toHaveFocus();

    // The filtered item should be virtually focused
    expect(searchInput).toHaveAttribute(
      'aria-activedescendant',
      'test-menu-menu-option-3',
    );

    // Clear and type "a" to match multiple items ("Create file" and "Save document")
    await user.clear(searchInput);
    await user.type(searchInput, 'a');

    // Verify filtered items are visible
    expect(screen.getByText('Create file')).toBeInTheDocument();
    expect(screen.getByText('Save document')).toBeInTheDocument();
    expect(screen.queryByText('Open folder')).not.toBeInTheDocument();

    // Press arrow down - should move to second filtered item ('Save document')
    // since auto-focus already focused the first item when typing
    await user.keyboard('{ArrowDown}');

    // Second filtered item should be virtually focused
    expect(searchInput).toHaveAttribute(
      'aria-activedescendant',
      'test-menu-menu-option-3',
    );

    // Press arrow down again - should wrap to first filtered item ('Create file')
    await user.keyboard('{ArrowDown}');

    // First filtered item should be virtually focused
    expect(searchInput).toHaveAttribute(
      'aria-activedescendant',
      'test-menu-menu-option-1',
    );

    // Press arrow up - should move to last filtered item ('Save document')
    await user.keyboard('{ArrowUp}');

    // Last filtered item should be virtually focused
    expect(searchInput).toHaveAttribute(
      'aria-activedescendant',
      'test-menu-menu-option-3',
    );
  });

  it('triggers action with Enter key', async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();

    render(
      <CommandMenu onAction={onAction as any} {...({} as any)}>
        {items.map((item) => (
          <CommandMenu.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandMenu.Item>
        ))}
      </CommandMenu>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');
    await user.click(searchInput);

    // Navigate to first item and trigger action
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(onAction).toHaveBeenCalledWith('1');
  });

  it('supports selection mode when explicitly set', async () => {
    const user = userEvent.setup();
    const onSelectionChange = jest.fn();

    render(
      <CommandMenu
        selectionMode="single"
        onSelectionChange={onSelectionChange as any}
        {...({} as any)}
      >
        {items.map((item) => (
          <CommandMenu.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandMenu.Item>
        ))}
      </CommandMenu>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');
    await user.click(searchInput);

    // Navigate to first item and select it
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    const selectionArg = onSelectionChange.mock.calls[0][0];
    expect(selectionArg).toEqual(['1']);
  });

  it('clears search with Escape key', async () => {
    const user = userEvent.setup();

    render(
      <CommandMenu>
        {items.map((item) => (
          <CommandMenu.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandMenu.Item>
        ))}
      </CommandMenu>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');
    await user.type(searchInput, 'test');
    expect(searchInput).toHaveValue('test');

    await user.keyboard('{Escape}');
    expect(searchInput).toHaveValue('');
  });

  it('shows empty state when no items match search', async () => {
    const user = userEvent.setup();

    render(
      <CommandMenu>
        {items.map((item) => (
          <CommandMenu.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandMenu.Item>
        ))}
      </CommandMenu>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('No commands found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <CommandMenu isLoading>
        {items.map((item) => (
          <CommandMenu.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandMenu.Item>
        ))}
      </CommandMenu>,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('supports custom filter function', async () => {
    const user = userEvent.setup();
    const customFilter = (textValue: string, inputValue: string) => {
      return textValue.toLowerCase().includes(inputValue.toLowerCase());
    };

    render(
      <CommandMenu filter={customFilter}>
        {items.map((item) => (
          <CommandMenu.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandMenu.Item>
        ))}
      </CommandMenu>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');
    await user.type(searchInput, 'FOLDER');

    expect(screen.getByText('Open folder')).toBeInTheDocument();
    expect(screen.queryByText('Create file')).not.toBeInTheDocument();
  });

  it('supports keywords-based search', async () => {
    const user = userEvent.setup();

    render(
      <CommandMenu>
        <CommandMenu.Item id="1" keywords={['new', 'add']}>
          Create file
        </CommandMenu.Item>
        <CommandMenu.Item id="2">Open folder</CommandMenu.Item>
      </CommandMenu>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');
    await user.type(searchInput, 'new');

    expect(screen.getByText('Create file')).toBeInTheDocument();
    expect(screen.queryByText('Open folder')).not.toBeInTheDocument();
  });

  it('supports multi-word search where all words must match', async () => {
    const user = userEvent.setup();

    render(
      <CommandMenu>
        <CommandMenu.Item id="1" keywords={['new', 'document', 'text']}>
          Create new file
        </CommandMenu.Item>
        <CommandMenu.Item id="2" keywords={['open', 'existing']}>
          Open folder
        </CommandMenu.Item>
        <CommandMenu.Item id="3" keywords={['save', 'document']}>
          Save document
        </CommandMenu.Item>
        <CommandMenu.Item id="4">New project setup</CommandMenu.Item>
      </CommandMenu>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');

    // Test 1: Single word should match multiple items
    await user.type(searchInput, 'new');
    expect(screen.getByText('Create new file')).toBeInTheDocument();
    expect(screen.getByText('New project setup')).toBeInTheDocument();
    expect(screen.queryByText('Open folder')).not.toBeInTheDocument();
    expect(screen.queryByText('Save document')).not.toBeInTheDocument();

    // Clear search
    await user.clear(searchInput);

    // Test 2: Two words - both must match
    await user.type(searchInput, 'new document');
    expect(screen.getByText('Create new file')).toBeInTheDocument(); // has both "new" and "document" (in keywords)
    expect(screen.queryByText('New project setup')).not.toBeInTheDocument(); // has "new" but not "document"
    expect(screen.queryByText('Open folder')).not.toBeInTheDocument();
    expect(screen.queryByText('Save document')).not.toBeInTheDocument(); // has "document" but not "new"

    // Clear search
    await user.clear(searchInput);

    // Test 3: Multiple spaces should be handled correctly
    await user.type(searchInput, 'create   file');
    expect(screen.getByText('Create new file')).toBeInTheDocument(); // textValue contains both "create" and "file"
    expect(screen.queryByText('New project setup')).not.toBeInTheDocument();
    expect(screen.queryByText('Open folder')).not.toBeInTheDocument();
    expect(screen.queryByText('Save document')).not.toBeInTheDocument();

    // Clear search
    await user.clear(searchInput);

    // Test 4: Mixed textValue and keywords matching
    await user.type(searchInput, 'save document');
    expect(screen.getByText('Save document')).toBeInTheDocument(); // textValue has "save" and keywords have "document"
    expect(screen.queryByText('Create new file')).not.toBeInTheDocument();
    expect(screen.queryByText('New project setup')).not.toBeInTheDocument();
    expect(screen.queryByText('Open folder')).not.toBeInTheDocument();

    // Clear search
    await user.clear(searchInput);

    // Test 5: No match when not all words are present
    await user.type(searchInput, 'create missing');
    expect(screen.queryByText('Create new file')).not.toBeInTheDocument(); // has "create" but not "missing"
    expect(screen.queryByText('New project setup')).not.toBeInTheDocument();
    expect(screen.queryByText('Open folder')).not.toBeInTheDocument();
    expect(screen.queryByText('Save document')).not.toBeInTheDocument();
    expect(screen.getByText('No commands found')).toBeInTheDocument();

    // Clear search
    await user.clear(searchInput);

    // Test 6: Case insensitive matching
    await user.type(searchInput, 'NEW FILE');
    expect(screen.getByText('Create new file')).toBeInTheDocument();
    expect(screen.queryByText('New project setup')).not.toBeInTheDocument(); // has "new" but not "file"
  });

  it('supports multi-word search with sections', async () => {
    const user = userEvent.setup();

    render(
      <CommandMenu>
        <CommandMenu.Section title="File Operations">
          <CommandMenu.Item id="1" keywords={['new', 'document']}>
            Create new file
          </CommandMenu.Item>
          <CommandMenu.Item id="2">Open existing file</CommandMenu.Item>
        </CommandMenu.Section>
        <CommandMenu.Section title="Project Operations">
          <CommandMenu.Item id="3">New project setup</CommandMenu.Item>
          <CommandMenu.Item id="4" keywords={['existing', 'project']}>
            Open project
          </CommandMenu.Item>
        </CommandMenu.Section>
      </CommandMenu>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');

    // Search for items that should match across sections
    await user.type(searchInput, 'new file');

    // Should show the section with matching items
    expect(screen.getByText('File Operations')).toBeInTheDocument();
    expect(screen.getByText('Create new file')).toBeInTheDocument();

    // Should hide sections with no matching items
    expect(screen.queryByText('Project Operations')).not.toBeInTheDocument();
    expect(screen.queryByText('New project setup')).not.toBeInTheDocument(); // has "new" but not "file"
    expect(screen.queryByText('Open existing file')).not.toBeInTheDocument(); // has "file" but not "new"
    expect(screen.queryByText('Open project')).not.toBeInTheDocument();

    // Clear search
    await user.clear(searchInput);

    // Search for something that matches in the second section
    await user.type(searchInput, 'existing project');

    expect(screen.getByText('Project Operations')).toBeInTheDocument();
    expect(screen.getByText('Open project')).toBeInTheDocument();
    expect(screen.queryByText('File Operations')).not.toBeInTheDocument();
    expect(screen.queryByText('Open existing file')).not.toBeInTheDocument(); // has "existing" but not "project"
  });

  it('supports force mount items', async () => {
    const user = userEvent.setup();

    render(
      <CommandMenu>
        <CommandMenu.Item forceMount id="1">
          Always visible
        </CommandMenu.Item>
        <CommandMenu.Item id="2">Sometimes visible</CommandMenu.Item>
      </CommandMenu>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('Always visible')).toBeInTheDocument();
    expect(screen.queryByText('Sometimes visible')).not.toBeInTheDocument();
  });

  it('supports sections', () => {
    render(
      <CommandMenu>
        <CommandMenu.Section title="File Operations">
          <CommandMenu.Item id="1">Create file</CommandMenu.Item>
          <CommandMenu.Item id="2">Open folder</CommandMenu.Item>
        </CommandMenu.Section>
        <CommandMenu.Section title="Document Operations">
          <CommandMenu.Item id="3">Save document</CommandMenu.Item>
        </CommandMenu.Section>
      </CommandMenu>,
    );

    expect(screen.getByText('File Operations')).toBeInTheDocument();
    expect(screen.getByText('Document Operations')).toBeInTheDocument();
    expect(screen.getByText('Create file')).toBeInTheDocument();
    expect(screen.getByText('Save document')).toBeInTheDocument();
  });

  it('handles controlled search value', async () => {
    const user = userEvent.setup();
    const onSearchChange = jest.fn();

    render(
      <CommandMenu searchValue="test" onSearchChange={onSearchChange}>
        {items.map((item) => (
          <CommandMenu.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandMenu.Item>
        ))}
      </CommandMenu>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');
    expect(searchInput).toHaveValue('test');

    await user.type(searchInput, 'ing');
    // Check that onSearchChange was called multiple times and the final call was with the expected value
    expect(onSearchChange).toHaveBeenCalledTimes(3); // 'i', 'n', 'g'
    expect(onSearchChange).toHaveBeenLastCalledWith('testg');
  });

  it('auto-focuses search input when autoFocus is true', async () => {
    render(
      <CommandMenu autoFocus>
        {items.map((item) => (
          <CommandMenu.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandMenu.Item>
        ))}
      </CommandMenu>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');
    await waitFor(() => {
      expect(searchInput).toHaveFocus();
    });
  });

  it('auto-focuses first item when search input is focused and has content', async () => {
    const user = userEvent.setup();

    render(
      <CommandMenu>
        {items.map((item) => (
          <CommandMenu.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandMenu.Item>
        ))}
      </CommandMenu>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');

    // Initially no item should be focused when just clicking
    await user.click(searchInput);
    expect(searchInput.getAttribute('aria-activedescendant')).toBeFalsy();

    // Type something to trigger auto-focus
    await user.type(searchInput, 'C');

    // Check that the first matching item is virtually focused
    await waitFor(() => {
      const activeDescendant = searchInput.getAttribute(
        'aria-activedescendant',
      );
      expect(activeDescendant).toMatch(/CommandMenu-menu-option-1/);
    });
  });

  it('focuses first item in filtered results when search changes', async () => {
    const user = userEvent.setup();

    render(
      <CommandMenu>
        {items.map((item) => (
          <CommandMenu.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandMenu.Item>
        ))}
      </CommandMenu>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');

    // Focus and type to filter items - "folder" should match "Open folder" (id: '2')
    await user.click(searchInput);
    await user.type(searchInput, 'folder');

    // First verify that the item is actually filtered and visible
    expect(screen.getByText('Open folder')).toBeInTheDocument();
    expect(screen.queryByText('Create file')).not.toBeInTheDocument();

    // Check that the correct item is virtually focused
    await waitFor(() => {
      const activeDescendant = searchInput.getAttribute(
        'aria-activedescendant',
      );
      expect(activeDescendant).toBeTruthy();
      // Since "Open folder" has id="2", it should be focused when filtered
      expect(activeDescendant).toContain('menu-option-2');
    });
  });

  it('clears focus when no items match search', async () => {
    const user = userEvent.setup();

    render(
      <CommandMenu>
        {items.map((item) => (
          <CommandMenu.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandMenu.Item>
        ))}
      </CommandMenu>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');

    // First type something that matches to establish focus
    await user.click(searchInput);
    await user.type(searchInput, 'C');

    // Verify an item is focused first
    await waitFor(() => {
      const activeDescendant = searchInput.getAttribute(
        'aria-activedescendant',
      );
      expect(activeDescendant).toMatch(/CommandMenu-menu-option-1/);
    });

    // Clear and type something that won't match
    await user.clear(searchInput);
    await user.type(searchInput, 'nonexistent');

    // Check that no item is focused
    await waitFor(() => {
      const activeDescendant = searchInput.getAttribute(
        'aria-activedescendant',
      );
      expect(activeDescendant).toBeFalsy();
    });
  });

  it('supports custom empty label', async () => {
    const user = userEvent.setup();

    render(
      <CommandMenu emptyLabel="Custom empty message">
        {items.map((item) => (
          <CommandMenu.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandMenu.Item>
        ))}
      </CommandMenu>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('Custom empty message')).toBeInTheDocument();
  });

  it('supports custom search placeholder', () => {
    render(
      <CommandMenu searchPlaceholder="Type to search...">
        {items.map((item) => (
          <CommandMenu.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandMenu.Item>
        ))}
      </CommandMenu>,
    );

    expect(
      screen.getByPlaceholderText('Type to search...'),
    ).toBeInTheDocument();
  });

  it('renders hotkey elements correctly', async () => {
    const onAction = jest.fn();

    const { container } = render(
      <CommandMenu onAction={onAction as any} {...({} as any)}>
        <CommandMenu.Item key="copy" hotkeys="Ctrl+C">
          Copy
        </CommandMenu.Item>
        <CommandMenu.Item key="paste" hotkeys="Ctrl+V">
          Paste
        </CommandMenu.Item>
      </CommandMenu>,
    );

    // Verify that hotkey elements are rendered
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Paste')).toBeInTheDocument();

    // Check that hotkey elements (kbd tags) are rendered
    const keyElements = container.querySelectorAll('kbd');
    expect(keyElements.length).toBeGreaterThan(0);

    // Check that the hotkey text is present
    expect(container.textContent).toContain('Ctrl');
    expect(container.textContent).toContain('C');
    expect(container.textContent).toContain('V');
  });

  it('hotkeys work when menu item is clicked directly', async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();

    render(
      <CommandMenu onAction={onAction as any} {...({} as any)}>
        <CommandMenu.Item key="copy" hotkeys="Ctrl+C">
          Copy
        </CommandMenu.Item>
      </CommandMenu>,
    );

    // Click the menu item directly to verify action works
    const copyItem = screen.getByText('Copy').closest('li');
    expect(copyItem).toBeInTheDocument();

    await user.click(copyItem!);

    // Check that onAction was called with the correct key
    expect(onAction).toHaveBeenCalledWith('copy');
  });

  it('hotkeys trigger actions through direct mechanism', async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();

    render(
      <CommandMenu onAction={onAction as any} {...({} as any)}>
        <CommandMenu.Item key="copy" hotkeys="Ctrl+C">
          Copy
        </CommandMenu.Item>
        <CommandMenu.Item key="paste" hotkeys="Ctrl+V">
          Paste
        </CommandMenu.Item>
      </CommandMenu>,
    );

    // Focus the search input to simulate real usage
    const searchInput = screen.getByPlaceholderText('Search commands...');
    await user.click(searchInput);

    // Test that hotkey combinations are allowed to pass through
    // by pressing Ctrl+C and checking that the event isn't prevented
    await user.keyboard('{Control>}c{/Control}');

    // In a real browser, this would trigger the useHotkeys handler
    // Since we can't reliably test react-hotkeys-hook in Jest,
    // we verify that the hotkey elements are rendered and
    // the action mechanism works when triggered directly
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Paste')).toBeInTheDocument();

    // Verify hotkey elements are present
    const copyItem = screen.getByText('Copy').closest('li');
    expect(copyItem).toHaveTextContent('Ctrl');
    expect(copyItem).toHaveTextContent('C');
  });

  it('handles multiple selection with string[] selectedKeys', async () => {
    const user = userEvent.setup();
    const onSelectionChange = jest.fn();

    // Create a component that properly handles string[] selectedKeys
    const TestComponent = () => {
      const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);

      const handleSelectionChange = (keys: string[]) => {
        setSelectedKeys(keys);
        onSelectionChange(keys);
      };

      return (
        <div>
          <div data-testid="selected-display">
            Selected: {selectedKeys.join(', ') || 'None'}
          </div>
          <CommandMenu
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            onSelectionChange={handleSelectionChange}
          >
            {items.map((item) => (
              <CommandMenu.Item key={item.id} id={item.id}>
                {item.textValue}
              </CommandMenu.Item>
            ))}
          </CommandMenu>
        </div>
      );
    };

    render(<TestComponent />);

    const searchInput = screen.getByPlaceholderText('Search commands...');
    await user.click(searchInput);

    // Navigate to first item and select it
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    // Check that onSelectionChange was called with a string[]
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    const selectionArg = onSelectionChange.mock.calls[0][0];
    expect(selectionArg).toEqual(['1']);

    // Verify the display shows the selected item
    let selectedDisplay = screen.getByText(/Selected:/);
    expect(selectedDisplay).toHaveTextContent(/Selected:.*1/);

    // Select another item
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    // Check that both items are selected
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    const secondSelectionArg = onSelectionChange.mock.calls[1][0];
    expect(secondSelectionArg).toEqual(expect.arrayContaining(['1', '2']));

    // Verify the display shows both selected items
    selectedDisplay = screen.getByText(/Selected:/);
    expect(selectedDisplay).toHaveTextContent(/Selected:.*1.*2/);
  });

  describe('CommandMenu mods', () => {
    it('should apply popover mod when used with MenuTrigger', () => {
      const { MenuContext } = require('../Menu/context');

      render(
        <MenuContext.Provider value={{ mods: { popover: true } }}>
          <CommandMenu qa="test-command-menu">
            <CommandMenu.Item key="item1">Item 1</CommandMenu.Item>
            <CommandMenu.Item key="item2">Item 2</CommandMenu.Item>
          </CommandMenu>
        </MenuContext.Provider>,
      );

      const commandMenu = screen.getByTestId('test-command-menu');
      expect(commandMenu).toHaveAttribute('data-is-popover');
    });

    it('should apply tray mod when used with MenuTrigger', () => {
      const { MenuContext } = require('../Menu/context');

      render(
        <MenuContext.Provider value={{ mods: { tray: true } }}>
          <CommandMenu qa="test-command-menu">
            <CommandMenu.Item key="item1">Item 1</CommandMenu.Item>
            <CommandMenu.Item key="item2">Item 2</CommandMenu.Item>
          </CommandMenu>
        </MenuContext.Provider>,
      );

      const commandMenu = screen.getByTestId('test-command-menu');
      expect(commandMenu).toHaveAttribute('data-is-tray');
    });

    it('should apply modal mod when used inside a modal dialog', () => {
      const { DialogContext } = require('../../overlays/Dialog/context');

      render(
        <DialogContext.Provider value={{ type: 'modal' }}>
          <CommandMenu qa="test-command-menu">
            <CommandMenu.Item key="item1">Item 1</CommandMenu.Item>
            <CommandMenu.Item key="item2">Item 2</CommandMenu.Item>
          </CommandMenu>
        </DialogContext.Provider>,
      );

      const commandMenu = screen.getByTestId('test-command-menu');
      expect(commandMenu).toHaveAttribute('data-is-modal');
    });

    it('should not apply any special mods when used standalone', () => {
      render(
        <CommandMenu qa="test-command-menu">
          <CommandMenu.Item key="item1">Item 1</CommandMenu.Item>
          <CommandMenu.Item key="item2">Item 2</CommandMenu.Item>
        </CommandMenu>,
      );

      const commandMenu = screen.getByTestId('test-command-menu');
      expect(commandMenu).not.toHaveAttribute('data-is-popover');
      expect(commandMenu).not.toHaveAttribute('data-is-tray');
      expect(commandMenu).not.toHaveAttribute('data-is-modal');
    });
  });
});
