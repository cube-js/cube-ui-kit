import { createRef, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { userEvent } from 'vitest/browser';

import { MoreIcon } from '../../../icons/MoreIcon';
import { act, render, screen, waitFor } from '../../../test';
import { Root } from '../../Root';
import { CommandMenu } from '../CommandMenu/CommandMenu';

import { MenuContext } from './context';
import { Menu } from './Menu';

describe('Stable visible native menu targets', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-menu-label');
  });

  it('tracks an existing ancestor becoming a query container before a sibling resize', async () => {
    const settleLayout = () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    render(
      <Root>
        <style>
          {
            '@container (max-width:300px) { [data-qa="query-target"] [data-element="Label"] { visibility:hidden; } }'
          }
        </style>
        <div style={{ width: '600px', display: 'flex' }}>
          <div data-qa="query-container" style={{ flex: 1, minWidth: 0 }}>
            <Menu aria-label="Container changes" styles={{ width: '32x' }}>
              <Menu.Item key="command" tooltip={false}>
                Command
              </Menu.Item>
              <Menu.Item
                key="workbook"
                qa="query-target"
                to="/destination"
                tooltip={false}
                description="Visible description"
                styles={{
                  Label: { width: '20x' },
                  Description: { width: '20x' },
                }}
              >
                Workbook
              </Menu.Item>
            </Menu>
          </div>
          <div
            data-qa="query-sibling"
            style={{ width: '200px', flexShrink: 0 }}
          >
            Sibling
          </div>
        </div>
      </Root>,
    );
    const command = screen.getByRole('menuitem', { name: 'Command' });
    await act(async () => {
      command.focus();
      await settleLayout();
    });
    const container = screen.getByTestId('query-container');
    const sibling = screen.getByTestId('query-sibling');
    const row = screen.getByTestId('query-target');
    const label = row.querySelector<HTMLElement>('[data-element="Label"]')!;
    const description = row.querySelector<HTMLElement>(
      '[data-element="Description"]',
    )!;
    expect(getComputedStyle(container).containerType).toBe('normal');
    expect(container.getBoundingClientRect().width).toBe(400);
    expect(label.getBoundingClientRect().width).toBe(160);
    expect(description.getBoundingClientRect().width).toBe(160);
    const primary = screen.getByRole('menuitem', { name: 'Workbook' });
    expect(primary).toBeVisible();
    expect(primary).toHaveAccessibleDescription('Visible description');
    await act(async () => {
      container.style.containerType = 'inline-size';
      await settleLayout();
    });
    expect(container.getBoundingClientRect().width).toBe(400);
    await act(async () => {
      sibling.style.width = '400px';
      await settleLayout();
    });
    await waitFor(() =>
      expect(getComputedStyle(label).visibility).toBe('hidden'),
    );
    expect(getComputedStyle(label).visibility).toBe('hidden');
    expect(getComputedStyle(description).visibility).toBe('visible');
    expect(container.getBoundingClientRect().width).toBe(200);
    expect(label.getBoundingClientRect().width).toBe(160);
    expect(description.getBoundingClientRect().width).toBe(160);
    expect(screen.getByRole('menuitem', { name: 'Workbook' })).toBe(primary);
    expect(primary).toBeVisible();
    expect(primary).toHaveAccessibleDescription('Visible description');
    expect(row.querySelector('[data-element="Label"]')).toBe(label);
    expect(screen.getByTestId('query-container')).toBe(container);
    expect(command).toHaveFocus();
  });

  it('preserves outside focus requested by a parent while Label hides', async () => {
    let hideLabel: (() => void) | undefined;
    function App() {
      const [hidden, setHidden] = useState(false);
      const outside = useRef<HTMLButtonElement>(null);
      hideLabel = () => setHidden(true);
      useLayoutEffect(() => {
        if (hidden) outside.current?.focus();
      }, [hidden]);
      return (
        <Root>
          <Menu aria-label="Parent focus">
            <Menu.Item
              key="workbook"
              to="/destination"
              description="Visible description"
              tooltip={false}
              styles={{ Label: { hide: hidden } }}
            >
              Workbook
            </Menu.Item>
          </Menu>
          <button ref={outside}>After parent menu</button>
        </Root>
      );
    }
    render(<App />);
    const primary = screen.getByRole('menuitem', { name: 'Workbook' });
    await act(() => primary.focus());
    await act(() => flushSync(() => hideLabel?.()));
    expect(screen.getByRole('menuitem', { name: 'Workbook' })).toBe(primary);
    expect(primary).toBeVisible();
    expect(primary).toHaveAccessibleDescription('Visible description');
    expect(
      screen.getByRole('button', { name: 'After parent menu' }),
    ).toHaveFocus();
  });

  it.each(['content', 'label', 'external'] as const)(
    'names a visible row target from %s with a hidden Label and routes once',
    async (nameSource) => {
      const itemAction = vi.fn();
      const menuAction = vi.fn();
      const navigate = vi.fn();
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <span id="visible-menu-name">External workbook</span>
          <span id="visible-menu-description">External details</span>
          <MenuContext.Provider value={{ closeOnSelect: false }}>
            <Menu
              aria-label="Workbooks"
              autoFocus="first"
              onAction={menuAction}
            >
              <Menu.Item key="first">First command</Menu.Item>
              <Menu.Item
                key="target"
                qa="visible-target"
                to="/workbooks/saved"
                tooltip={false}
                aria-label={
                  nameSource === 'label' ? 'Open workbook' : undefined
                }
                aria-labelledby={
                  nameSource === 'external' ? 'visible-menu-name' : undefined
                }
                aria-describedby={
                  nameSource === 'external'
                    ? 'visible-menu-description'
                    : undefined
                }
                description="Visible description"
                styles={{ Label: { hide: true } }}
                onAction={itemAction}
              >
                Target workbook
              </Menu.Item>
            </Menu>
          </MenuContext.Provider>
        </Root>,
      );
      await waitFor(() =>
        expect(
          screen.getByRole('menuitem', { name: 'First command' }),
        ).toHaveFocus(),
      );
      await act(() => userEvent.keyboard('{ArrowDown}'));
      const name =
        nameSource === 'external'
          ? 'External workbook'
          : nameSource === 'label'
            ? 'Open workbook'
            : 'Target workbook';
      const primary = screen.getByRole('menuitem', { name });
      await waitFor(() => expect(primary).toHaveFocus(), { timeout: 1000 });
      expect(primary.tagName).toBe('A');
      expect(primary).toBeVisible();
      expect(primary).toHaveAttribute('href', '/workbooks/saved');
      expect(primary).not.toHaveAttribute('aria-hidden');
      expect(primary).toHaveAccessibleName(name);
      expect(primary).toHaveAccessibleDescription(
        nameSource === 'external' ? 'External details' : 'Visible description',
      );
      if (nameSource === 'external') {
        expect(primary).toHaveAttribute('aria-labelledby', 'visible-menu-name');
        expect(primary).toHaveAttribute(
          'aria-describedby',
          'visible-menu-description',
        );
      }
      await act(() => userEvent.keyboard('{Enter}'));
      expect(itemAction).toHaveBeenCalledExactlyOnceWith();
      expect(menuAction).toHaveBeenCalledExactlyOnceWith('target');
      expect(navigate).toHaveBeenCalledExactlyOnceWith(
        '/workbooks/saved',
        undefined,
      );
    },
  );

  it('autofocuses a visible first-row target with a hidden Label', async () => {
    render(
      <Root>
        <Menu aria-label="Autofocus" autoFocus="first">
          <Menu.Item
            key="target"
            qa="visible-target"
            to="/destination"
            description="Visible description"
            styles={{ Label: { hide: true } }}
            tooltip={false}
          >
            Target workbook
          </Menu.Item>
        </Menu>
      </Root>,
    );
    const primary = screen.getByRole('menuitem', { name: 'Target workbook' });
    await waitFor(() => expect(primary).toHaveFocus(), { timeout: 1000 });
    expect(primary).toBeVisible();
    expect(primary).toHaveAccessibleDescription('Visible description');
  });

  it('focuses the visible target of a named icon-only row', async () => {
    render(
      <Root>
        <Menu aria-label="Icon targets" autoFocus="first">
          <Menu.Item
            key="target"
            qa="visible-target"
            to="/destination"
            aria-label="Open workbook"
            children={null}
            icon={<MoreIcon />}
            styles={{ Label: { hide: true } }}
            tooltip={false}
          />
        </Menu>
      </Root>,
    );
    const primary = screen.getByRole('menuitem', { name: 'Open workbook' });
    await waitFor(() => expect(primary).toHaveFocus(), { timeout: 1000 });
    expect(primary.tagName).toBe('A');
    expect(primary).toBeVisible();
    expect(primary).not.toHaveAttribute('aria-hidden');
    expect(primary).toHaveAccessibleName('Open workbook');
    expect(screen.getAllByRole('menuitem')).toEqual([primary]);
  });

  it.each(['props', 'focused', 'css'] as const)(
    'retains semantic focus without extra focus events when %s hides Label',
    async (change) => {
      const focuses: Array<{
        target: HTMLElement;
        role: string | null;
        hidden: string | null;
      }> = [];
      const onFocus = vi.fn();
      const capture = (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        if (target.closest('[data-qa="visible-target"]')) {
          focuses.push({
            target,
            role: target.getAttribute('role'),
            hidden: target.getAttribute('aria-hidden'),
          });
        }
      };
      document.addEventListener('focusin', capture);
      try {
        const content = (hide: boolean) => (
          <Root>
            <Menu aria-label="Changing target" autoFocus="first">
              <Menu.Item key="first">First command</Menu.Item>
              <Menu.Item
                key="target"
                qa="visible-target"
                to="/destination"
                description="Visible description"
                tooltip={false}
                onFocus={onFocus}
                styles={{
                  Label: {
                    hide:
                      change === 'focused'
                        ? { '': false, focused: true }
                        : change === 'css'
                          ? { '': false, '@root(menu-label=hidden)': true }
                          : hide,
                  },
                }}
              >
                Target workbook
              </Menu.Item>
            </Menu>
            <button>After menu</button>
          </Root>
        );
        const { rerender } = render(content(false));
        await waitFor(() =>
          expect(
            screen.getByRole('menuitem', { name: 'First command' }),
          ).toHaveFocus(),
        );
        await act(() => userEvent.keyboard('{ArrowDown}'));
        const primary = screen.getByRole('menuitem', {
          name: 'Target workbook',
        });
        await waitFor(() => expect(primary).toHaveFocus(), { timeout: 1000 });
        if (change === 'props') rerender(content(true));
        if (change === 'css') {
          document.documentElement.setAttribute('data-menu-label', 'hidden');
        }
        const row = screen.getByTestId('visible-target');
        const label = row.querySelector<HTMLElement>('[data-element="Label"]')!;
        await waitFor(() => expect(label).not.toBeVisible(), { timeout: 1000 });
        expect(screen.getByRole('menuitem', { name: 'Target workbook' })).toBe(
          primary,
        );
        expect(primary).toHaveFocus();
        expect(primary).toBeVisible();
        expect(primary).toHaveAccessibleName('Target workbook');
        expect(primary).toHaveAccessibleDescription('Visible description');
        expect(focuses).toHaveLength(1);
        expect(
          focuses.every(
            ({ target, role, hidden }) =>
              target === primary && role === 'menuitem' && hidden !== 'true',
          ),
        ).toBe(true);
        expect(onFocus).toHaveBeenCalledTimes(1);
        if (change !== 'focused') {
          if (change === 'props') rerender(content(false));
          else document.documentElement.removeAttribute('data-menu-label');
          await waitFor(() => expect(label).toBeVisible(), { timeout: 1000 });
          expect(
            screen.getByRole('menuitem', { name: 'Target workbook' }),
          ).toBe(primary);
          expect(primary).toHaveFocus();
          expect(focuses).toHaveLength(1);
          await act(() =>
            screen.getByRole('button', { name: 'After menu' }).focus(),
          );
          if (change === 'props') rerender(content(true));
          else
            document.documentElement.setAttribute('data-menu-label', 'hidden');
          await waitFor(() => expect(label).not.toBeVisible(), {
            timeout: 1000,
          });
          expect(
            screen.getByRole('menuitem', { name: 'Target workbook' }),
          ).toBe(primary);
          expect(primary).toBeVisible();
          expect(focuses).toHaveLength(1);
          expect(
            screen.getByRole('button', { name: 'After menu' }),
          ).toHaveFocus();
        }
      } finally {
        document.removeEventListener('focusin', capture);
      }
    },
  );

  it('keeps a command and its inline action independently named and reachable', async () => {
    const command = vi.fn();
    const settings = vi.fn();
    render(
      <Root>
        <MenuContext.Provider value={{ closeOnSelect: false }}>
          <Menu aria-label="Commands" autoFocus="first">
            <Menu.Item
              key="target"
              description="Visible description"
              styles={{ Label: { hide: true } }}
              tooltip={false}
              onAction={command}
              actions={
                <Menu.Item.Action
                  aria-label="Target settings"
                  onPress={settings}
                >
                  Settings
                </Menu.Item.Action>
              }
            >
              Target workbook
            </Menu.Item>
          </Menu>
        </MenuContext.Provider>
      </Root>,
    );
    await waitFor(
      () =>
        expect(
          screen.getByRole('menuitem', { name: 'Target workbook' }),
        ).toHaveFocus(),
      { timeout: 1000 },
    );
    await act(() => userEvent.keyboard('{Enter}{ArrowDown}{Enter}'));
    expect(command).toHaveBeenCalledExactlyOnceWith();
    expect(settings).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('menuitem', { name: 'Target settings' }),
    ).toHaveFocus();
  });

  it.each(['item', 'header', 'card'] as const)(
    'preserves the %s label ref, rich accessible name and focus through tooltip ref replacement',
    async (type) => {
      const labelRef = createRef<HTMLElement>();
      const content = (tooltip: boolean) => (
        <Root>
          <Menu aria-label="Ref replacement" autoFocus="first">
            <Menu.Item
              key="target"
              qa="visible-target"
              type={type}
              level={3}
              textValue="Search alias"
              labelRef={labelRef}
              to="/destination"
              description="Visible description"
              styles={{ Label: { hide: true } }}
              tooltip={tooltip ? { title: 'Target help', delay: 0 } : false}
            >
              <span>
                Target <strong>workbook</strong>
              </span>
            </Menu.Item>
          </Menu>
        </Root>
      );
      const { rerender } = render(content(false));
      const primary = screen.getByRole('menuitem', { name: 'Target workbook' });
      await waitFor(() => expect(primary).toHaveFocus(), { timeout: 1000 });
      expect(primary).toBeVisible();
      expect(primary).toHaveAccessibleDescription('Visible description');
      expect(labelRef.current?.tagName).toBe(type === 'item' ? 'A' : 'H3');
      flushSync(() => rerender(content(true)));
      const currentPrimary = screen.getByRole('menuitem', {
        name: 'Target workbook',
      });
      expect(currentPrimary).toHaveFocus();
      expect(currentPrimary).toBeVisible();
      expect(currentPrimary).toHaveAccessibleDescription(
        'Visible description Target help',
      );
      expect(labelRef.current).toBe(
        screen
          .getByTestId('visible-target')
          .querySelector('[data-element="Label"]'),
      );
      expect(labelRef.current?.tagName).toBe(type === 'item' ? 'A' : 'H3');
    },
  );

  it.each([false, true])(
    'keeps ordinary command focus on LI (autofocus=%s)',
    async (autoFocus) => {
      const roles: Array<string | null> = [];
      const capture = (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        if (target.closest('[data-qa="visible-target"]'))
          roles.push(target.getAttribute('role'));
      };
      document.addEventListener('focusin', capture);
      try {
        render(
          <Root>
            <Menu
              aria-label="Ordinary commands"
              autoFocus={autoFocus ? 'first' : false}
            >
              <Menu.Item key="target" qa="visible-target" tooltip={false}>
                Target command
              </Menu.Item>
            </Menu>
          </Root>,
        );
        if (!autoFocus)
          await act(() =>
            screen.getByRole('menuitem', { name: 'Target command' }).focus(),
          );
        expect(
          screen.getByRole('menuitem', { name: 'Target command' }),
        ).toHaveFocus();
        expect(document.activeElement?.tagName).toBe('LI');
        expect(roles).toEqual(['menuitem']);
      } finally {
        document.removeEventListener('focusin', capture);
      }
    },
  );

  it('keeps a disabled visible primary stable and skips it in keyboard order', async () => {
    render(
      <Root>
        <Menu aria-label="Disabled targets" autoFocus="first">
          <Menu.Item key="first">First command</Menu.Item>
          <Menu.Item
            key="disabled"
            qa="visible-target"
            to="/destination"
            isDisabled
            icon={<MoreIcon />}
            description="Visible description"
            tooltip={false}
          >
            Disabled workbook
          </Menu.Item>
          <Menu.Item key="last">Last command</Menu.Item>
        </Menu>
      </Root>,
    );
    const disabled = screen.getByRole('menuitem', {
      name: 'Disabled workbook',
    });
    expect(disabled).toBeVisible();
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    expect(disabled).not.toHaveAttribute('href');
    await act(() => userEvent.keyboard('{ArrowDown}'));
    expect(
      screen.getByRole('menuitem', { name: 'Last command' }),
    ).toHaveFocus();
    expect(screen.getByRole('menuitem', { name: 'Disabled workbook' })).toBe(
      disabled,
    );
  });

  it.each(['content', 'label', 'external'] as const)(
    'preserves CommandMenu active descendant, %s name and description while Label hides',
    async (nameSource) => {
      const navigate = vi.fn();
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <span id="command-target-name">External workbook</span>
          <span id="command-target-description">External details</span>
          <CommandMenu aria-label="Command targets">
            <CommandMenu.Item
              key="target"
              qa="visible-target"
              to="/destination"
              tooltip={false}
              aria-label={nameSource === 'label' ? 'Open workbook' : undefined}
              aria-labelledby={
                nameSource === 'external' ? 'command-target-name' : undefined
              }
              aria-describedby={
                nameSource === 'external'
                  ? 'command-target-description'
                  : undefined
              }
              description="Visible description"
              styles={{
                Label: {
                  hide: { '': false, '@root(menu-label=hidden)': true },
                },
              }}
            >
              Target workbook
            </CommandMenu.Item>
          </CommandMenu>
        </Root>,
      );
      const search = screen.getByRole('searchbox');
      await act(() => search.focus());
      await act(() => userEvent.keyboard('{ArrowDown}'));
      const name =
        nameSource === 'external'
          ? 'External workbook'
          : nameSource === 'label'
            ? 'Open workbook'
            : 'Target workbook';
      const primary = screen.getByRole('menuitem', { name });
      const id = primary.id;
      await waitFor(() =>
        expect(search).toHaveAttribute('aria-activedescendant', id),
      );
      document.documentElement.setAttribute('data-menu-label', 'hidden');
      const label = screen
        .getByTestId('visible-target')
        .querySelector<HTMLElement>('[data-element="Label"]')!;
      await waitFor(() => expect(label).not.toBeVisible(), { timeout: 1000 });
      expect(screen.getByRole('menuitem', { name })).toBe(primary);
      expect(primary).toBeVisible();
      expect(primary.id).toBe(id);
      expect(search).toHaveAttribute('aria-activedescendant', id);
      expect(search).toHaveFocus();
      expect(primary).toHaveAccessibleName(name);
      expect(primary).toHaveAccessibleDescription(
        nameSource === 'external' ? 'External details' : 'Visible description',
      );
      if (nameSource === 'external') {
        expect(primary).toHaveAttribute(
          'aria-labelledby',
          'command-target-name',
        );
        expect(primary).toHaveAttribute(
          'aria-describedby',
          'command-target-description',
        );
      }
      await act(() => userEvent.keyboard('{Enter}'));
      expect(navigate).toHaveBeenCalledExactlyOnceWith(
        '/destination',
        undefined,
      );
    },
  );
});
