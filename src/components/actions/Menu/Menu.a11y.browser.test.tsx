import { KeyboardEvent } from 'react';
import { flushSync } from 'react-dom';
import { userEvent } from 'vitest/browser';

import { act, render, screen, waitFor } from '../../../test';
import { Root } from '../../Root';
import { Button } from '../Button/Button';

import { MenuContext } from './context';
import { Menu } from './Menu';
import { MenuTrigger } from './MenuTrigger';

describe('Mixed menu accessibility', () => {
  it('puts link semantics, focus and description on the native destination', async () => {
    render(
      <Root>
        <Menu aria-label="Workbooks" autoFocus="first">
          <Menu.Item key="create">Create workbook</Menu.Item>
          <Menu.Item
            key="saved"
            to="/workbooks/saved"
            description="Open the saved workbook"
          >
            Saved workbook
          </Menu.Item>
        </Menu>
      </Root>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: 'Create workbook' }),
      ).toHaveFocus(),
    );
    await act(() => userEvent.keyboard('{ArrowDown}'));
    const destination = screen.getByRole('menuitem', {
      name: 'Saved workbook',
    });
    expect(destination.tagName).toBe('A');
    expect(destination).toHaveAttribute('href', '/workbooks/saved');
    expect(destination).toHaveFocus();
    expect(destination).not.toHaveAttribute('aria-hidden');
    expect(destination).toHaveAccessibleDescription('Open the saved workbook');
    expect(destination.closest('li')).toHaveAttribute('role', 'none');
  });

  it('visits independent command and link actions in the menu keyboard order', async () => {
    const create = vi.fn();
    const menuAction = vi.fn();
    const settings = vi.fn();
    const remove = vi.fn();
    const navigate = vi.fn();
    render(
      <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
        <MenuContext.Provider value={{ closeOnSelect: false }}>
          <Menu aria-label="Workbooks" autoFocus="first" onAction={menuAction}>
            <Menu.Item
              key="create"
              onAction={create}
              actions={
                <Menu.Item.Action
                  aria-label="Create settings"
                  onPress={settings}
                >
                  Settings
                </Menu.Item.Action>
              }
            >
              Create workbook
            </Menu.Item>
            <Menu.Item
              key="saved"
              to="/workbooks/saved"
              actions={
                <Menu.Item.Action
                  aria-label="Delete saved workbook"
                  onPress={remove}
                >
                  Delete
                </Menu.Item.Action>
              }
            >
              Saved workbook
            </Menu.Item>
            <Menu.Item key="last">Last command</Menu.Item>
          </Menu>
        </MenuContext.Provider>
        <button>After menu</button>
      </Root>,
    );
    const names = [
      'Create workbook',
      'Create settings',
      'Saved workbook',
      'Delete saved workbook',
      'Last command',
    ];
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: names[0] })).toHaveFocus(),
    );
    for (const name of names) {
      const item = screen.getByRole('menuitem', { name });
      expect(item).toHaveFocus();
      expect(item.parentElement?.closest('[role^="menuitem"]')).toBeNull();
      if (name !== names.at(-1))
        await act(() => userEvent.keyboard('{ArrowDown}'));
    }
    await act(() =>
      screen.getByRole('menuitem', { name: 'Create settings' }).focus(),
    );
    await act(() => userEvent.keyboard('{Enter}'));
    expect(settings).toHaveBeenCalledTimes(1);
    await act(() =>
      screen.getByRole('menuitem', { name: 'Delete saved workbook' }).focus(),
    );
    await act(() => userEvent.keyboard(' '));
    expect(remove).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
    expect(menuAction).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    await act(() => userEvent.keyboard('{Tab}'));
    expect(screen.getByRole('button', { name: 'After menu' })).toHaveFocus();
  });
  it.each([
    ['Plain command', 'ArrowDown', 'Command with action'],
    ['Command with action', 'ArrowDown', 'Command settings'],
    ['Destination', 'Home', 'Plain command'],
    ['Command with action', 'End', 'Last command'],
  ])(
    'forwards keyboard consumers before moving from %s with %s',
    async (origin, key, target) => {
      const observed: Array<{
        handler: string;
        currentTarget: string;
        focus: Element | null;
      }> = [];
      const record = (handler: string) => (event: KeyboardEvent<HTMLElement>) =>
        observed.push({
          handler,
          currentTarget: event.currentTarget.tagName,
          focus: document.activeElement,
        });
      render(
        <Root>
          <Menu
            aria-label="Keyboard consumers"
            {...{ onKeyDown: record('menu') }}
          >
            <Menu.Item key="plain" onKeyDown={record('plain')}>
              Plain command
            </Menu.Item>
            <Menu.Item
              key="command"
              onKeyDown={record('command')}
              actions={
                <Menu.Item.Action aria-label="Command settings">
                  Settings
                </Menu.Item.Action>
              }
            >
              Command with action
            </Menu.Item>
            <Menu.Item key="link" to="/destination" onKeyDown={record('link')}>
              Destination
            </Menu.Item>
            <Menu.Item key="last">Last command</Menu.Item>
          </Menu>
        </Root>,
      );
      const primary = screen.getByRole('menuitem', { name: origin });
      await act(() => primary.focus());
      await act(() => userEvent.keyboard(`{${key}}`));
      expect(observed).toEqual([
        {
          handler:
            origin === 'Plain command'
              ? 'plain'
              : origin === 'Destination'
                ? 'link'
                : 'command',
          currentTarget: 'LI',
          focus: primary,
        },
        { handler: 'menu', currentTarget: 'UL', focus: primary },
      ]);
      expect(screen.getByRole('menuitem', { name: target })).toHaveFocus();
    },
  );

  it.each(['item', 'menu'] as const)(
    'honors %s keyboard cancellation before inline navigation',
    async (owner) => {
      const itemKey = vi.fn((event) => {
        if (owner === 'item') event.preventDefault();
      });
      const menuKey = vi.fn((event) => {
        if (owner === 'menu') event.preventDefault();
      });
      render(
        <Root>
          <Menu aria-label="Consumer cancellation" {...{ onKeyDown: menuKey }}>
            <Menu.Item
              key="command"
              onKeyDown={itemKey}
              actions={
                <Menu.Item.Action aria-label="Command settings">
                  Settings
                </Menu.Item.Action>
              }
            >
              Command
            </Menu.Item>
            <Menu.Item key="last">Last command</Menu.Item>
          </Menu>
        </Root>,
      );
      const primary = screen.getByRole('menuitem', { name: 'Command' });
      await act(() => primary.focus());
      await act(() => userEvent.keyboard('{ArrowDown}'));
      expect(itemKey).toHaveBeenCalledTimes(1);
      expect(menuKey).toHaveBeenCalledTimes(1);
      expect(primary).toHaveFocus();
    },
  );

  it.each(['single', 'multiple'] as const)(
    'keeps %s selection semantics and Space close policy on the primary control',
    async (selectionMode) => {
      const commandAction = vi.fn();
      const menuAction = vi.fn();
      const selectionChange = vi.fn();
      const close = vi.fn();
      const navigate = vi.fn();
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <Menu
            aria-label="Selection"
            selectionMode={selectionMode}
            defaultSelectedKeys={['command']}
            onSelectionChange={selectionChange}
            onAction={menuAction}
            onClose={close}
          >
            <Menu.Item
              key="command"
              onAction={commandAction}
              actions={
                <Menu.Item.Action aria-label="Pin command">
                  Pin
                </Menu.Item.Action>
              }
            >
              Command
            </Menu.Item>
            <Menu.Item
              key="link"
              to="/workbooks/saved"
              actions={
                <Menu.Item.Action aria-label="Delete saved workbook">
                  Delete
                </Menu.Item.Action>
              }
            >
              Saved workbook
            </Menu.Item>
          </Menu>
        </Root>,
      );
      const role =
        selectionMode === 'single' ? 'menuitemradio' : 'menuitemcheckbox';
      const command = screen.getByRole(role, { name: 'Command' });
      const destination = screen.getByRole('menuitem', {
        name: 'Saved workbook',
      });
      expect(command.tagName).toBe('A');
      expect(destination.tagName).toBe('A');
      expect(command).toHaveAttribute('aria-checked', 'true');
      expect(destination).not.toHaveAttribute('aria-checked');
      for (const primary of [command, destination]) {
        expect(primary.closest('li')).toHaveAttribute('role', 'none');
        expect(primary.closest('li')).not.toHaveAttribute('aria-checked');
      }
      for (const name of ['Pin command', 'Delete saved workbook']) {
        const action = screen.getByRole('menuitem', { name });
        expect(action).not.toHaveAttribute('aria-checked');
        expect(action.parentElement?.closest('[role^="menuitem"]')).toBeNull();
      }
      await act(() => command.focus());
      await act(() => userEvent.keyboard(' '));
      expect(command).toHaveAttribute('aria-checked', 'false');
      expect(selectionChange).toHaveBeenCalledExactlyOnceWith([]);
      expect(commandAction).toHaveBeenCalledTimes(1);
      expect(menuAction).toHaveBeenCalledExactlyOnceWith('command');
      expect(close).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();

      await act(() => destination.focus());
      await act(() => userEvent.keyboard(' '));
      expect(destination).not.toHaveAttribute('aria-checked');
      expect(selectionChange).toHaveBeenCalledTimes(1);
      expect(commandAction).toHaveBeenCalledTimes(1);
      expect(menuAction.mock.calls).toEqual([['command'], ['link']]);
      expect(close).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledExactlyOnceWith(
        '/workbooks/saved',
        undefined,
      );
    },
  );

  it.each(['item', 'keys'] as const)(
    'suppresses a disabled composed destination and skips its actions (disabled by %s)',
    async (disabledBy) => {
      const itemAction = vi.fn();
      const actionPress = vi.fn();
      const menuAction = vi.fn();
      const navigate = vi.fn();
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <Menu
            aria-label="Disabled workbooks"
            autoFocus="first"
            disabledKeys={disabledBy === 'keys' ? ['disabled'] : undefined}
            onAction={menuAction}
          >
            <Menu.Item key="first">First command</Menu.Item>
            <Menu.Item
              key="disabled"
              to="/unavailable"
              isDisabled={disabledBy === 'item'}
              onAction={itemAction}
              actions={
                <Menu.Item.Action
                  aria-label="Delete unavailable workbook"
                  onPress={actionPress}
                >
                  Delete
                </Menu.Item.Action>
              }
            >
              Unavailable workbook
            </Menu.Item>
            <Menu.Item key="last" to="/available">
              Available workbook
            </Menu.Item>
          </Menu>
        </Root>,
      );
      const primary = screen.getByRole('menuitem', {
        name: 'Unavailable workbook',
      });
      const action = screen.getByRole('menuitem', {
        name: 'Delete unavailable workbook',
      });
      expect(primary.tagName).toBe('A');
      expect(primary).toHaveAttribute('aria-disabled', 'true');
      expect(primary).not.toHaveAttribute('href');
      expect(primary.closest('li')).toHaveAttribute('role', 'none');
      expect(action).toBeDisabled();
      await waitFor(() =>
        expect(
          screen.getByRole('menuitem', { name: 'First command' }),
        ).toHaveFocus(),
      );
      await act(() => userEvent.keyboard('{ArrowDown}'));
      expect(
        screen.getByRole('menuitem', { name: 'Available workbook' }),
      ).toHaveFocus();
      await act(() => userEvent.click(primary, { force: true }));
      await act(() => userEvent.click(action, { force: true }));
      expect(itemAction).not.toHaveBeenCalled();
      expect(actionPress).not.toHaveBeenCalled();
      expect(menuAction).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    },
  );

  it('keeps submenu inline shortcuts separate from its primary trigger', async () => {
    const menuKey = vi.fn();
    const itemKey = vi.fn();
    render(
      <Root>
        <Menu
          aria-label="Parent shortcuts"
          styles={{ width: '32x' }}
          {...{ onKeyDown: menuKey }}
        >
          <Menu.SubMenuTrigger>
            <Menu.Item
              key="share"
              onKeyDown={itemKey}
              actions={
                <Menu.Item.Action aria-label="Share settings">
                  Settings
                </Menu.Item.Action>
              }
            >
              Share
            </Menu.Item>
            <Menu aria-label="Share submenu">
              <Menu.Item key="copy">Copy link</Menu.Item>
            </Menu>
          </Menu.SubMenuTrigger>
        </Menu>
      </Root>,
    );
    const primary = screen.getByRole('menuitem', { name: 'Share' });
    const action = screen.getByRole('menuitem', { name: 'Share settings' });
    await act(() => action.focus());
    await act(() => userEvent.keyboard('{ArrowRight}'));
    expect(action).toHaveFocus();
    expect(screen.queryByRole('menu', { name: 'Share submenu' })).toBeNull();
    expect(itemKey).toHaveBeenCalledTimes(1);
    expect(menuKey).toHaveBeenCalledTimes(1);
    await act(() => userEvent.keyboard('{ArrowLeft}'));
    expect(primary).toHaveFocus();
    expect(itemKey).toHaveBeenCalledTimes(2);
    expect(menuKey).toHaveBeenCalledTimes(2);
    await act(() => userEvent.keyboard('{ArrowRight}'));
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'Copy link' })).toHaveFocus(),
    );
    expect(itemKey).toHaveBeenCalledTimes(3);
    // The submenu trigger owns its opening key and stops bubbling to the menu.
    expect(menuKey).toHaveBeenCalledTimes(2);
  });

  it('opens a submenu with inline actions on Right and restores its primary control on Escape', async () => {
    const itemAction = vi.fn();
    const menuAction = vi.fn();
    const settings = vi.fn();
    render(
      <Root>
        <MenuTrigger>
          <Button>Open menu</Button>
          <Menu aria-label="Parent menu" onAction={menuAction}>
            <Menu.SubMenuTrigger>
              <Menu.Item
                key="share"
                onAction={itemAction}
                actions={
                  <Menu.Item.Action
                    aria-label="Share settings"
                    onPress={settings}
                  >
                    Settings
                  </Menu.Item.Action>
                }
              >
                Share
              </Menu.Item>
              <Menu aria-label="Share submenu">
                <Menu.Item key="copy">Copy link</Menu.Item>
              </Menu>
            </Menu.SubMenuTrigger>
          </Menu>
        </MenuTrigger>
      </Root>,
    );
    await act(() =>
      userEvent.click(screen.getByRole('button', { name: 'Open menu' })),
    );
    const primary = await screen.findByRole('menuitem', {
      name: 'Share',
    });
    const parentMenu = primary.closest('[role="menu"]')!;
    expect(primary.tagName).toBe('A');
    expect(primary).toHaveAttribute('aria-haspopup', 'menu');
    await waitFor(() => expect(primary).toHaveFocus());
    await act(() => userEvent.keyboard('{ArrowRight}'));
    const child = await screen.findByRole('menuitem', { name: 'Copy link' });
    const childMenu = child.closest('[role="menu"]')!;
    await waitFor(() => expect(child).toHaveFocus());
    expect(primary).toHaveAttribute('aria-expanded', 'true');
    await act(() => userEvent.keyboard('{Escape}'));
    await waitFor(() => expect(primary).toHaveFocus());
    await waitFor(() => expect(childMenu).not.toBeInTheDocument());
    expect(primary).toHaveAttribute('aria-expanded', 'false');
    await act(() =>
      screen.getByRole('menuitem', { name: 'Share settings' }).focus(),
    );
    await act(() => userEvent.keyboard('{Enter}'));
    expect(settings).toHaveBeenCalledTimes(1);
    expect(itemAction).not.toHaveBeenCalled();
    expect(menuAction).not.toHaveBeenCalled();
    expect(parentMenu).toBeInTheDocument();
  });

  it.each([false, true])(
    'honors shouldFocusWrap=%s across primary controls and inline actions',
    async (shouldFocusWrap) => {
      render(
        <Root>
          <Menu
            aria-label="Wrap policy"
            autoFocus="first"
            shouldFocusWrap={shouldFocusWrap}
          >
            <Menu.Item
              key="first"
              actions={
                <Menu.Item.Action aria-label="First action">
                  Action
                </Menu.Item.Action>
              }
            >
              First command
            </Menu.Item>
            <Menu.Item
              key="last"
              to="/last"
              actions={
                <Menu.Item.Action aria-label="Last action">
                  Action
                </Menu.Item.Action>
              }
            >
              Last destination
            </Menu.Item>
          </Menu>
        </Root>,
      );
      const first = screen.getByRole('menuitem', { name: 'First command' });
      const lastAction = screen.getByRole('menuitem', { name: 'Last action' });
      expect(first.tagName).toBe('A');
      await waitFor(() => expect(first).toHaveFocus());
      await act(() => userEvent.keyboard('{ArrowUp}'));
      expect(shouldFocusWrap ? lastAction : first).toHaveFocus();
      await act(() => userEvent.keyboard('{End}'));
      expect(lastAction).toHaveFocus();
      await act(() => userEvent.keyboard('{ArrowDown}'));
      expect(shouldFocusWrap ? first : lastAction).toHaveFocus();
      await act(() => userEvent.keyboard('{Home}'));
      expect(first).toHaveFocus();
    },
  );

  it('uses visual RTL direction for primary and inline action shortcuts', async () => {
    render(
      <Root locale="ar">
        <div dir="rtl">
          <Menu aria-label="RTL actions" autoFocus="first">
            <Menu.Item
              key="row"
              actions={
                <Menu.Item.Action aria-label="Row settings">
                  Settings
                </Menu.Item.Action>
              }
            >
              Row command
            </Menu.Item>
          </Menu>
        </div>
      </Root>,
    );
    const primary = screen.getByRole('menuitem', { name: 'Row command' });
    const action = screen.getByRole('menuitem', { name: 'Row settings' });
    expect(primary.tagName).toBe('A');
    await waitFor(() => expect(primary).toHaveFocus());
    expect(getComputedStyle(primary.closest('li')!).direction).toBe('rtl');
    await act(() => userEvent.keyboard('{ArrowLeft}'));
    expect(action).toHaveFocus();
    await act(() => userEvent.keyboard('{ArrowRight}'));
    expect(primary).toHaveFocus();
  });

  it('continues collection typeahead from an inline action without activating it', async () => {
    const actionPress = vi.fn();
    const menuAction = vi.fn();
    const navigate = vi.fn();
    render(
      <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
        <Menu
          aria-label="Searchable rows"
          autoFocus="first"
          onAction={menuAction}
        >
          <Menu.Item
            key="alpha"
            to="/alpha"
            actions={
              <Menu.Item.Action
                aria-label="Alpha settings"
                onPress={actionPress}
              >
                Settings
              </Menu.Item.Action>
            }
          >
            Alpha workbook
          </Menu.Item>
          <Menu.Item key="beta">Beta command</Menu.Item>
        </Menu>
      </Root>,
    );
    const primary = screen.getByRole('menuitem', { name: 'Alpha workbook' });
    const action = screen.getByRole('menuitem', { name: 'Alpha settings' });
    expect(primary.tagName).toBe('A');
    await waitFor(() => expect(primary).toHaveFocus());
    await act(() => userEvent.keyboard('{ArrowDown}'));
    expect(action).toHaveFocus();
    await act(() => userEvent.keyboard('b'));
    expect(
      screen.getByRole('menuitem', { name: 'Beta command' }),
    ).toHaveFocus();
    expect(actionPress).not.toHaveBeenCalled();
    expect(menuAction).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
  it('restores primary focus through tooltip remounts and opens its tooltip from the keyboard', async () => {
    const navigate = vi.fn();
    const content = (tooltip: boolean) => (
      <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
        <Menu aria-label="Tooltip destinations">
          <Menu.Item
            key="saved"
            to="/workbooks/saved"
            tooltip={
              tooltip ? { title: 'Saved workbook help', delay: 0 } : false
            }
          >
            Saved workbook
          </Menu.Item>
        </Menu>
        <button>After tooltip menu</button>
      </Root>
    );
    const { rerender } = render(content(false));
    const primary = () =>
      screen.getByRole('menuitem', { name: 'Saved workbook' });
    expect(primary().tagName).toBe('A');
    await act(() => userEvent.tab());
    expect(primary()).toHaveFocus();
    await act(() => {
      flushSync(() => rerender(content(true)));
      expect(primary()).toHaveFocus();
    });
    await act(() => userEvent.tab());
    expect(
      screen.getByRole('button', { name: 'After tooltip menu' }),
    ).toHaveFocus();
    await act(() => userEvent.keyboard('{Shift>}{Tab}{/Shift}'));
    expect(primary()).toHaveFocus();
    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveTextContent(
        'Saved workbook help',
      ),
    );
    await act(() => {
      flushSync(() => rerender(content(false)));
      expect(primary()).toHaveFocus();
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
  it.each(['navigation', 'inline command'] as const)(
    'keeps consumer semantic props and focus callbacks on the %s primary',
    async (kind) => {
      const focusedTargets: EventTarget[] = [];
      const blurredTargets: EventTarget[] = [];
      const onFocus = vi.fn((event) =>
        focusedTargets.push(event.currentTarget),
      );
      const onBlur = vi.fn((event) => blurredTargets.push(event.currentTarget));
      const controlFocus = vi.fn();
      const controlBlur = vi.fn();
      render(
        <Root>
          <p id="primary-guidance">External primary guidance</p>
          <p id="control-guidance">External control guidance</p>
          <Menu aria-label="Consumer semantics">
            <Menu.Item
              key="primary"
              to={kind === 'navigation' ? '/workbooks/saved' : undefined}
              aria-label="Consumer primary name"
              aria-describedby="primary-guidance"
              aria-description="Primary fallback description"
              onFocus={onFocus}
              onBlur={onBlur}
              actions={
                kind === 'inline command' ? (
                  <Menu.Item.Action aria-label="Consumer secondary action">
                    Secondary action
                  </Menu.Item.Action>
                ) : undefined
              }
            >
              Primary contents
            </Menu.Item>
            <Menu.Item
              key="control"
              aria-label="Consumer control name"
              aria-labelledby=""
              aria-describedby="control-guidance"
              aria-description="Control fallback description"
              onFocus={controlFocus}
              onBlur={controlBlur}
            >
              Control contents
            </Menu.Item>
          </Menu>
          <button>After consumer menu</button>
        </Root>,
      );
      const control = screen.getByRole('menuitem', {
        name: 'Consumer control name',
      });
      const primary = screen.getByRole('menuitem', {
        name: 'Consumer primary name',
      });
      const after = screen.getByRole('button', { name: 'After consumer menu' });
      expect(control.tagName).toBe('LI');
      expect(control).toHaveAccessibleName('Consumer control name');
      expect(control).toHaveAccessibleDescription('External control guidance');
      expect(control).toHaveAttribute(
        'aria-description',
        'Control fallback description',
      );
      await act(() => control.focus());
      await act(() => after.focus());
      expect(controlFocus).toHaveBeenCalledTimes(1);
      expect(controlBlur).toHaveBeenCalledTimes(1);

      expect(primary.tagName).toBe('A');
      expect(primary).toHaveAttribute('aria-label', 'Consumer primary name');
      expect(primary).toHaveAccessibleName('Consumer primary name');
      expect(primary).toHaveAccessibleDescription('External primary guidance');
      expect(primary).toHaveAttribute(
        'aria-description',
        'Primary fallback description',
      );
      expect(primary.getAttribute('aria-describedby')?.split(' ')).toContain(
        'primary-guidance',
      );
      await act(() => primary.focus());
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(focusedTargets).toEqual([primary]);
      await act(() => after.focus());
      expect(onBlur).toHaveBeenCalledTimes(1);
      expect(blurredTargets).toEqual([primary]);
    },
  );
});
