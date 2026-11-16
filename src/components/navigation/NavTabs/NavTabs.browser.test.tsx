import { userEvent } from 'vitest/browser';

import { act, render, screen, waitFor, within } from '../../../test';
import { Root } from '../../Root';
import { Tab, Tabs } from '../Tabs/Tabs';

import { NavTabs } from './NavTabs';

/**
 * NavTabs in a real browser: what is native and what is routed can only be
 * told apart by trusted events and real navigations, and only real layout shows
 * whether it matches `Tabs`.
 */

// A native navigation to this prefix answers 204, which keeps the test frame;
// the server records it (see `vitest.browser.config.ts`).
const BASE = '/__menu-link-test/nav-tabs';

async function nativeRequests(): Promise<{ url: string }[]> {
  return (await fetch('/__menu-link-test/requests')).json();
}

function recordEvents(type: string) {
  const events: Event[] = [];
  const record = (event: Event) => events.push(event);

  document.addEventListener(type, record, true);

  return {
    events,
    stop: () => document.removeEventListener(type, record, true),
  };
}

function renderNavTabs(path: string, { withRouter = true } = {}) {
  const navigate = vi.fn();
  const navTabs = (
    <NavTabs label="Tenant" activeKey="profile">
      <NavTabs.Item key="profile" to={`${path}/profile`}>
        Profile
      </NavTabs.Item>
      <NavTabs.Item key="users" to={`${path}/users`}>
        Users
      </NavTabs.Item>
    </NavTabs>
  );

  render(
    withRouter ? (
      <Root navigation={{ useHref: String, useNavigate: () => navigate }}>
        {navTabs}
      </Root>
    ) : (
      <Root>{navTabs}</Root>
    ),
  );

  return { navigate, users: screen.getByRole('link', { name: 'Users' }) };
}

