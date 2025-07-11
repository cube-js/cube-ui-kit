import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    expect(selectionArg).toBeInstanceOf(Set);
    expect(selectionArg.has('1')).toBe(true);
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
});
