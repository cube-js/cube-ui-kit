import { useState } from 'react';
import { flushSync } from 'react-dom';
import { userEvent } from 'vitest/browser';

import { render, screen, waitFor } from '../../../test';
import { Root } from '../../Root';
import { MenuContext } from '../Menu/context';

import { CommandMenu } from './CommandMenu';

describe('CommandMenu native navigation', () => {
  async function requests(path: string) {
    const all: { url: string; referrer?: string }[] = await (
      await fetch('/__menu-link-test/requests')
    ).json();
    return all.filter((request) => request.url === path);
  }

  it.each(['Enter', ' '])(
    'routes a filtered section link once with %s',
    async (key) => {
      const navigate = vi.fn();
      const itemAction = vi.fn();
      const menuAction = vi.fn();
      const close = vi.fn();
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <MenuContext.Provider value={{ onClose: close }}>
            <CommandMenu onAction={menuAction}>
              <CommandMenu.Item key="command">Create workbook</CommandMenu.Item>
              <CommandMenu.Section title="Recent">
                <CommandMenu.Item
                  key="saved"
                  to="/workbooks/saved"
                  onAction={itemAction}
                  navigationOptions={{ replace: true }}
                >
                  Saved workbook
                </CommandMenu.Item>
              </CommandMenu.Section>
            </CommandMenu>
          </MenuContext.Provider>
        </Root>,
      );
      const search = screen.getByRole('searchbox');
      await userEvent.click(search);
      if (key === 'Enter') await userEvent.fill(search, 'Saved');
      else await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      const link = screen.getByRole('menuitem', { name: 'Saved workbook' });
      await waitFor(() =>
        expect(search).toHaveAttribute('aria-activedescendant', link.id),
      );
      await userEvent.keyboard(key === 'Enter' ? '{Enter}' : ' ');
      expect(navigate).toHaveBeenCalledExactlyOnceWith('/workbooks/saved', {
        replace: true,
      });
      expect(itemAction).toHaveBeenCalledExactlyOnceWith();
      expect(menuAction).toHaveBeenCalledExactlyOnceWith('saved');
      expect(close).toHaveBeenCalledTimes(1);
      expect(search).toHaveFocus();
      expect(link.closest('li')).not.toHaveAttribute('data-pressed');
    },
  );

  it.each(['Enter', ' '])(
    'preserves native target and referrer policy from the search input with %s',
    async (key) => {
      const path = `/__menu-link-test/command-key-${key === 'Enter' ? 'enter' : 'space'}`;
      const navigate = vi.fn();
      const onAction = vi.fn();
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <CommandMenu onAction={onAction}>
            <CommandMenu.Item
              key="link"
              to={`@${path}`}
              target="_blank"
              referrerPolicy="no-referrer"
            >
              Native workbook
            </CommandMenu.Item>
          </CommandMenu>
        </Root>,
      );
      await userEvent.click(screen.getByRole('searchbox'));
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard(key === 'Enter' ? '{Enter}' : ' ');
      await waitFor(async () => {
        const matched = await requests(path);
        expect(matched).toHaveLength(1);
        expect(matched[0].referrer).toBeUndefined();
      });
      expect(navigate).not.toHaveBeenCalled();
      expect(onAction).toHaveBeenCalledExactlyOnceWith('link');
    },
  );

  it('keeps modified search-input activation native', async () => {
    const path = '/__menu-link-test/command-meta-enter';
    const navigate = vi.fn();
    const onAction = vi.fn();
    render(
      <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
        <CommandMenu onAction={onAction}>
          <CommandMenu.Item key="link" to={path}>
            Native workbook
          </CommandMenu.Item>
        </CommandMenu>
      </Root>,
    );
    await userEvent.click(screen.getByRole('searchbox'));
    await userEvent.keyboard('{ArrowDown}{Meta>}{Enter}{/Meta}');
    await waitFor(async () => expect(await requests(path)).toHaveLength(1));
    expect(navigate).not.toHaveBeenCalled();
    expect(onAction).toHaveBeenCalledExactlyOnceWith('link');
  });

  it.each(['middle', 'right'] as const)(
    'preserves the trusted native %s gesture',
    async (button) => {
      const navigate = vi.fn();
      const onAction = vi.fn();
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <CommandMenu onAction={onAction}>
            <CommandMenu.Item
              key="link"
              href="/__menu-link-test/command-pointer"
            >
              Native workbook
            </CommandMenu.Item>
          </CommandMenu>
        </Root>,
      );
      const link = screen.getByRole('menuitem', { name: 'Native workbook' });
      const events: MouseEvent[] = [];
      const eventName = button === 'middle' ? 'auxclick' : 'contextmenu';
      const record = (event: MouseEvent) => events.push(event);
      document.addEventListener(eventName, record, true);
      try {
        await userEvent.click(link, { button });
        expect(events).toHaveLength(1);
        expect(events[0].isTrusted).toBe(true);
        expect(events[0].defaultPrevented).toBe(false);
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute(
          'href',
          '/__menu-link-test/command-pointer',
        );
        expect(navigate).not.toHaveBeenCalled();
        expect(onAction).not.toHaveBeenCalled();
      } finally {
        document.removeEventListener(eventName, record, true);
      }
    },
  );

  it.each(['item', 'menu'] as const)(
    'preserves native activation when the %s callback removes the palette synchronously',
    async (callback) => {
      const path = `/__menu-link-test/command-unmount-${callback}`;
      const navigate = vi.fn();
      const onItemAction = vi.fn();
      const onMenuAction = vi.fn();
      function Fixture() {
        const [visible, setVisible] = useState(true);
        const itemAction = () => {
          onItemAction();
          if (callback === 'item') flushSync(() => setVisible(false));
        };
        const menuAction = () => {
          onMenuAction();
          if (callback === 'menu') flushSync(() => setVisible(false));
        };
        return visible ? (
          <CommandMenu onAction={menuAction}>
            <CommandMenu.Item
              key="link"
              to={`@${path}`}
              onAction={itemAction}
              referrerPolicy="no-referrer"
            >
              Native workbook
            </CommandMenu.Item>
          </CommandMenu>
        ) : null;
      }
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <Fixture />
        </Root>,
      );
      await userEvent.click(screen.getByRole('searchbox'));
      await userEvent.keyboard('{ArrowDown}{Enter}');
      await waitFor(async () => {
        const matched = await requests(path);
        expect(matched).toHaveLength(1);
        expect(matched[0].referrer).toBeUndefined();
      });
      expect(onItemAction).toHaveBeenCalledTimes(1);
      expect(onMenuAction).toHaveBeenCalledTimes(1);
      expect(navigate).not.toHaveBeenCalled();
      expect(screen.queryByRole('searchbox')).toBeNull();
    },
  );
});
