import pointerUserEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { RouterProvider, useLink } from 'react-aria';
import { flushSync } from 'react-dom';
import {
  MemoryRouter,
  Route,
  Routes,
  useHref,
  useLocation,
  useNavigate,
} from 'react-router';
import { userEvent } from 'vitest/browser';

import { act, render, screen, waitFor } from '../../../test';
import { Root } from '../../Root';
import { Button } from '../Button/Button';
import { ItemButton } from '../ItemButton/ItemButton';

import { Menu } from './Menu';
import { MenuTrigger } from './MenuTrigger';

describe('Menu navigation links', () => {
  const destination = '/workbooks/42?chatId=abc';

  function renderMenu() {
    const navigate = vi.fn();
    const onAction = vi.fn();
    const onItemAction = vi.fn();

    render(
      <Root
        navigation={{
          useHref: (to) => String(to),
          useNavigate: () => navigate,
        }}
      >
        <MenuTrigger>
          <Button>Workbooks</Button>
          <Menu onAction={onAction} disabledKeys={['disabled']}>
            <Menu.Section title="Recent workbooks">
              <Menu.Item
                key="workbook"
                href={destination}
                onAction={onItemAction}
              >
                Workbook
              </Menu.Item>
              <Menu.Item key="disabled" href="/disabled">
                Unavailable
              </Menu.Item>
            </Menu.Section>
            <Menu.Item key="create">Create workbook</Menu.Item>
          </Menu>
        </MenuTrigger>
      </Root>,
    );

    return { navigate, onAction, onItemAction };
  }

  async function openMenu() {
    await userEvent.click(screen.getByRole('button', { name: 'Workbooks' }));
    await screen.findByRole('menu');
    return screen.getByRole('menuitem', { name: 'Workbook' });
  }

  it.each(['onAction', 'onClick'] as const)(
    'retains native navigation when %s synchronously removes the menu',
    async (callback) => {
      const pathname = `/__menu-link-test/unmount-${callback}`;
      const navigate = vi.fn();
      const onActivate = vi.fn();
      function App() {
        const [open, setOpen] = useState(true);
        const deactivate = () => {
          onActivate();
          flushSync(() => setOpen(false));
        };
        return (
          <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
            {open && (
              <Menu aria-label="Destinations">
                <Menu.Item
                  key="link"
                  href={location.origin + pathname}
                  {...{ [callback]: deactivate }}
                >
                  Destination
                </Menu.Item>
              </Menu>
            )}
          </Root>
        );
      }
      render(<App />);
      await userEvent.click(
        screen.getByRole('menuitem', { name: 'Destination' }),
        { noWaitAfter: true },
      );
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(navigate).not.toHaveBeenCalled();
      expect(onActivate).toHaveBeenCalledTimes(1);
      await waitFor(
        async () => {
          const requests: { url: string }[] = await (
            await fetch('/__menu-link-test/requests')
          ).json();
          expect(requests.some((request) => request.url === pathname)).toBe(
            true,
          );
        },
        { timeout: 1500 },
      );
    },
  );

  it.each(['none', 'single', 'multiple'] as const)(
    'honors cancelled navigation in %s selection mode',
    async (selectionMode) => {
      const navigate = vi.fn();
      const onClick = vi.fn((event) => event.preventDefault());
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <Menu aria-label="Destinations" selectionMode={selectionMode}>
            <Menu.Item key="link" to={destination} onClick={onClick}>
              Destination
            </Menu.Item>
          </Menu>
        </Root>,
      );
      await userEvent.click(screen.getByText('Destination'));
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(navigate).not.toHaveBeenCalled();
    },
  );

  it.each(['noreferrer', 'policy', 'ping'])(
    'preserves native navigation attributes: %s',
    async (variant) => {
      const navigate = vi.fn();
      const onAction = vi.fn();
      const pathname = `/__menu-link-test/${variant}`;
      const href = `${location.origin}${pathname}`;
      render(
        <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
          <Menu aria-label="Destinations" onAction={onAction}>
            <Menu.Item
              key="link"
              href={variant === 'policy' ? undefined : href}
              to={variant === 'policy' ? `@${pathname}` : undefined}
              rel={variant === 'noreferrer' ? 'noreferrer' : undefined}
              referrerPolicy={variant === 'policy' ? 'no-referrer' : undefined}
              ping={variant === 'ping' ? '/__menu-link-test/audit' : undefined}
            >
              Destination
            </Menu.Item>
          </Menu>
        </Root>,
      );
      await userEvent.click(
        screen.getByRole('menuitem', { name: 'Destination' }),
        { noWaitAfter: true },
      );
      await waitFor(
        async () => {
          const requests: {
            url: string;
            method?: string;
            referrer?: string;
          }[] = await (await fetch('/__menu-link-test/requests')).json();
          const request = requests.find((request) => request.url === pathname);
          expect(request).toBeDefined();
          if (variant === 'ping') {
            expect(requests).toContainEqual(
              expect.objectContaining({
                url: '/__menu-link-test/audit',
                method: 'POST',
              }),
            );
          } else expect(request?.referrer).toBeUndefined();
        },
        { timeout: 1500 },
      );
      expect(navigate).not.toHaveBeenCalled();
      expect(onAction).toHaveBeenCalledExactlyOnceWith('link');
    },
  );

  it('renders a native anchor and routes an ordinary click once before closing', async () => {
    const { navigate, onAction, onItemAction } = renderMenu();
    const link = await openMenu();

    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', destination);
    expect(link.closest('li')).toHaveAttribute('role', 'none');
    expect(
      screen.getByRole('menuitem', { name: 'Create workbook' }).tagName,
    ).toBe('LI');

    await userEvent.click(link);

    expect(navigate).toHaveBeenCalledExactlyOnceWith(destination, undefined);
    expect(onItemAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledExactlyOnceWith('workbook');
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Workbooks' })).toHaveFocus(),
    );
  });

  it.each(['{Enter}', ' '])(
    'activates a focused link once with %s',
    async (key) => {
      const { navigate, onAction, onItemAction } = renderMenu();
      const link = await openMenu();
      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(link).toHaveFocus());
      await userEvent.keyboard(key);

      expect(navigate).toHaveBeenCalledExactlyOnceWith(destination, undefined);
      expect(onItemAction).toHaveBeenCalledTimes(1);
      expect(onAction).toHaveBeenCalledTimes(1);
      await waitFor(() =>
        expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
      );
    },
  );

  it('removes the destination from disabled links and leaves commands unchanged', async () => {
    const { navigate, onAction } = renderMenu();
    await openMenu();
    const disabled = screen.getByRole('menuitem', { name: 'Unavailable' });
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    expect(disabled).not.toHaveAttribute('href');
    await userEvent.click(disabled, { force: true });
    expect(navigate).not.toHaveBeenCalled();
    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Create workbook' }),
    );
    expect(onAction).toHaveBeenCalledExactlyOnceWith('create');
    expect(navigate).not.toHaveBeenCalled();
  });

  it.each(['{Enter}', ' '])(
    'activates a persistent to link once with %s without changing selection',
    async (key) => {
      const navigate = vi.fn();
      const onAction = vi.fn();
      const onSelectionChange = vi.fn();
      render(
        <Root
          navigation={{
            useHref: (to) => String(to),
            useNavigate: () => navigate,
          }}
        >
          <Menu
            aria-label="Workbooks"
            selectionMode="multiple"
            onSelectionChange={onSelectionChange}
            onAction={onAction}
          >
            <Menu.Item key="workbook" to={destination}>
              Workbook
            </Menu.Item>
          </Menu>
        </Root>,
      );
      const link = screen.getByRole('menuitemcheckbox', { name: 'Workbook' });
      await act(() => link.focus());
      await userEvent.keyboard(key);
      expect(navigate).toHaveBeenCalledExactlyOnceWith(destination, undefined);
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).not.toHaveBeenCalled();
    },
  );

  it('resolves Path destinations and forwards navigation options without leaking them to the DOM', async () => {
    const navigate = vi.fn();
    const path = {
      pathname: '/workbooks/42',
      search: '?chatId=abc',
      hash: '#results',
    };
    const options = {
      replace: true,
      state: { from: 'menu' },
      relative: 'path' as const,
      preventScrollReset: true,
    };
    const resolve = vi.fn(() => '/app/workbooks/42?chatId=abc#results');
    render(
      <Root navigation={{ useHref: resolve, useNavigate: () => navigate }}>
        <Menu aria-label="Workbooks">
          <Menu.Item
            key="workbook"
            to={path}
            navigationOptions={options}
            href="/ignored"
          >
            Workbook
          </Menu.Item>
        </Menu>
      </Root>,
    );
    const link = screen.getByRole('menuitem', { name: 'Workbook' });
    expect(link).toHaveAttribute(
      'href',
      '/app/workbooks/42?chatId=abc#results',
    );
    expect(link).not.toHaveAttribute('to');
    expect(link).not.toHaveAttribute('navigationOptions');
    expect(resolve).toHaveBeenCalledWith(path, { relative: 'path' });
    await userEvent.click(link);
    expect(navigate).toHaveBeenCalledExactlyOnceWith(path, options);
  });

  it.each(['Control', 'Meta', 'Shift', 'Alt'] as const)(
    'leaves %s-click native without same-tab routing',
    async (modifier) => {
      const { navigate } = renderMenu();
      const link = await openMenu();
      const clicks: MouseEvent[] = [];
      const record = (event: MouseEvent) => clicks.push(event);
      document.addEventListener('click', record, true);
      document.addEventListener('contextmenu', record, true);
      try {
        await act(async () => {
          await userEvent.click(link, { modifiers: [modifier] });
        });
        expect(navigate).not.toHaveBeenCalled();
        expect(clicks).toHaveLength(1);
        expect(clicks[0].isTrusted).toBe(true);
        expect(clicks[0].defaultPrevented).toBe(false);
      } finally {
        document.removeEventListener('click', record, true);
        document.removeEventListener('contextmenu', record, true);
      }
    },
  );

  it.each(['middle', 'right'] as const)(
    'preserves native %s-click behavior without routing or activation',
    async (button) => {
      const { navigate, onAction } = renderMenu();
      const link = await openMenu();
      const events: MouseEvent[] = [];
      const eventName = button === 'middle' ? 'auxclick' : 'contextmenu';
      const record = (event: MouseEvent) => events.push(event);
      document.addEventListener(eventName, record, true);
      try {
        await userEvent.click(link, { button });
        expect(navigate).not.toHaveBeenCalled();
        expect(onAction).not.toHaveBeenCalled();
        expect(events).toHaveLength(1);
        expect(events[0].isTrusted).toBe(true);
        expect(events[0].defaultPrevented).toBe(false);
        expect(link).toHaveAttribute('href', destination);
      } finally {
        document.removeEventListener(eventName, record, true);
      }
    },
  );

  it('keeps Arrow/Home/End, typeahead, Escape and focus restoration across links and commands', async () => {
    renderMenu();
    const link = await openMenu();
    await userEvent.keyboard('{Home}');
    expect(link).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(
      screen.getByRole('menuitem', { name: 'Create workbook' }),
    ).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(link).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(
      screen.getByRole('menuitem', { name: 'Create workbook' }),
    ).toHaveFocus();
    await userEvent.keyboard('w');
    expect(link).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Workbooks' })).toHaveFocus(),
    );
  });

  it('activates commands and both link layouts once through their hotkeys', async () => {
    const navigate = vi.fn();
    const commandAction = vi.fn();
    const linkAction = vi.fn();
    const inlineLinkAction = vi.fn();
    const independentAction = vi.fn();
    const menuAction = vi.fn();
    render(
      <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
        <Menu aria-label="Shortcuts" onAction={menuAction}>
          <Menu.Item key="command" hotkeys="F8" onAction={commandAction}>
            Command
          </Menu.Item>
          <Menu.Item
            key="link"
            to="/hotkey-link"
            hotkeys="F9"
            onAction={linkAction}
          >
            Link
          </Menu.Item>
          <Menu.Item
            key="inline-link"
            to="/hotkey-inline-link"
            hotkeys="F10"
            onAction={inlineLinkAction}
            actions={
              <Menu.Item.Action onPress={independentAction}>
                Delete
              </Menu.Item.Action>
            }
          >
            Link with actions
          </Menu.Item>
        </Menu>
      </Root>,
    );
    await act(() => screen.getByRole('menuitem', { name: 'Command' }).focus());
    await userEvent.keyboard('{F8}');
    expect(commandAction).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    await userEvent.keyboard('{F9}');
    expect(linkAction).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/hotkey-link', undefined);
    await userEvent.keyboard('{F10}');
    expect(inlineLinkAction).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenLastCalledWith('/hotkey-inline-link', undefined);
    expect(menuAction.mock.calls).toEqual([
      ['command'],
      ['link'],
      ['inline-link'],
    ]);
    expect(commandAction).toHaveBeenCalledTimes(1);
    expect(linkAction).toHaveBeenCalledTimes(1);
    expect(independentAction).not.toHaveBeenCalled();
  });

  it('uses a real router for relative Path destinations', async () => {
    function RoutedMenu() {
      const location = useLocation();
      return (
        <>
          <output aria-label="Location">
            {location.pathname}
            {location.search}
            {location.hash}
          </output>
          <Menu aria-label="Workbooks">
            <Menu.Item
              key="next"
              to={{ pathname: 'next', search: '?chatId=abc', hash: '#results' }}
            >
              Next workbook
            </Menu.Item>
          </Menu>
        </>
      );
    }
    render(
      <MemoryRouter initialEntries={['/workbooks']}>
        <Root navigation={{ useHref, useNavigate }}>
          <Routes>
            <Route path="workbooks/*" element={<RoutedMenu />} />
          </Routes>
        </Root>
      </MemoryRouter>,
    );
    const link = screen.getByRole('menuitem', { name: 'Next workbook' });
    expect(link).toHaveAttribute('href', '/workbooks/next?chatId=abc#results');
    await userEvent.click(link);
    expect(screen.getByRole('status', { name: 'Location' })).toHaveTextContent(
      '/workbooks/next?chatId=abc#results',
    );
  });

  it('preserves row focus and independent actions when action content changes', async () => {
    const navigate = vi.fn();
    const action = vi.fn();
    const content = (showActions: boolean, actionLabel = 'Delete') => (
      <Root
        navigation={{
          useHref: (to) => String(to),
          useNavigate: () => navigate,
        }}
      >
        <Menu aria-label="Workbooks">
          <Menu.Item
            key="workbook"
            to={destination}
            autoHideActions
            actions={
              showActions ? (
                <ItemButton onPress={action}>{actionLabel}</ItemButton>
              ) : null
            }
            styles={{ padding: '3x', color: '#purple' }}
          >
            Workbook
          </Menu.Item>
        </Menu>
      </Root>
    );
    const { rerender } = render(content(false));
    const initialRow = screen.getByRole('menuitem', { name: 'Workbook' });
    await act(() => initialRow.focus());
    await act(() => {
      flushSync(() => rerender(content(true)));
      expect(screen.getByRole('menuitem', { name: 'Workbook' })).toHaveFocus();
    });
    const row = screen.getByRole('menuitem', { name: 'Workbook' });
    const deleteButton = await screen.findByRole('button', { name: 'Delete' });
    const nativeLink = row.querySelector('a[data-menu-native-link]');
    expect(nativeLink).toHaveAttribute('href', destination);
    expect(nativeLink).not.toContainElement(deleteButton);
    expect(row).toHaveFocus();
    await waitFor(() => expect(deleteButton).toBeVisible());
    expect(getComputedStyle(row).paddingTop).toBe('24px');
    await act(() => rerender(content(true, 'Remove')));
    expect(screen.getByRole('menuitem', { name: 'Workbook' })).toBe(row);
    expect(row).toHaveFocus();
    const removeButton = await screen.findByRole('button', { name: 'Remove' });
    expect(nativeLink).not.toContainElement(removeButton);
    await userEvent.click(removeButton);
    expect(action).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    await act(() => row.focus());
    await act(() => {
      flushSync(() => rerender(content(false)));
      expect(screen.getByRole('menuitem', { name: 'Workbook' })).toHaveFocus();
    });
    const finalRow = screen.getByRole('menuitem', { name: 'Workbook' });
    expect(finalRow).toHaveAttribute('href', destination);
    expect(finalRow).toHaveFocus();
    expect(getComputedStyle(finalRow).paddingTop).toBe('24px');
  });

  it.each([
    { to: '!/workbooks', target: '_blank', rel: 'noopener noreferrer' },
    { to: '/workbooks', target: '_blank', rel: 'noreferrer' },
    { href: '/export.csv', download: 'workbook.csv' },
    {
      to: '!https://cube.dev/docs',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  ])('keeps native target/download attributes: %j', async (props) => {
    const navigate = vi.fn();
    const onClick = vi.fn();
    render(
      <Root
        navigation={{
          useHref: (to) => String(to),
          useNavigate: () => navigate,
        }}
      >
        <Menu aria-label="Destinations">
          <Menu.Item key="link" {...props} onClick={onClick}>
            Destination
          </Menu.Item>
        </Menu>
      </Root>,
    );
    const link = screen.getByRole('menuitem', { name: 'Destination' });
    if ('target' in props) expect(link).toHaveAttribute('target', props.target);
    if ('download' in props)
      expect(link).toHaveAttribute('download', props.download);
    if ('rel' in props) expect(link).toHaveAttribute('rel', props.rel);
    expect(link.getAttribute('href')).not.toMatch(/^[!@]/);
    await userEvent.click(link);
    expect(navigate).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalled();
    expect(onClick.mock.calls[0][0].defaultPrevented).toBe(false);
  });

  it('forces native navigation for the @ prefix', async () => {
    const originalUrl = location.href;
    const navigate = vi.fn();
    render(
      <Root
        navigation={{
          useHref: (to) => String(to),
          useNavigate: () => navigate,
        }}
      >
        <Menu aria-label="Destinations">
          <Menu.Item key="link" to="@#native-destination">
            Destination
          </Menu.Item>
        </Menu>
      </Root>,
    );
    try {
      await userEvent.click(
        screen.getByRole('menuitem', { name: 'Destination' }),
      );
      expect(location.hash).toBe('#native-destination');
      expect(navigate).not.toHaveBeenCalled();
    } finally {
      history.replaceState(null, '', originalUrl);
    }
  });

  it.each(['href', 'to'])(
    'keeps same-origin absolute %s destinations native',
    async (prop) => {
      const originalUrl = location.href;
      const destination = new URL(originalUrl);
      destination.hash = '#absolute-destination';
      const navigate = vi.fn();
      render(
        <Root
          navigation={{
            useHref: (to) => String(to),
            useNavigate: () => navigate,
          }}
        >
          <Menu aria-label="Destinations">
            <Menu.Item key="link" {...{ [prop]: destination.href }}>
              Destination
            </Menu.Item>
          </Menu>
        </Root>,
      );
      try {
        await userEvent.click(
          screen.getByRole('menuitem', { name: 'Destination' }),
        );
        expect(location.hash).toBe('#absolute-destination');
        expect(navigate).not.toHaveBeenCalled();
      } finally {
        history.replaceState(null, '', originalUrl);
      }
    },
  );

  it.each([{ isDisabled: true }, { isLoading: true }])(
    'keeps unavailable to links inert: %j',
    async (props) => {
      const navigate = vi.fn();
      const onAction = vi.fn();
      render(
        <Root
          navigation={{
            useHref: (to) => String(to),
            useNavigate: () => navigate,
          }}
        >
          <Menu aria-label="Destinations" onAction={onAction}>
            <Menu.Item key="link" to={destination} {...props}>
              Destination
            </Menu.Item>
          </Menu>
        </Root>,
      );
      const link = screen.getByRole('menuitem', { name: 'Destination' });
      expect(link).toHaveAttribute('aria-disabled', 'true');
      expect(link).not.toHaveAttribute('href');
      await userEvent.click(link, { force: true });
      await userEvent.click(link, { button: 'middle', force: true });
      await act(() => link.focus());
      await userEvent.keyboard('{Enter} ');
      expect(navigate).not.toHaveBeenCalled();
      expect(onAction).not.toHaveBeenCalled();
    },
  );

  it('keeps submenu parents as commands and activates submenu links once', async () => {
    const navigate = vi.fn();
    render(
      <Root
        navigation={{
          useHref: (to) => String(to),
          useNavigate: () => navigate,
        }}
      >
        <MenuTrigger>
          <Button>Destinations</Button>
          <Menu>
            <Menu.SubMenuTrigger>
              <Menu.Item key="parent" to="/ignored">
                Workbooks
              </Menu.Item>
              <Menu>
                <Menu.Item key="link" to={destination}>
                  Workbook
                </Menu.Item>
              </Menu>
            </Menu.SubMenuTrigger>
          </Menu>
        </MenuTrigger>
      </Root>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Destinations' }));
    const parent = await screen.findByRole('menuitem', { name: 'Workbooks' });
    expect(parent.tagName).toBe('LI');
    expect(parent).not.toHaveAttribute('href');
    await userEvent.keyboard('{Home}{ArrowRight}');
    const link = await screen.findByRole('menuitem', { name: 'Workbook' });
    await waitFor(() => expect(link).toHaveFocus());
    expect(navigate).not.toHaveBeenCalled();
    await userEvent.keyboard('{Enter}');
    expect(navigate).toHaveBeenCalledExactlyOnceWith(destination, undefined);
  });

  it('activates only once while Space is held and does not activate during composition', async () => {
    const navigate = vi.fn();
    render(
      <Root
        navigation={{
          useHref: (to) => String(to),
          useNavigate: () => navigate,
        }}
      >
        <Menu aria-label="Destinations">
          <Menu.Item key="link" to={destination}>
            Destination
          </Menu.Item>
        </Menu>
      </Root>,
    );
    const link = screen.getByRole('menuitem', { name: 'Destination' });
    await act(() => link.focus());
    await userEvent.keyboard('[Space>3/]');
    expect(navigate).toHaveBeenCalledTimes(1);
    navigate.mockClear();
    // Browser keyboard drivers cannot create an IME composition event.
    await act(() => {
      link.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: ' ',
          bubbles: true,
          isComposing: true,
        }),
      );
      link.dispatchEvent(
        new KeyboardEvent('keyup', {
          key: ' ',
          bubbles: true,
          isComposing: true,
        }),
      );
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it.each(['/help', destination])(
    'preserves the inherited Aria router for an independent action: %s',
    async (href) => {
      const rowNavigate = vi.fn();
      const actionNavigate = vi.fn();
      const actionOptions = { replace: true };
      function InlineLink() {
        const ref = useRef<HTMLAnchorElement>(null);
        const { linkProps } = useLink(
          { href, routerOptions: actionOptions as never },
          ref,
        );
        return (
          <a {...linkProps} ref={ref}>
            Help
          </a>
        );
      }
      render(
        <RouterProvider
          navigate={actionNavigate}
          useHref={(href) => `/app${href}`}
        >
          <Root
            navigation={{
              useHref: (to) => String(to),
              useNavigate: () => rowNavigate,
            }}
          >
            <Menu aria-label="Destinations">
              <Menu.Item
                key="link"
                to={destination}
                navigationOptions={{ state: 'row' }}
                actions={<InlineLink />}
              >
                Destination
              </Menu.Item>
            </Menu>
          </Root>
        </RouterProvider>,
      );
      const action = screen.getByRole('link', { name: 'Help' });
      expect(action).toHaveAttribute('href', `/app${href}`);
      await userEvent.click(action);
      expect(actionNavigate).toHaveBeenCalledExactlyOnceWith(
        href,
        actionOptions,
      );
      expect(rowNavigate).not.toHaveBeenCalled();
    },
  );

  it.each(['@folder', '!folder'])(
    'preserves literal native href paths: %s',
    async (href) => {
      const navigate = vi.fn();
      render(
        <Root
          navigation={{
            useHref: (to) => String(to),
            useNavigate: () => navigate,
          }}
        >
          <Menu aria-label="Destinations">
            <Menu.Item key="link" href={href}>
              Destination
            </Menu.Item>
          </Menu>
        </Root>,
      );
      const link = screen.getByRole('menuitem', { name: 'Destination' });
      expect(link).toHaveAttribute('href', href);
      expect(link).not.toHaveAttribute('target');
      await userEvent.click(link);
      expect(navigate).toHaveBeenCalledExactlyOnceWith(href, undefined);
    },
  );

  it('keeps an empty native href as a current-document link rather than a selected command', async () => {
    const navigate = vi.fn();
    const onSelectionChange = vi.fn();
    render(
      <Root
        navigation={{
          useHref: (to) => String(to),
          useNavigate: () => navigate,
        }}
      >
        <Menu
          aria-label="Destinations"
          selectionMode="multiple"
          onSelectionChange={onSelectionChange}
        >
          <Menu.Item
            key="link"
            href=""
            onClick={(event) => event.preventDefault()}
          >
            Current document
          </Menu.Item>
        </Menu>
      </Root>,
    );
    const link = screen.getByRole('menuitemcheckbox', {
      name: 'Current document',
    });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '');
    expect((link as HTMLAnchorElement).href).toBe(location.href);
    await userEvent.click(link);
    expect(navigate).not.toHaveBeenCalled();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('recognizes a bare native reload destination and leaves an empty to as a command', () => {
    render(
      <Root>
        <Menu aria-label="Destinations">
          <Menu.Item key="reload" to="@" target="_blank">
            Reload
          </Menu.Item>
          <Menu.Item key="command" to="">
            Command
          </Menu.Item>
        </Menu>
      </Root>,
    );
    expect(screen.getByRole('menuitem', { name: 'Reload' }).tagName).toBe('A');
    expect(screen.getByRole('menuitem', { name: 'Reload' })).toHaveAttribute(
      'href',
      '',
    );
    expect(
      (screen.getByRole('menuitem', { name: 'Reload' }) as HTMLAnchorElement)
        .href,
    ).toBe(location.href.split('#')[0]);
    expect(screen.getByRole('menuitem', { name: 'Command' }).tagName).toBe(
      'LI',
    );
  });

  it.each([
    { color: '#purple', styles: { color: '#danger-text' } },
    {
      color: { pressed: '#danger-text' },
      styles: { color: '#purple-text' },
    },
  ])(
    'preserves direct color style-prop merging on sibling controls: %o',
    (props) => {
      render(
        <Root>
          <Menu aria-label="Destinations">
            <Menu.Item
              key="link"
              to={destination}
              {...props}
              actions={<Menu.Item.Action>Link action</Menu.Item.Action>}
            >
              Link
            </Menu.Item>
            <Menu.Item
              key="command"
              {...props}
              actions={<Menu.Item.Action>Command action</Menu.Item.Action>}
            >
              Command
            </Menu.Item>
          </Menu>
        </Root>,
      );
      const row = screen.getByRole('menuitem', { name: 'Link' });
      const linkRun = screen.getByRole('button', {
        name: 'Link action',
      }).parentElement!;
      const commandRun = screen.getByRole('button', {
        name: 'Command action',
      }).parentElement!;
      expect(getComputedStyle(linkRun).color).toBe(getComputedStyle(row).color);
      expect(getComputedStyle(linkRun).color).toBe(
        getComputedStyle(commandRun).color,
      );
    },
  );

  it('preserves named style states for sibling color and Actions maps', () => {
    const styles = {
      '@highlight': '[data-accent]',
      color: { '': '#dark', '@highlight': '#purple-text' },
      Actions: { padding: { '': '0x', '@highlight': '2x' } },
    };
    render(
      <Root>
        <Menu aria-label="Destinations">
          <Menu.Item
            key="link"
            to={destination}
            mods={{ accent: true }}
            styles={styles}
            actions={<Menu.Item.Action>Link action</Menu.Item.Action>}
          >
            Link
          </Menu.Item>
          <Menu.Item
            key="command"
            mods={{ accent: true }}
            styles={styles}
            actions={<Menu.Item.Action>Command action</Menu.Item.Action>}
          >
            Command
          </Menu.Item>
        </Menu>
      </Root>,
    );
    const row = screen.getByRole('menuitem', { name: 'Link' });
    const run = screen.getByRole('button', {
      name: 'Link action',
    }).parentElement!;
    const commandRun = screen.getByRole('button', {
      name: 'Command action',
    }).parentElement!;
    expect(getComputedStyle(run).color).toBe(getComputedStyle(row).color);
    expect(getComputedStyle(run).padding).toBe('16px');
    expect(getComputedStyle(run).padding).toBe(
      getComputedStyle(commandRun).padding,
    );
  });

  it('evaluates local focus predicates on the row for independent controls', async () => {
    const styles = {
      '@focus': ':focus',
      color: { '': '#purple-text', '@focus': '#danger-text' },
      Actions: { color: '#current', padding: { '': '0x', '@focus': '2x' } },
    };
    render(
      <Root>
        <Menu aria-label="Destinations">
          <Menu.Item
            key="link"
            to={destination}
            styles={styles}
            actions={<Menu.Item.Action>Link action</Menu.Item.Action>}
          >
            Link
          </Menu.Item>
          <Menu.Item
            key="command"
            styles={styles}
            actions={<Menu.Item.Action>Command action</Menu.Item.Action>}
          >
            Command
          </Menu.Item>
        </Menu>
      </Root>,
    );
    const row = screen.getByRole('menuitem', { name: 'Link' });
    const run = screen.getByRole('button', {
      name: 'Link action',
    }).parentElement!;
    const command = screen.getByRole('menuitem', { name: 'Command' });
    const commandRun = screen.getByRole('button', {
      name: 'Command action',
    }).parentElement!;
    const restingColor = getComputedStyle(row).color;
    expect(getComputedStyle(run).padding).toBe('0px');
    await act(() => row.focus());
    await waitFor(() => {
      expect(row).toHaveFocus();
      expect(getComputedStyle(row).color).not.toBe(restingColor);
      expect(getComputedStyle(run).color).toBe(getComputedStyle(row).color);
      expect(getComputedStyle(run).padding).toBe('16px');
    });
    await act(() => command.focus());
    await waitFor(() => {
      expect(getComputedStyle(run).padding).toBe('0px');
      expect(getComputedStyle(run).color).toBe(getComputedStyle(row).color);
      expect(getComputedStyle(commandRun).color).toBe(
        getComputedStyle(command).color,
      );
      expect(getComputedStyle(commandRun).padding).toBe('16px');
    });
  });

  it.each([
    { color: null },
    { color: false },
    { Actions: { padding: null } },
    { Actions: null },
    { color: '#purple-text', Actions: { color: null } },
    { color: '#purple-text', Actions: { color: false } },
  ])('preserves explicit style resets on sibling controls: %o', (styles) => {
    render(
      <Root>
        <Menu aria-label="Destinations">
          <Menu.Item
            key="link"
            to={destination}
            theme="special"
            styles={styles}
            actions={<Menu.Item.Action>Link action</Menu.Item.Action>}
          >
            Link
          </Menu.Item>
          <Menu.Item
            key="command"
            theme="special"
            styles={styles}
            actions={<Menu.Item.Action>Command action</Menu.Item.Action>}
          >
            Command
          </Menu.Item>
        </Menu>
      </Root>,
    );
    const row = screen.getByRole('menuitem', { name: 'Link' });
    const command = screen.getByRole('menuitem', { name: 'Command' });
    const run = screen.getByRole('button', {
      name: 'Link action',
    }).parentElement!;
    const commandRun = screen.getByRole('button', {
      name: 'Command action',
    }).parentElement!;
    expect(getComputedStyle(row).color).toBe(getComputedStyle(command).color);
    expect(getComputedStyle(run).color).toBe(
      getComputedStyle(commandRun).color,
    );
    expect(getComputedStyle(run).padding).toBe(
      getComputedStyle(commandRun).padding,
    );
  });

  it.each(['currentcolor', 'inherit', 'unset', '#current', '#current.5'])(
    'resolves Actions color %s against the row color',
    (color) => {
      const styles = {
        color: '#purple-text',
        Actions: { color },
      };
      render(
        <Root>
          <Menu aria-label="Destinations">
            <Menu.Item
              key="link"
              to={destination}
              theme="special"
              styles={styles}
              actions={<Menu.Item.Action>Link action</Menu.Item.Action>}
            >
              Link
            </Menu.Item>
            <Menu.Item
              key="command"
              theme="special"
              styles={styles}
              actions={<Menu.Item.Action>Command action</Menu.Item.Action>}
            >
              Command
            </Menu.Item>
          </Menu>
        </Root>,
      );
      const run = screen.getByRole('button', {
        name: 'Link action',
      }).parentElement!;
      const commandRun = screen.getByRole('button', {
        name: 'Command action',
      }).parentElement!;
      expect(getComputedStyle(run).color).toBe(
        getComputedStyle(commandRun).color,
      );
    },
  );

  it.each([{ '': 'relative', focused: '' }, { focused: '' }])(
    'merges Actions defaults with a conditional style map: %o',
    async (position) => {
      render(
        <Root>
          <Menu aria-label="Destinations">
            <Menu.Item
              key="link"
              to={destination}
              styles={{ Actions: { position } }}
              actions={<Menu.Item.Action>Delete</Menu.Item.Action>}
            >
              Destination
            </Menu.Item>
            <Menu.Item
              key="command"
              styles={{ Actions: { position } }}
              actions={<Menu.Item.Action>Command action</Menu.Item.Action>}
            >
              Command
            </Menu.Item>
          </Menu>
        </Root>,
      );
      const row = screen.getByRole('menuitem', { name: 'Destination' });
      const run = screen.getByRole('button', { name: 'Delete' }).parentElement!;
      const command = screen.getByRole('menuitem', { name: 'Command' });
      const commandRun = screen.getByRole('button', {
        name: 'Command action',
      }).parentElement!;
      expect(getComputedStyle(run).position).toBe(
        getComputedStyle(commandRun).position,
      );
      await act(() => row.focus());
      await waitFor(() =>
        expect(getComputedStyle(run).position).toBe('static'),
      );
      await act(() => command.focus());
      expect(getComputedStyle(commandRun).position).toBe('static');
    },
  );

  it('shares style token declarations with sibling controls', () => {
    render(
      <Root>
        <Menu aria-label="Destinations">
          <Menu.Item
            key="link"
            to={destination}
            styles={{
              '#purple': '#danger-text',
              '$menu-action-padding': '2x',
              color: '#purple',
              Actions: { padding: '$menu-action-padding' },
            }}
            actions={<Menu.Item.Action>Delete</Menu.Item.Action>}
          >
            Destination
          </Menu.Item>
        </Menu>
      </Root>,
    );
    const row = screen.getByRole('menuitem', { name: 'Destination' });
    const run = screen.getByRole('button', { name: 'Delete' }).parentElement!;
    expect(getComputedStyle(run).color).toBe(getComputedStyle(row).color);
    expect(getComputedStyle(run).padding).toBe('16px');
  });

  it('preserves the Actions styling slot and the row color on sibling controls', () => {
    render(
      <Root>
        <Menu aria-label="Destinations">
          <Menu.Item
            key="link"
            to={destination}
            styles={{
              color: '#purple',
              Actions: { padding: '2x', color: '#danger-text' },
            }}
            actions={<ItemButton>Delete link</ItemButton>}
          >
            Link
          </Menu.Item>
          <Menu.Item
            key="command"
            styles={{
              color: '#purple',
              Actions: { padding: '2x', color: '#danger-text' },
            }}
            actions={<ItemButton>Delete command</ItemButton>}
          >
            Command
          </Menu.Item>
          <Menu.Item
            key="color"
            to="/color"
            styles={{ color: '#purple' }}
            tokens={{ '#purple': '#danger-text' }}
            actions={<ItemButton>Delete color</ItemButton>}
          >
            Color
          </Menu.Item>
        </Menu>
      </Root>,
    );
    const linkRun = screen.getByRole('button', {
      name: 'Delete link',
    }).parentElement!;
    const commandRun = screen.getByRole('button', {
      name: 'Delete command',
    }).parentElement!;
    expect(getComputedStyle(linkRun).padding).toBe('16px');
    expect(getComputedStyle(linkRun).color).toBe(
      getComputedStyle(commandRun).color,
    );
    const colorRow = screen.getByRole('menuitem', { name: 'Color' });
    const colorRun = screen.getByRole('button', {
      name: 'Delete color',
    }).parentElement!;
    expect(getComputedStyle(colorRun).color).toBe(
      getComputedStyle(colorRow).color,
    );
  });

  it.each([
    { hide: true },
    { styles: { display: 'none' } },
    { style: { display: 'none' } },
  ])('hides the link and its actions together: %o', (props) => {
    render(
      <Root>
        <Menu aria-label="Destinations">
          <Menu.Item
            key="hidden"
            to={destination}
            qa="Hidden link"
            {...props}
            actions={
              <Menu.Item.Action qa="Hidden action">Delete</Menu.Item.Action>
            }
          >
            Destination
          </Menu.Item>
        </Menu>
      </Root>,
    );
    for (const qa of ['Hidden link', 'Hidden action']) {
      expect(screen.getByTestId(qa).getBoundingClientRect().width).toBe(0);
      expect(screen.getByTestId(qa).getBoundingClientRect().height).toBe(0);
    }
  });

  it.each([{ opacity: 0.25 }, { style: { opacity: 0.25 } }])(
    'fades the link and its actions once: %o',
    (props) => {
      render(
        <Root>
          <Menu aria-label="Destinations">
            <Menu.Item
              key="link"
              to={destination}
              {...props}
              actions={<Menu.Item.Action>Delete</Menu.Item.Action>}
            >
              Destination
            </Menu.Item>
          </Menu>
        </Root>,
      );
      function effectiveOpacity(element: HTMLElement) {
        let opacity = 1;
        for (
          let current: HTMLElement | null = element;
          current;
          current = current.parentElement
        )
          opacity *= Number(getComputedStyle(current).opacity);
        return opacity;
      }
      expect(effectiveOpacity(screen.getByRole('menuitem'))).toBe(0.25);
      expect(
        effectiveOpacity(screen.getByRole('button', { name: 'Delete' })),
      ).toBe(0.25);
    },
  );

  it.each([{ margin: '2x top' }, { style: { marginTop: 16 } }])(
    'keeps actions aligned when the row has a margin: %o',
    (props) => {
      render(
        <Root>
          <Menu aria-label="Destinations">
            <Menu.Item
              key="link"
              to={destination}
              {...props}
              actions={<Menu.Item.Action>Delete</Menu.Item.Action>}
            >
              Destination
            </Menu.Item>
          </Menu>
        </Root>,
      );
      const row = screen.getByRole('menuitem').getBoundingClientRect();
      const action = screen
        .getByRole('button', { name: 'Delete' })
        .getBoundingClientRect();
      expect(action.y + action.height / 2).toBeCloseTo(row.y + row.height / 2);
    },
  );

  it.each(['small', 'medium'] as const)(
    'preserves narrow, token and inline widths at %s size',
    (size) => {
      render(
        <Root>
          <Menu aria-label="Widths" size={size} styles={{ width: '30x' }}>
            {[
              { width: '16px' },
              { width: '$size' },
              { style: { width: '16px' } },
            ].flatMap((props, index) => [
              <Menu.Item
                key={`link${index}`}
                to={destination}
                qa={`link${index}`}
                {...props}
              >
                Row
              </Menu.Item>,
              <Menu.Item
                key={`command${index}`}
                qa={`command${index}`}
                {...props}
              >
                Row
              </Menu.Item>,
            ])}
          </Menu>
        </Root>,
      );
      for (let index = 0; index < 3; index++) {
        const row = screen.getByTestId(`link${index}`);
        const expectedWidth = screen
          .getByTestId(`command${index}`)
          .getBoundingClientRect().width;
        expect(row.getBoundingClientRect().width).toBe(expectedWidth);
      }
    },
  );

  it.each(
    [false, true].flatMap((actions) => [
      { mode: 'direct', actions, props: { height: '50%' } },
      { mode: 'styles', actions, props: { styles: { height: '50%' } } },
      { mode: 'inline', actions, props: { style: { height: '50%' } } },
    ]),
  )(
    'resolves percentage height against the menu once ($mode, actions=$actions)',
    ({ actions, props }) => {
      render(
        <Root>
          <Menu
            aria-label="Heights"
            styles={{ width: '30x' }}
            menuStyles={{
              // eslint-disable-next-line tasty/consistent-token-usage -- The percentage-height regression uses an exact 400px containing block.
              height: '400px',
            }}
          >
            <Menu.Item
              key="link"
              to={destination}
              {...props}
              actions={
                actions ? (
                  <Menu.Item.Action>Delete link</Menu.Item.Action>
                ) : undefined
              }
            >
              Link
            </Menu.Item>
            <Menu.Item
              key="command"
              {...props}
              actions={
                actions ? (
                  <Menu.Item.Action>Delete command</Menu.Item.Action>
                ) : undefined
              }
            >
              Command
            </Menu.Item>
          </Menu>
        </Root>,
      );
      const row = screen.getByRole('menuitem', { name: 'Link' });
      const command = screen.getByRole('menuitem', { name: 'Command' });
      expect(screen.getByRole('menu').getBoundingClientRect().height).toBe(400);
      expect(command.getBoundingClientRect().height).toBe(196);
      expect(row.getBoundingClientRect().height).toBe(196);
    },
  );

  it.each(
    [false, true].flatMap((actions) => [
      {
        mode: 'direct',
        actions,
        props: {
          width: '100px',
          padding: '10px',
          border: '1px solid #dark',
          styles: { boxSizing: 'content-box' as const },
        },
      },
      {
        mode: 'styles',
        actions,
        props: {
          styles: {
            width: '100px',
            padding: '10px',
            border: '1px solid #dark',
            boxSizing: 'content-box' as const,
          },
        },
      },
      {
        mode: 'inline',
        actions,
        props: {
          style: {
            width: '100px',
            padding: '10px',
            border: '1px solid transparent',
            boxSizing: 'content-box' as const,
          },
        },
      },
    ]),
  )(
    'preserves the content-box padding and border footprint ($mode, actions=$actions)',
    ({ actions, props }) => {
      render(
        <Root>
          <Menu aria-label="Widths" styles={{ width: '30x' }}>
            <Menu.Item
              key="link"
              to={destination}
              {...props}
              actions={
                actions ? (
                  <Menu.Item.Action>Delete link</Menu.Item.Action>
                ) : undefined
              }
            >
              Link
            </Menu.Item>
            <Menu.Item
              key="command"
              {...props}
              actions={
                actions ? (
                  <Menu.Item.Action>Delete command</Menu.Item.Action>
                ) : undefined
              }
            >
              Command
            </Menu.Item>
          </Menu>
        </Root>,
      );
      const row = screen.getByRole('menuitem', { name: 'Link' });
      const command = screen.getByRole('menuitem', { name: 'Command' });
      expect(getComputedStyle(command).width).toBe('100px');
      expect(command.getBoundingClientRect().width).toBe(122);
      expect(getComputedStyle(row).width).toBe('100px');
      expect(row.getBoundingClientRect().width).toBe(122);
    },
  );

  it.each([false, true])(
    'inherits the command color after resetting root color (actions=%s)',
    (actions) => {
      render(
        <Root>
          <Menu aria-label="Colors">
            <Menu.Item
              key="link"
              to={destination}
              styles={{ color: false }}
              actions={
                actions ? (
                  <Menu.Item.Action>Delete link</Menu.Item.Action>
                ) : undefined
              }
            >
              Link
            </Menu.Item>
            <Menu.Item
              key="command"
              styles={{ color: false }}
              actions={
                actions ? (
                  <Menu.Item.Action>Delete command</Menu.Item.Action>
                ) : undefined
              }
            >
              Command
            </Menu.Item>
          </Menu>
        </Root>,
      );
      const row = screen.getByRole('menuitem', { name: 'Link' });
      const command = screen.getByRole('menuitem', { name: 'Command' });
      const nativeLink = actions
        ? row.querySelector('a[data-menu-native-link]')!
        : row;
      expect(getComputedStyle(row).color).toBe(getComputedStyle(command).color);
      expect(getComputedStyle(nativeLink).color).toBe(
        getComputedStyle(command).color,
      );
      if (actions) {
        expect(
          getComputedStyle(screen.getByRole('button', { name: 'Delete link' }))
            .color,
        ).toBe(
          getComputedStyle(
            screen.getByRole('button', { name: 'Delete command' }),
          ).color,
        );
      }
    },
  );

  it.each([
    { styles: { maxWidth: '160px' } },
    { styles: { transform: 'translateX(16px)' } },
    { styles: { width: '50%' } },
    { width: 'calc(50% - 1x)' },
    { style: { width: '50%' } },
    { style: { maxWidth: '50%' } },
  ])(
    'keeps the anchor and actions inside the complete styled row: %j',
    (props) => {
      render(
        <Root>
          <Menu aria-label="Widths" styles={{ width: '30x' }}>
            <Menu.Item
              key="link"
              to={destination}
              qa="link"
              {...props}
              actions={
                <Menu.Item.Action qa="link-action">Delete</Menu.Item.Action>
              }
            >
              Row
            </Menu.Item>
            <Menu.Item
              key="command"
              qa="command"
              {...props}
              actions={
                <Menu.Item.Action qa="command-action">Delete</Menu.Item.Action>
              }
            >
              Row
            </Menu.Item>
          </Menu>
        </Root>,
      );
      const row = screen.getByTestId('link');
      const command = screen.getByTestId('command').getBoundingClientRect();
      const anchor = row.getBoundingClientRect();
      const owner = row.closest('li')!.getBoundingClientRect();
      expect(anchor.width).toBe(command.width);
      expect(owner.width).toBe(command.width);
      expect(anchor.left).toBe(command.left);
      expect(owner.left).toBe(command.left);
      const action = screen.getByTestId('link-action').getBoundingClientRect();
      const commandAction = screen
        .getByTestId('command-action')
        .getBoundingClientRect();
      expect(action.right).toBe(commandAction.right);
      expect(action.right).toBeLessThanOrEqual(anchor.right);
    },
  );

  it('keeps the entire native row inert, including its independent actions', async () => {
    const onPress = vi.fn();
    const navigate = vi.fn();
    render(
      <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
        <Menu aria-label="Destinations">
          <Menu.Item
            key="link"
            to={destination}
            inert
            actions={
              <Menu.Item.Action onPress={onPress}>Delete</Menu.Item.Action>
            }
          >
            Destination
          </Menu.Item>
        </Menu>
      </Root>,
    );
    const row = screen.getByRole('menuitem', {
      name: 'Destination',
      hidden: true,
    });
    const action = screen.getByRole('button', { name: 'Delete', hidden: true });
    expect(row.closest('li')).toHaveAttribute('inert');
    await userEvent.click(action, { force: true });
    await act(() => action.focus());
    expect(document.activeElement).not.toBe(action);
    expect(onPress).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('hides the native row and its actions from accessibility together', () => {
    render(
      <Root>
        <Menu aria-label="Destinations">
          <Menu.Item
            key="link"
            to={destination}
            aria-hidden
            actions={<Menu.Item.Action>Delete</Menu.Item.Action>}
          >
            Destination
          </Menu.Item>
        </Menu>
      </Root>,
    );
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete' }),
    ).not.toBeInTheDocument();
  });

  it('keeps row styling from growing CSS across repeated menu mounts', () => {
    const ruleCount = () =>
      [
        ...Array.from(document.styleSheets),
        ...document.adoptedStyleSheets,
      ].flatMap((sheet) => Array.from(sheet.cssRules)).length;
    const content = (
      <Root>
        <Menu aria-label="Destinations">
          <Menu.Item key="link" to={destination} opacity=".5">
            Destination
          </Menu.Item>
        </Menu>
      </Root>
    );
    const warmup = render(content);
    expect(getComputedStyle(screen.getByRole('menuitem')).opacity).toBe('0.5');
    const mountedRules = ruleCount();
    warmup.unmount();
    const unmountedRules = ruleCount();
    for (let index = 0; index < 3; index++) {
      const { unmount } = render(content);
      const row = screen.getByRole('menuitem');
      expect(getComputedStyle(row).opacity).toBe('0.5');
      expect(ruleCount()).toBeLessThanOrEqual(mountedRules);
      unmount();
      expect(ruleCount()).toBe(unmountedRules);
    }
  });

  it.each([
    { overflow: 'hidden' },
    { styles: { overflow: 'hidden' } },
    { style: { overflow: 'hidden' } },
  ])('clips independent actions to the complete native row: %j', (props) => {
    render(
      <Root>
        <Menu aria-label="Destinations" styles={{ width: '30x' }}>
          <Menu.Item key="before">Before destination</Menu.Item>
          <Menu.Item
            key="link"
            to={destination}
            height="2x"
            {...props}
            styles={{
              overflow: 'styles' in props ? props.styles.overflow : undefined,
              Actions: { translate: '0 -2x' },
            }}
            actions={<Menu.Item.Action>Delete</Menu.Item.Action>}
          >
            Destination
          </Menu.Item>
        </Menu>
        <Menu aria-label="Visible actions" styles={{ width: '30x' }}>
          <Menu.Item key="before">Before control</Menu.Item>
          <Menu.Item
            key="control"
            height="2x"
            overflow="visible"
            styles={{ Actions: { translate: '0 -2x' } }}
            actions={<Menu.Item.Action>Control action</Menu.Item.Action>}
          >
            Control
          </Menu.Item>
        </Menu>
      </Root>,
    );
    const row = screen.getByRole('menuitem', { name: 'Destination' });
    const action = screen.getByRole('button', { name: 'Delete' });
    const rect = row.getBoundingClientRect();
    const button = action.getBoundingClientRect();
    expect(button.top).toBeLessThan(rect.top);
    const hit = document.elementFromPoint(
      button.left + button.width / 2,
      rect.top - 1,
    );
    expect(hit?.closest('[data-element="Actions"]')).toBeNull();
    expect(getComputedStyle(row).overflow).toBe('hidden');
    const control = screen.getByRole('menuitem', { name: 'Control' });
    const controlAction = screen.getByRole('button', {
      name: 'Control action',
    });
    const controlRect = control.getBoundingClientRect();
    const controlButton = controlAction.getBoundingClientRect();
    expect(controlButton.top).toBeLessThan(controlRect.top);
    expect(
      document
        .elementFromPoint(
          controlButton.left + controlButton.width / 2,
          controlRect.top - 1,
        )
        ?.closest('button'),
    ).toBe(controlAction);
  });

  it('orders the entire link row in the menu flex layout', () => {
    render(
      <Root>
        <Menu aria-label="Destinations">
          <Menu.Item key="command">First</Menu.Item>
          <Menu.Item key="link" to={destination} order={-1}>
            Destination
          </Menu.Item>
        </Menu>
      </Root>,
    );
    expect(
      screen
        .getByRole('menuitem', { name: 'Destination' })
        .getBoundingClientRect().top,
    ).toBeLessThan(
      screen.getByRole('menuitem', { name: 'First' }).getBoundingClientRect()
        .top,
    );
  });

  it('evaluates whole-row layout states on the focused anchor', async () => {
    render(
      <Root>
        <Menu aria-label="Destinations">
          <Menu.Item
            key="link"
            to={destination}
            styles={{
              '@focus': ':focus',
              '$row-opacity': '.25',
              opacity: { '': '$row-opacity', '@focus': '.5' },
              margin: { '': '0x', '@focus': '2x top' },
            }}
            actions={<Menu.Item.Action>Delete</Menu.Item.Action>}
          >
            Destination
          </Menu.Item>
        </Menu>
      </Root>,
    );
    const row = screen.getByRole('menuitem');
    const owner = row.closest('li')!;
    expect(getComputedStyle(owner).opacity).toBe('0.25');
    await act(() => row.focus());
    await waitFor(() => {
      expect(getComputedStyle(owner).opacity).toBe('0.5');
      expect(getComputedStyle(owner).marginTop).toBe('16px');
    });
    const rowRect = row.getBoundingClientRect();
    const action = screen
      .getByRole('button', { name: 'Delete' })
      .getBoundingClientRect();
    expect(action.y + action.height / 2).toBeCloseTo(
      rowRect.y + rowRect.height / 2,
    );
  });

  it('keeps sibling color and Actions maps in the row press state', async () => {
    render(
      <Root navigation={{ useHref: String, useNavigate: () => vi.fn() }}>
        <Menu aria-label="Destinations">
          <Menu.Item
            key="link"
            to={destination}
            styles={{
              color: { '': '#purple-text', pressed: '#danger-text' },
              Actions: { padding: { '': '0x', pressed: '2x' } },
            }}
            actions={<Menu.Item.Action>Delete</Menu.Item.Action>}
          >
            Destination
          </Menu.Item>
        </Menu>
      </Root>,
    );
    const row = screen.getByRole('menuitem', { name: 'Destination' });
    const run = screen.getByRole('button', { name: 'Delete' }).parentElement!;
    const restingColor = getComputedStyle(row).color;
    const pointer = pointerUserEvent.setup();
    await act(() => pointer.pointer({ keys: '[MouseLeft>]', target: row }));
    try {
      await waitFor(
        () => {
          expect(row).toHaveAttribute('data-pressed');
          expect(getComputedStyle(row).color).not.toBe(restingColor);
          expect(getComputedStyle(run).color).toBe(getComputedStyle(row).color);
          expect(getComputedStyle(run).padding).toBe('16px');
        },
        { timeout: 1000 },
      );
    } finally {
      await act(() => pointer.pointer({ keys: '[/MouseLeft]', target: row }));
    }
    await waitFor(() => {
      expect(row).not.toHaveAttribute('data-pressed');
      expect(getComputedStyle(run).padding).toBe('0px');
    });
  });
});
