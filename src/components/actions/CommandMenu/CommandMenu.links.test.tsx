import userEvent from '@testing-library/user-event';

import { act, fireEvent, render, screen, waitFor } from '../../../test';
import { Root } from '../../Root';
import { MenuContext } from '../Menu/context';

import { CommandMenu } from './CommandMenu';

describe('CommandMenu navigation items', () => {
  it.each(['command', 'to', 'href'])(
    'forwards a %s item keyboard handler once from the search input',
    async (kind) => {
      const user = userEvent.setup();
      const onKeyDown = vi.fn();
      const itemAction = vi.fn();
      const menuAction = vi.fn();
      const navigate = vi.fn();
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <CommandMenu onAction={menuAction}>
            <CommandMenu.Item
              key="workbook"
              tooltip={false}
              onKeyDown={onKeyDown}
              onAction={itemAction}
              {...(kind === 'to'
                ? { to: '/workbooks/keyboard' }
                : kind === 'href'
                  ? { href: '/workbooks/keyboard' }
                  : {})}
            >
              Workbook
            </CommandMenu.Item>
          </CommandMenu>
        </Root>,
      );
      const search = screen.getByRole('searchbox');
      await user.click(search);
      await user.keyboard('{ArrowDown}{Enter}');
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onKeyDown.mock.calls[0][0].key).toBe('Enter');
      expect(itemAction).toHaveBeenCalledExactlyOnceWith();
      expect(menuAction).toHaveBeenCalledExactlyOnceWith('workbook');
      expect(search).toHaveFocus();
      if (kind === 'to' || kind === 'href')
        expect(navigate).toHaveBeenCalledExactlyOnceWith(
          '/workbooks/keyboard',
          undefined,
        );
      else expect(navigate).not.toHaveBeenCalled();
    },
  );

  it.each(['command', 'to', 'href'])(
    'preserves a consumer-provided accessible label on a %s item',
    async (kind) => {
      const user = userEvent.setup();
      render(
        <Root>
          <span id="workbook-item-label">Open quarterly workbook</span>
          <CommandMenu>
            <CommandMenu.Item
              key="workbook"
              aria-labelledby="workbook-item-label"
              {...(kind === 'to'
                ? { to: '/workbooks/quarterly' }
                : kind === 'href'
                  ? { href: '/workbooks/quarterly' }
                  : {})}
            >
              Quarterly
            </CommandMenu.Item>
          </CommandMenu>
        </Root>,
      );
      const search = screen.getByRole('searchbox');
      await user.click(search);
      await user.keyboard('{ArrowDown}');
      const item = screen.getByRole('menuitem', {
        name: 'Open quarterly workbook',
      });
      expect(item).toHaveAttribute('aria-labelledby', 'workbook-item-label');
      expect(search).toHaveAttribute('aria-activedescendant', item.id);
    },
  );

  it.each(['Enter', ' '])(
    'activates a section link through the shared item pipeline with %s',
    async (key) => {
      const user = userEvent.setup();
      const calls: string[] = [];
      const itemAction = vi.fn(() => calls.push('item'));
      const menuAction = vi.fn(() => calls.push('menu'));
      const close = vi.fn(() => calls.push('close'));
      const navigate = vi.fn(() => calls.push('navigate'));
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <MenuContext.Provider value={{ onClose: close }}>
            <CommandMenu onAction={menuAction}>
              <CommandMenu.Section title="Workbooks">
                <CommandMenu.Item
                  key="saved"
                  to="/workbooks/saved"
                  navigationOptions={{ replace: true, state: { from: 'menu' } }}
                  onAction={itemAction}
                >
                  Saved workbook
                </CommandMenu.Item>
              </CommandMenu.Section>
            </CommandMenu>
          </MenuContext.Provider>
        </Root>,
      );
      const search = screen.getByPlaceholderText('Search commands...');
      await user.click(search);
      await user.keyboard('{ArrowDown}');
      const item = screen.getByRole('menuitem', { name: 'Saved workbook' });
      expect(item.tagName).toBe('A');
      expect(item).toHaveAttribute('href', '/workbooks/saved');
      await user.keyboard(key === 'Enter' ? '{Enter}' : ' ');
      expect(itemAction).toHaveBeenCalledExactlyOnceWith();
      expect(menuAction).toHaveBeenCalledExactlyOnceWith('saved');
      expect(close).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledExactlyOnceWith('/workbooks/saved', {
        replace: true,
        state: { from: 'menu' },
      });
      expect(calls).toEqual(['item', 'menu', 'close', 'navigate']);
      expect(search).toHaveFocus();
      expect(item.closest('li')).not.toHaveAttribute('data-pressed');
    },
  );

  it('composes item and menu callbacks for commands in item-first order', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const itemAction = vi.fn(() => calls.push('item'));
    const menuAction = vi.fn(() => calls.push('menu'));
    render(
      <Root>
        <CommandMenu onAction={menuAction}>
          <CommandMenu.Item key="create" onAction={itemAction}>
            Create workbook
          </CommandMenu.Item>
        </CommandMenu>
      </Root>,
    );
    await user.click(screen.getByPlaceholderText('Search commands...'));
    await user.keyboard('{ArrowDown}{Enter}');
    expect(itemAction).toHaveBeenCalledExactlyOnceWith();
    expect(menuAction).toHaveBeenCalledExactlyOnceWith('create');
    expect(calls).toEqual(['item', 'menu']);
  });

  it('keeps valid active-descendant references unique between palettes', async () => {
    const user = userEvent.setup();
    render(
      <Root>
        <CommandMenu searchPlaceholder="First palette">
          <CommandMenu.Item key="same" to="/first">
            First workbook
          </CommandMenu.Item>
        </CommandMenu>
        <CommandMenu searchPlaceholder="Second palette">
          <CommandMenu.Section title="Recent">
            <CommandMenu.Item key="same" to="/second">
              Second workbook
            </CommandMenu.Item>
          </CommandMenu.Section>
        </CommandMenu>
      </Root>,
    );
    const first = screen.getByRole('searchbox', { name: 'First palette' });
    const second = screen.getByRole('searchbox', { name: 'Second palette' });
    await user.click(first);
    await user.keyboard('{ArrowDown}');
    await user.click(second);
    await user.keyboard('{ArrowDown}');
    const firstId = first.getAttribute('aria-activedescendant');
    const secondId = second.getAttribute('aria-activedescendant');
    expect(firstId).toBeTruthy();
    expect(secondId).toBeTruthy();
    expect(firstId).not.toBe(secondId);
    expect(document.getElementById(firstId!)).toBe(
      screen.getByRole('menuitem', { name: 'First workbook' }),
    );
    expect(document.getElementById(secondId!)).toBe(
      screen.getByRole('menuitem', { name: 'Second workbook' }),
    );
    for (const search of [first, second]) {
      const menu = document.getElementById(
        search.getAttribute('aria-controls')!,
      );
      expect(menu).toHaveAttribute('role', 'menu');
      expect(menu).toContainElement(
        document.getElementById(search.getAttribute('aria-activedescendant')!),
      );
      expect(search).not.toHaveAttribute('aria-expanded');
      expect(search).not.toHaveAttribute('aria-haspopup', 'listbox');
    }
  });

  it('selects commands and leaves navigation items unselected', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const navigate = vi.fn();
    const onAction = vi.fn();
    render(
      <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
        <CommandMenu
          selectionMode="multiple"
          onSelectionChange={onSelectionChange}
          onAction={onAction}
        >
          <CommandMenu.Item key="create">Create workbook</CommandMenu.Item>
          <CommandMenu.Item key="saved" to="/workbooks/saved">
            Saved workbook
          </CommandMenu.Item>
        </CommandMenu>
      </Root>,
    );
    await user.click(screen.getByPlaceholderText('Search commands...'));
    const destination = screen.getByRole('menuitem', {
      name: 'Saved workbook',
    });
    expect(destination.tagName).toBe('A');
    expect(destination).toHaveAttribute('href', '/workbooks/saved');
    expect(destination).toHaveAttribute('role', 'menuitem');
    expect(destination).not.toHaveAttribute('aria-checked');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(['create']);
    expect(onAction).toHaveBeenCalledExactlyOnceWith('create');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(navigate).toHaveBeenCalledExactlyOnceWith(
      '/workbooks/saved',
      undefined,
    );
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenNthCalledWith(2, 'saved');
  });

  it('does not activate an item during composition or on a repeated key', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <Root>
        <CommandMenu onAction={onAction}>
          <CommandMenu.Item key="create">Create workbook</CommandMenu.Item>
        </CommandMenu>
      </Root>,
    );
    const search = screen.getByPlaceholderText('Search commands...');
    await user.click(search);
    await user.keyboard('{ArrowDown}');
    await act(() => {
      fireEvent.keyDown(search, { key: 'Enter', isComposing: true });
      fireEvent.keyDown(search, { key: 'Enter', repeat: true });
      fireEvent.keyDown(search, { key: ' ', repeat: true });
    });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('skips disabled navigation items and never routes them', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    const onAction = vi.fn();
    render(
      <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
        <CommandMenu onAction={onAction}>
          <CommandMenu.Item key="disabled" to="/private" isDisabled>
            Unavailable workbook
          </CommandMenu.Item>
          <CommandMenu.Item key="create">Create workbook</CommandMenu.Item>
        </CommandMenu>
      </Root>,
    );
    const search = screen.getByRole('searchbox');
    const disabled = screen.getByRole('menuitem', {
      name: 'Unavailable workbook',
    });
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    expect(disabled).not.toHaveAttribute('href');
    await user.click(search);
    await user.keyboard('{ArrowDown}');
    expect(search).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('menuitem', { name: 'Create workbook' }).id,
    );
    await user.keyboard('{Enter}');
    expect(onAction).toHaveBeenCalledExactlyOnceWith('create');
    expect(navigate).not.toHaveBeenCalled();
    await user.click(disabled);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('clears menu relationships while loading or showing an empty result', async () => {
    const user = userEvent.setup();
    const view = (
      props: { isLoading?: boolean; searchValue?: string } = {},
    ) => (
      <Root>
        <CommandMenu {...props}>
          <CommandMenu.Item key="saved" to="/saved">
            Saved workbook
          </CommandMenu.Item>
        </CommandMenu>
      </Root>
    );
    const { rerender } = render(view());
    const search = screen.getByRole('searchbox');
    await user.click(search);
    await user.keyboard('{ArrowDown}');
    expect(search).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('menuitem', { name: 'Saved workbook' }).id,
    );
    rerender(view({ isLoading: true }));
    expect(search).not.toHaveAttribute('aria-activedescendant');
    expect(search).not.toHaveAttribute('aria-controls');
    rerender(view({ searchValue: 'Missing' }));
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(search).not.toHaveAttribute('aria-activedescendant');
    expect(search).not.toHaveAttribute('aria-controls');
  });
});
