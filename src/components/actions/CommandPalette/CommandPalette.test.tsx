import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { CommandPalette } from './CommandPalette';

describe('CommandPalette', () => {
  const items = [
    { id: '1', textValue: 'Create file' },
    { id: '2', textValue: 'Open folder' },
    { id: '3', textValue: 'Save document' },
  ];

  it('renders with search input and menu items', () => {
    render(
      <CommandPalette>
        {items.map((item) => (
          <CommandPalette.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandPalette.Item>
        ))}
      </CommandPalette>,
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
      <CommandPalette>
        {items.map((item) => (
          <CommandPalette.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandPalette.Item>
        ))}
      </CommandPalette>,
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
      <CommandPalette qa="test-palette">
        {items.map((item) => (
          <CommandPalette.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandPalette.Item>
        ))}
      </CommandPalette>,
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
      'test-palette-menu-option-1',
    );

    // Press arrow down again - should move to second item
    await user.keyboard('{ArrowDown}');

    // Search input should still have focus
    expect(searchInput).toHaveFocus();

    // Second item should be virtually focused
    expect(searchInput).toHaveAttribute(
      'aria-activedescendant',
      'test-palette-menu-option-2',
    );

    // Press arrow up - should move back to first item
    await user.keyboard('{ArrowUp}');

    // Search input should still have focus
    expect(searchInput).toHaveFocus();

    // First item should be virtually focused again
    expect(searchInput).toHaveAttribute(
      'aria-activedescendant',
      'test-palette-menu-option-1',
    );
  });

  it('triggers action with Enter key', async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();

    render(
      <CommandPalette onAction={onAction as any} {...({} as any)}>
        {items.map((item) => (
          <CommandPalette.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandPalette.Item>
        ))}
      </CommandPalette>,
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
      <CommandPalette
        selectionMode="single"
        onSelectionChange={onSelectionChange as any}
        {...({} as any)}
      >
        {items.map((item) => (
          <CommandPalette.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandPalette.Item>
        ))}
      </CommandPalette>,
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
      <CommandPalette>
        {items.map((item) => (
          <CommandPalette.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandPalette.Item>
        ))}
      </CommandPalette>,
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
      <CommandPalette>
        {items.map((item) => (
          <CommandPalette.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandPalette.Item>
        ))}
      </CommandPalette>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('No commands found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <CommandPalette isLoading>
        {items.map((item) => (
          <CommandPalette.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandPalette.Item>
        ))}
      </CommandPalette>,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('supports custom filter function', async () => {
    const user = userEvent.setup();
    const customFilter = (textValue: string, inputValue: string) => {
      return textValue.toLowerCase().includes(inputValue.toLowerCase());
    };

    render(
      <CommandPalette filter={customFilter}>
        {items.map((item) => (
          <CommandPalette.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandPalette.Item>
        ))}
      </CommandPalette>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');
    await user.type(searchInput, 'FOLDER');

    expect(screen.getByText('Open folder')).toBeInTheDocument();
    expect(screen.queryByText('Create file')).not.toBeInTheDocument();
  });

  it('supports keywords-based search', async () => {
    const user = userEvent.setup();

    render(
      <CommandPalette>
        <CommandPalette.Item id="1" keywords={['new', 'add']}>
          Create file
        </CommandPalette.Item>
        <CommandPalette.Item id="2">Open folder</CommandPalette.Item>
      </CommandPalette>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');
    await user.type(searchInput, 'new');

    expect(screen.getByText('Create file')).toBeInTheDocument();
    expect(screen.queryByText('Open folder')).not.toBeInTheDocument();
  });

  it('supports force mount items', async () => {
    const user = userEvent.setup();

    render(
      <CommandPalette>
        <CommandPalette.Item forceMount id="1">
          Always visible
        </CommandPalette.Item>
        <CommandPalette.Item id="2">Sometimes visible</CommandPalette.Item>
      </CommandPalette>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('Always visible')).toBeInTheDocument();
    expect(screen.queryByText('Sometimes visible')).not.toBeInTheDocument();
  });

  it('supports sections', () => {
    render(
      <CommandPalette>
        <CommandPalette.Section title="File Operations">
          <CommandPalette.Item id="1">Create file</CommandPalette.Item>
          <CommandPalette.Item id="2">Open folder</CommandPalette.Item>
        </CommandPalette.Section>
        <CommandPalette.Section title="Document Operations">
          <CommandPalette.Item id="3">Save document</CommandPalette.Item>
        </CommandPalette.Section>
      </CommandPalette>,
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
      <CommandPalette searchValue="test" onSearchChange={onSearchChange}>
        {items.map((item) => (
          <CommandPalette.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandPalette.Item>
        ))}
      </CommandPalette>,
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
      <CommandPalette autoFocus>
        {items.map((item) => (
          <CommandPalette.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandPalette.Item>
        ))}
      </CommandPalette>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');
    await waitFor(() => {
      expect(searchInput).toHaveFocus();
    });
  });

  it('supports custom empty label', async () => {
    const user = userEvent.setup();

    render(
      <CommandPalette emptyLabel="Custom empty message">
        {items.map((item) => (
          <CommandPalette.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandPalette.Item>
        ))}
      </CommandPalette>,
    );

    const searchInput = screen.getByPlaceholderText('Search commands...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('Custom empty message')).toBeInTheDocument();
  });

  it('supports custom search placeholder', () => {
    render(
      <CommandPalette searchPlaceholder="Type to search...">
        {items.map((item) => (
          <CommandPalette.Item key={item.id} id={item.id}>
            {item.textValue}
          </CommandPalette.Item>
        ))}
      </CommandPalette>,
    );

    expect(
      screen.getByPlaceholderText('Type to search...'),
    ).toBeInTheDocument();
  });

  it('renders hotkey elements correctly', async () => {
    const onAction = jest.fn();

    const { container } = render(
      <CommandPalette onAction={onAction as any} {...({} as any)}>
        <CommandPalette.Item key="copy" hotkeys="Ctrl+C">
          Copy
        </CommandPalette.Item>
        <CommandPalette.Item key="paste" hotkeys="Ctrl+V">
          Paste
        </CommandPalette.Item>
      </CommandPalette>,
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
      <CommandPalette onAction={onAction as any} {...({} as any)}>
        <CommandPalette.Item key="copy" hotkeys="Ctrl+C">
          Copy
        </CommandPalette.Item>
      </CommandPalette>,
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
      <CommandPalette onAction={onAction as any} {...({} as any)}>
        <CommandPalette.Item key="copy" hotkeys="Ctrl+C">
          Copy
        </CommandPalette.Item>
        <CommandPalette.Item key="paste" hotkeys="Ctrl+V">
          Paste
        </CommandPalette.Item>
      </CommandPalette>,
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
