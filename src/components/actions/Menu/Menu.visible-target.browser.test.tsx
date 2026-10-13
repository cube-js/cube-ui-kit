import { createRef, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { userEvent } from 'vitest/browser';

import { MoreIcon } from '../../../icons/MoreIcon';
import { act, render, screen, waitFor } from '../../../test';
import { Root } from '../../Root';
import { CommandMenu } from '../CommandMenu/CommandMenu';

import { MenuContext } from './context';
import { Menu } from './Menu';

describe('Visible native menu targets', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-menu-label');
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
    await act(() => screen.getByRole('menuitem', { name: 'Workbook' }).focus());
    await act(() => flushSync(() => hideLabel?.()));
    await waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: 'Workbook' }),
      ).toHaveAttribute('data-element', 'Description'),
    );
    expect(
      screen.getByRole('button', { name: 'After parent menu' }),
    ).toHaveFocus();
  });

  it.each(['content', 'label', 'external'] as const)(
    'names a visible Description target from %s and routes once',
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
      const description = screen
        .getByTestId('visible-target')
        .querySelector<HTMLElement>('[data-element="Description"]')!;
      await waitFor(() => expect(description).toHaveFocus(), { timeout: 1000 });
      expect(description).toHaveAttribute('role', 'menuitem');
      expect(description).not.toHaveAttribute('aria-hidden');
      expect(description).toHaveAccessibleName(
        nameSource === 'external'
          ? 'External workbook'
          : nameSource === 'label'
            ? 'Open workbook'
            : 'Target workbook',
      );
      expect(description).toHaveAccessibleDescription(
        nameSource === 'external' ? 'External details' : 'Visible description',
      );
      await act(() => userEvent.keyboard('{Enter}'));
      expect(itemAction).toHaveBeenCalledExactlyOnceWith();
      expect(menuAction).toHaveBeenCalledExactlyOnceWith('target');
      expect(navigate).toHaveBeenCalledExactlyOnceWith(
        '/workbooks/saved',
        undefined,
      );
    },
  );

  it('autofocuses the visible Description of the first row', async () => {
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
    const description = screen
      .getByTestId('visible-target')
      .querySelector<HTMLElement>('[data-element="Description"]')!;
    await waitFor(() => expect(description).toHaveFocus(), { timeout: 1000 });
    expect(description).toHaveAccessibleName('Target workbook');
  });

  it('focuses the visible Icon of a named row with a hidden Label', async () => {
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
    const icon = screen
      .getByTestId('visible-target')
      .querySelector<HTMLElement>('[data-element="Icon"]')!;
    await waitFor(() => expect(icon).toHaveFocus(), { timeout: 1000 });
    expect(icon.tagName).toBe('A');
    expect(icon).toHaveAttribute('role', 'menuitem');
    expect(icon).not.toHaveAttribute('aria-hidden');
    expect(icon).toHaveAccessibleName('Open workbook');
  });

  it.each(['props', 'focused', 'css'] as const)(
    'commits semantic props before transferring focus when %s hides Label',
    async (change) => {
      const focuses: Array<{ role: string | null; hidden: string | null }> = [];
      const onFocus = vi.fn();
      const capture = (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        if (target.closest('[data-qa="visible-target"]')) {
          focuses.push({
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
        if (change === 'props') rerender(content(true));
        if (change === 'css') {
          document.documentElement.setAttribute('data-menu-label', 'hidden');
        }
        const row = screen.getByTestId('visible-target');
        const description = row.querySelector<HTMLElement>(
          '[data-element="Description"]',
        )!;
        await waitFor(() => expect(description).toHaveFocus(), {
          timeout: 1000,
        });
        expect(description).toHaveAccessibleName('Target workbook');
        expect(description).toHaveAccessibleDescription('Visible description');
        expect(focuses.length).toBeGreaterThan(0);
        expect(
          focuses.every(
            ({ role, hidden }) => role === 'menuitem' && hidden !== 'true',
          ),
        ).toBe(true);
        expect(onFocus).toHaveBeenCalled();
        if (change !== 'focused') {
          if (change === 'props') rerender(content(false));
          else document.documentElement.removeAttribute('data-menu-label');
          const label = row.querySelector<HTMLElement>(
            '[data-element="Label"]',
          )!;
          await waitFor(() => expect(label).toHaveFocus(), { timeout: 1000 });
          await act(() =>
            screen.getByRole('button', { name: 'After menu' }).focus(),
          );
          if (change === 'props') rerender(content(true));
          else
            document.documentElement.setAttribute('data-menu-label', 'hidden');
          await waitFor(
            () => expect(description).toHaveAttribute('role', 'menuitem'),
            { timeout: 1000 },
          );
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
    'preserves the %s label ref through tooltip ref replacement',
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
              labelRef={labelRef}
              to="/destination"
              description="Visible description"
              styles={{ Label: { hide: true } }}
              tooltip={tooltip ? { title: 'Target help', delay: 0 } : false}
            >
              Target workbook
            </Menu.Item>
          </Menu>
        </Root>
      );
      const { rerender } = render(content(false));
      const row = screen.getByTestId('visible-target');
      await waitFor(
        () =>
          expect(
            row.querySelector('[data-element="Description"]'),
          ).toHaveFocus(),
        { timeout: 1000 },
      );
      expect(labelRef.current?.tagName).toBe(type === 'item' ? 'A' : 'H3');
      flushSync(() => rerender(content(true)));
      expect(
        screen
          .getByTestId('visible-target')
          .querySelector('[data-element="Description"]'),
      ).toHaveFocus();
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
    expect(
      screen.getByRole('menuitem', { name: 'Disabled workbook' }),
    ).toHaveAttribute('data-element', 'Label');
    await act(() => userEvent.keyboard('{ArrowDown}'));
    expect(
      screen.getByRole('menuitem', { name: 'Last command' }),
    ).toHaveFocus();
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
      const primary = screen
        .getByTestId('visible-target')
        .querySelector<HTMLElement>('[data-menu-native-primary]')!;
      const id = primary.id;
      await waitFor(() =>
        expect(search).toHaveAttribute('aria-activedescendant', id),
      );
      document.documentElement.setAttribute('data-menu-label', 'hidden');
      const description = screen
        .getByTestId('visible-target')
        .querySelector<HTMLElement>('[data-element="Description"]')!;
      await waitFor(
        () => expect(description).toHaveAttribute('data-menu-native-primary'),
        { timeout: 1000 },
      );
      expect(description.id).toBe(id);
      expect(search).toHaveAttribute('aria-activedescendant', id);
      expect(search).toHaveFocus();
      expect(description).toHaveAccessibleName(
        nameSource === 'external'
          ? 'External workbook'
          : nameSource === 'label'
            ? 'Open workbook'
            : 'Target workbook',
      );
      expect(description).toHaveAccessibleDescription(
        nameSource === 'external' ? 'External details' : 'Visible description',
      );
      await act(() => userEvent.keyboard('{Enter}'));
      expect(navigate).toHaveBeenCalledExactlyOnceWith(
        '/destination',
        undefined,
      );
    },
  );
});
