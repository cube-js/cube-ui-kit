import { useSyncExternalStore } from 'react';
import { expect, within } from 'storybook/test';

import { Provider } from '../../../provider';

import { NavTabs } from './NavTabs';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type {
  NavigateLike,
  NavigationAdapter,
  To,
} from '../../../providers/navigation.types';
import type { CubeNavTabsProps } from './NavTabs';

const meta = {
  title: 'Navigation/NavTabs',
  component: NavTabs,
  subcomponents: { 'NavTabs.Item': NavTabs.Item },
  parameters: { layout: 'padded' },
  args: { label: 'Tenant' },
  argTypes: {
    /* Content */
    label: {
      control: { type: 'text' },
      description: 'Accessible name of the navigation landmark',
      table: { type: { summary: 'string' } },
    },
    children: {
      control: { type: null },
      description: '`NavTabs.Item` elements, each with a React `key`',
      table: { type: { summary: 'ReactNode' } },
    },

    /* Selection */
    activeKey: {
      // The stories take it from the URL, as an app takes it from its route.
      control: { type: null },
      description:
        "Key of the item for the current page. A sub-page passes its section's key",
      table: { type: { summary: 'string' } },
    },

    /* Presentation */
    placement: {
      control: { type: 'radio' },
      options: ['top', 'bottom', 'left', 'right'],
      description:
        'Where the strip sits: top/bottom keep it horizontal, left/right make it vertical',
      table: {
        defaultValue: { summary: 'top' },
        type: { summary: "'top' | 'bottom' | 'left' | 'right'" },
      },
    },
    tabListPadding: {
      control: { type: 'text' },
      description: 'Inline padding for the item list (e.g. "2x" → "0 2x")',
      table: { type: { summary: 'string' } },
    },
    barStyles: {
      control: { type: null },
      description: 'Custom tasty styles for the strip (Bar sub-element)',
      table: { type: { summary: 'Styles' } },
    },
    tabListStyles: {
      control: { type: null },
      description:
        'Custom tasty styles for the item list (TabList sub-element)',
      table: { type: { summary: 'Styles' } },
    },
  },
} satisfies Meta<typeof NavTabs>;

export default meta;

type Story = StoryObj<typeof meta>;

// Storybook has no router, so the URL hash stands in for one: a route goes
// after `#`. An app passes its router's hooks to `Root` instead.
const toPath = (to: To) => (typeof to === 'string' ? to : (to.pathname ?? ''));

const HASH_NAVIGATION: NavigationAdapter = {
  useHref: (to) => `#${toPath(to)}`,
  useNavigate: () =>
    ((to: To | number) => {
      if (typeof to === 'number') window.history.go(to);
      else window.location.hash = toPath(to);
    }) as NavigateLike,
};

const subscribeToHash = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);

  return () => window.removeEventListener('hashchange', onChange);
};

const SECTIONS = ['profile', 'users', 'groups'];

/** The current item follows the route, as `activeKey` would in an app. */
function TenantNav(props: Partial<CubeNavTabsProps>) {
  const hash = useSyncExternalStore(
    subscribeToHash,
    () => window.location.hash,
  );
  const activeKey =
    SECTIONS.find((key) => hash === `#/tenants/42/${key}`) ?? SECTIONS[0];

  return (
    <Provider navigation={HASH_NAVIGATION}>
      <NavTabs label="Tenant" {...props} activeKey={activeKey}>
        <NavTabs.Item key="profile" to="/tenants/42/profile">
          Profile
        </NavTabs.Item>
        <NavTabs.Item key="users" to="/tenants/42/users">
          Users
        </NavTabs.Item>
        <NavTabs.Item key="groups" to="/tenants/42/groups">
          Groups
        </NavTabs.Item>
        <NavTabs.Item key="preview" to="/tenants/42/preview" isDisabled>
          Preview
        </NavTabs.Item>
      </NavTabs>
    </Provider>
  );
}

export const Default: Story = {
  render: (args) => <TenantNav {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation', { name: 'Tenant' });

    await expect(
      within(nav).getByRole('link', { name: 'Users' }),
    ).toHaveAttribute('href', '#/tenants/42/users');
    // Exactly one item is the current page.
    await expect(nav.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  },
};

export const Vertical: Story = {
  render: (args) => <TenantNav {...args} placement="left" />,
};
