import { IconCoin } from '@tabler/icons-react';

import { Space } from '../../layout/Space';

import { Badge } from './Badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Content/Badge',
  component: Badge,
  args: {
    children: '1',
  },
  argTypes: {
    /* Content */
    children: {
      control: 'text',
      description: 'Badge content (typically a number or short text)',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    icon: {
      control: { type: null },
      description: 'Icon to display before the badge content',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    rightIcon: {
      control: { type: null },
      description: 'Icon to display after the badge content',
      table: {
        type: { summary: 'ReactNode' },
      },
    },

    /* Presentation */
    theme: {
      control: 'radio',
      options: [undefined, 'note', 'success', 'danger', 'special', 'disabled'],
      description: 'Visual theme of the badge',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
      },
    },
    type: {
      control: { type: null },
      description: 'Deprecated: Use theme instead',
      table: {
        type: { summary: 'string' },
      },
    },
    size: {
      control: 'radio',
      options: ['inline', 'xsmall', 'small', 'medium', 'large', 'xlarge'],
      description: 'Size of the badge',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'inline' },
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: '1',
  },
};

export const Themes: Story = {
  render: () => (
    <Space gap="1x" placeItems="center">
      <Badge theme="special">Special</Badge>
      <Badge theme="note">Note</Badge>
      <Badge theme="success">Success</Badge>
      <Badge theme="danger">Danger</Badge>
      <Badge theme="disabled">Disabled</Badge>
    </Space>
  ),
};

export const Numbers: Story = {
  render: () => (
    <Space gap="1x" placeItems="center">
      <Badge>1</Badge>
      <Badge>5</Badge>
      <Badge>12</Badge>
      <Badge>99</Badge>
      <Badge>999</Badge>
    </Space>
  ),
};

export const TextContent: Story = {
  render: () => (
    <Space gap="1x" placeItems="center">
      <Badge>NEW</Badge>
      <Badge theme="success">OK</Badge>
      <Badge theme="danger">ERR</Badge>
      <Badge theme="note">INFO</Badge>
    </Space>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Space gap="1x" placeItems="center">
      <Badge size="inline">8</Badge>
      <Badge size="xsmall">8</Badge>
      <Badge size="small">8</Badge>
      <Badge size="medium">8</Badge>
      <Badge size="large">8</Badge>
      <Badge size="xlarge">8</Badge>
    </Space>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Space gap="1x" placeItems="center">
      <Badge icon={<IconCoin />}>5</Badge>
      <Badge icon={<IconCoin />} theme="success">
        12
      </Badge>
      <Badge icon={<IconCoin />} theme="danger">
        99
      </Badge>
      <Badge icon={<IconCoin />} theme="note" size="small">
        NEW
      </Badge>
    </Space>
  ),
};

export const WithRightIcon: Story = {
  render: () => (
    <Space gap="1x" placeItems="center">
      <Badge rightIcon={<IconCoin />}>5</Badge>
      <Badge rightIcon={<IconCoin />} theme="success">
        OK
      </Badge>
      <Badge rightIcon={<IconCoin />} theme="danger" size="small">
        ERR
      </Badge>
    </Space>
  ),
};

export const WithBothIcons: Story = {
  render: () => (
    <Space gap="1x" placeItems="center">
      <Badge icon={<IconCoin />} rightIcon={<IconCoin />}>
        NEW
      </Badge>
      <Badge icon={<IconCoin />} rightIcon={<IconCoin />} theme="success">
        5
      </Badge>
      <Badge
        icon={<IconCoin />}
        rightIcon={<IconCoin />}
        theme="danger"
        size="small"
      >
        12
      </Badge>
    </Space>
  ),
};