describe('NavTabs', () => {
  it.each(['top', 'bottom', 'left', 'right'] as const)(
    'looks like Tabs with placement="%s"',
    async (placement) => {
      render(
        <Root>
          <Tabs label="Tabs" activeKey="users" placement={placement}>
            <Tab key="profile" title="Profile" />
            <Tab key="users" title="Users" />
          </Tabs>
          <NavTabs label="Nav" activeKey="users" placement={placement}>
            <NavTabs.Item key="profile" to="/profile">
              Profile
            </NavTabs.Item>
            <NavTabs.Item key="users" to="/users">
              Users
            </NavTabs.Item>
          </NavTabs>
        </Root>,
      );

      const tabs = screen.getByRole('tablist');
      const nav = screen.getByRole('navigation', { name: 'Nav' });
      const box = (element: Element) => {
        const { width, height } = element.getBoundingClientRect();

        return { width, height };
      };

      for (const name of ['Profile', 'Users']) {
        const tab = within(tabs).getByRole('tab', { name });
        const link = within(nav).getByRole('link', { name });

        expect(link.tagName).toBe('A');
        expect(box(link)).toEqual(box(tab));
        expect(getComputedStyle(link).color).toBe(getComputedStyle(tab).color);
        expect(getComputedStyle(link).textDecorationLine).toBe('none');
      }

      // The indicator sits under the current item, as under the selected tab.
      const indicator = (list: Element) =>
        list.querySelector<HTMLElement>(':scope > :not(:has([data-key]))');

      await waitFor(() => {
        expect(indicator(tabs)).not.toBeNull();
        expect(indicator(nav.querySelector('ul')!)).not.toBeNull();
      });

      const tabsIndicator = indicator(tabs)!.getBoundingClientRect();
      const navIndicator = indicator(
        nav.querySelector('ul')!,
      )!.getBoundingClientRect();

      expect(navIndicator.width).toBe(tabsIndicator.width);
      expect(navIndicator.height).toBe(tabsIndicator.height);
      expect(
        indicator(nav.querySelector('ul')!)!.getAttribute('aria-hidden'),
      ).toBe('true');
    },
  );

  it.each(['top', 'left'] as const)(
    'pads the item list with `tabListPadding` as Tabs does (placement="%s")',
    (placement) => {
      render(
        <Root>
          <Tabs label="Tabs" placement={placement} tabListPadding="4x">
            <Tab key="profile" title="Profile" />
          </Tabs>
          <NavTabs label="Nav" placement={placement} tabListPadding="4x">
            <NavTabs.Item key="profile" to="/profile">
              Profile
            </NavTabs.Item>
          </NavTabs>
        </Root>,
      );

      const padding = (list: Element) => {
        const style = getComputedStyle(list);

        return [
          style.paddingTop,
          style.paddingRight,
          style.paddingBottom,
          style.paddingLeft,
        ];
      };
      const navList = screen
        .getByRole('navigation', { name: 'Nav' })
        .querySelector('ul')!;

      expect(padding(navList)).toEqual(padding(screen.getByRole('tablist')));
      // `4x` is 32px: the prop reached the list, not just the default.
      expect(padding(navList)).toContain('32px');
    },
  );

  it.each(['top', 'left'] as const)(
    'scrolls the current item into a strip that overflows (placement="%s")',
    async (placement) => {
      const keys = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'];

      render(
        <Root>
          <NavTabs
            label="Nav"
            activeKey="seven"
            placement={placement}
            styles={{ width: '22x', height: '18x' }}
          >
            {keys.map((key) => (
              <NavTabs.Item key={key} to={`/${key}`}>
                Section {key}
              </NavTabs.Item>
            ))}
          </NavTabs>
        </Root>,
      );

      const nav = screen.getByRole('navigation', { name: 'Nav' });
      const strip = nav.querySelector('[data-element="Scroll"]')!;
      const current = within(nav).getByRole('link', { name: 'Section seven' });

      await waitFor(() => {
        const stripRect = strip.getBoundingClientRect();
        const itemRect = current.getBoundingClientRect();

        expect(itemRect.left).toBeGreaterThanOrEqual(stripRect.left - 1);
        expect(itemRect.right).toBeLessThanOrEqual(stripRect.right + 1);
        expect(itemRect.top).toBeGreaterThanOrEqual(stripRect.top - 1);
        expect(itemRect.bottom).toBeLessThanOrEqual(stripRect.bottom + 1);
      });
    },
  );

  it('routes a plain click once, with no native navigation on top', async () => {
    const path = `${BASE}/plain`;
    const { users, navigate } = renderNavTabs(path);
    const clicks = recordEvents('click');

    try {
      await userEvent.click(users);

      expect(navigate).toHaveBeenCalledExactlyOnceWith(
        `${path}/users`,
        undefined,
      );

      const trusted = clicks.events.filter((event) => event.isTrusted);

      expect(trusted).toHaveLength(1);
      expect(trusted[0].defaultPrevented).toBe(true);
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(await nativeRequests()).not.toContainEqual(
        expect.objectContaining({ url: `${path}/users` }),
      );
    } finally {
      clicks.stop();
    }
  });

  it.each(['Control', 'Shift', 'Meta'] as const)(
    'leaves a %s-click to the browser',
    async (modifier) => {
      const path = `${BASE}/modified-${modifier}`;
      const { users, navigate } = renderNavTabs(path);

      await userEvent.click(users, { modifiers: [modifier] });

      await waitFor(
        async () => {
          expect(await nativeRequests()).toContainEqual(
            expect.objectContaining({ url: `${path}/users` }),
          );
        },
        { timeout: 1500 },
      );
      expect(navigate).not.toHaveBeenCalled();
    },
  );

  it.each(['middle', 'right'] as const)(
    'keeps a %s-click native',
    async (button) => {
      const { users, navigate } = renderNavTabs(`${BASE}/${button}`);
      const native = recordEvents(
        button === 'middle' ? 'auxclick' : 'contextmenu',
      );

      try {
        await userEvent.click(users, { button });

        expect(native.events).toHaveLength(1);
        expect(native.events[0].isTrusted).toBe(true);
        expect(native.events[0].defaultPrevented).toBe(false);
        expect(navigate).not.toHaveBeenCalled();
      } finally {
        native.stop();
      }
    },
  );

  it('navigates natively when the app has no router', async () => {
    const path = `${BASE}/no-router`;
    const { users } = renderNavTabs(path, { withRouter: false });

    await userEvent.click(users);

    await waitFor(
      async () => {
        expect(await nativeRequests()).toContainEqual(
          expect.objectContaining({ url: `${path}/users` }),
        );
      },
      { timeout: 1500 },
    );
  });

  it('moves between items with Tab, not arrow keys, and routes Enter once', async () => {
    const path = `${BASE}/keyboard`;
    const { users, navigate } = renderNavTabs(path);
    const profile = screen.getByRole('link', { name: 'Profile' });

    act(() => profile.focus());

    await userEvent.keyboard('{ArrowRight}');
    expect(profile).toHaveFocus();

    await userEvent.keyboard('{Tab}');
    expect(users).toHaveFocus();
    expect(navigate).not.toHaveBeenCalled();

    await userEvent.keyboard('{Enter}');
    expect(navigate).toHaveBeenCalledExactlyOnceWith(
      `${path}/users`,
      undefined,
    );
  });
});
