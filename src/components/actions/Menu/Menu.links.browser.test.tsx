import pointerUserEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { RouterProvider, useLink } from 'react-aria';
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

  it.each(['Control', 'Meta', 'Shift', 'Alt'])(
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
          await userEvent.keyboard(`{${modifier}>}`);
          await userEvent.click(link);
          await userEvent.keyboard(`{/${modifier}}`);
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

  it('renders inline actions beside the link and keeps the focused anchor across action updates', async () => {
    const navigate = vi.fn();
    const action = vi.fn();
    function App() {
      const [showActions, setShowActions] = useState(false);
      return (
        <>
          <button onClick={() => setShowActions(!showActions)}>
            Toggle actions
          </button>
          <Menu aria-label="Workbooks">
            <Menu.Item
              key="workbook"
              to={destination}
              autoHideActions
              actions={
                showActions ? (
                  <ItemButton onPress={action}>Delete</ItemButton>
                ) : null
              }
              styles={{ padding: '3x', color: '#purple' }}
            >
              Workbook
            </Menu.Item>
          </Menu>
        </>
      );
    }
    render(
      <Root
        navigation={{
          useHref: (to) => String(to),
          useNavigate: () => navigate,
        }}
      >
        <App />
      </Root>,
    );
    const link = screen.getByRole('menuitem', { name: 'Workbook' });
    await act(() => link.focus());
    await userEvent.click(
      screen.getByRole('button', { name: 'Toggle actions' }),
    );
    const deleteButton = await screen.findByRole('button', { name: 'Delete' });
    expect(link).not.toContainElement(deleteButton);
    expect(screen.getByRole('menuitem', { name: 'Workbook' })).toBe(link);
    await act(() => link.focus());
    await waitFor(() => expect(deleteButton).toBeVisible());
    expect(getComputedStyle(link).paddingTop).toBe('24px');
    await userEvent.click(deleteButton);
    expect(action).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
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

  it('preserves direct color style-prop precedence on sibling controls', () => {
    render(
      <Root>
        <Menu aria-label="Destinations">
          <Menu.Item
            key="link"
            to={destination}
            color="#purple"
            styles={{ color: '#danger-text' }}
            actions={<Menu.Item.Action>Link action</Menu.Item.Action>}
          >
            Link
          </Menu.Item>
          <Menu.Item
            key="command"
            color="#purple"
            styles={{ color: '#danger-text' }}
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
