import { useSyncExternalStore } from 'react';
import { expect, within } from 'storybook/test';

import { NavTabs } from './NavTabs';

import type { Meta, StoryObj } from '@storybook/react-vite';
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
      control: { type: 'text' },
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

const subscribeToHash = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);

  return () => window.removeEventListener('hashchange', onChange);
};

const SECTIONS = ['profile', 'users', 'groups'];

/**
 * The URL hash stands in for the app's router: each item links to one, and the
 * current item follows it.
 */
function TenantNav(props: Partial<CubeNavTabsProps>) {
  const hash = useSyncExternalStore(
    subscribeToHash,
    () => window.location.hash,
  );
  const activeKey = SECTIONS.find((key) => hash === `#${key}`) ?? SECTIONS[0];

  return (
    <NavTabs label="Tenant" {...props} activeKey={activeKey}>
      <NavTabs.Item key="profile" to="#profile">
        Profile
      </NavTabs.Item>
      <NavTabs.Item key="users" to="#users">
        Users
      </NavTabs.Item>
      <NavTabs.Item key="groups" to="#groups">
        Groups
      </NavTabs.Item>
      <NavTabs.Item key="preview" to="#preview" isDisabled>
        Preview
      </NavTabs.Item>
    </NavTabs>
  );
}

export const Default: Story = {
  render: (args) => <TenantNav {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation', { name: 'Tenant' });

    await expect(
      within(nav).getByRole('link', { name: 'Profile' }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(
      within(nav).getByRole('link', { name: 'Users' }),
    ).toHaveAttribute('href', '#users');
  },
};

export const Vertical: Story = {
  render: (args) => <TenantNav {...args} placement="left" />,
};
