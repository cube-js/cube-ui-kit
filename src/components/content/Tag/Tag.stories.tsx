import { IconCoin } from '@tabler/icons-react';

import { Space } from '../../layout/Space';

import { Tag } from './Tag';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Content/Tag',
  component: Tag,
  args: {
    children: 'Tag',
  },
  argTypes: {
    /* Content */
    children: {
      control: 'text',
      description: 'Tag content',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    icon: {
      control: { type: null },
      description: 'Icon to display before the tag content',
      table: {
        type: { summary: 'ReactNode' },
      },
    },

    /* Presentation */
    theme: {
      control: 'radio',
      options: [
        undefined,
        'warning',
        'note',
        'success',
        'danger',
        'special',
        'disabled',
      ],
      description: 'Visual theme of the tag',
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
      options: ['inline', 'xsmall', 'small', 'medium', 'large'],
      description: 'Size of the tag',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'inline' },
      },
    },

    /* Behavior */
    isClosable: {
      control: 'boolean',
      description: 'Whether the tag can be closed',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },

    /* Events */
    onClose: {
      action: 'close',
      description: 'Handler called when close button is pressed',
      table: {
        type: { summary: '() => void' },
      },
    },

    /* Styles */
    closeButtonStyles: {
      control: { type: null },
      description: 'Custom styles for the close button',
      table: {
        type: { summary: 'Styles' },
      },
    },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default Tag',
  },
};

export const Themes: Story = {
  render: () => (
    <Space gap="1x">
      <Tag>Default</Tag>
      <Tag theme="warning">Warning</Tag>
      <Tag theme="note">Note</Tag>
      <Tag theme="success">Success</Tag>
      <Tag theme="danger">Danger</Tag>
      <Tag theme="special">Special</Tag>
      <Tag theme="disabled">Disabled</Tag>
    </Space>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Space gap="1x">
      <Tag icon={<IconCoin />}>With Icon</Tag>
      <Tag icon={<IconCoin />} theme="success">
        Success
      </Tag>
      <Tag icon={<IconCoin />} theme="danger">
        Danger
      </Tag>
    </Space>
  ),
};

export const Closable: Story = {
  render: () => (
    <Space gap="1x">
      <Tag isClosable>Default</Tag>
      <Tag isClosable theme="warning">
        Warning
      </Tag>
      <Tag isClosable theme="note">
        Note
      </Tag>
      <Tag isClosable theme="success">
        Success
      </Tag>
      <Tag isClosable theme="danger">
        Danger
      </Tag>
      <Tag isClosable theme="special">
        Special
      </Tag>
    </Space>
  ),
};

export const ClosableWithIcons: Story = {
  render: () => (
    <Space gap="1x">
      <Tag isClosable icon={<IconCoin />}>
        Default
      </Tag>
      <Tag isClosable icon={<IconCoin />} theme="success">
        Success
      </Tag>
      <Tag isClosable icon={<IconCoin />} theme="danger">
        Danger
      </Tag>
    </Space>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Space gap="1x" placeItems="center">
      <Tag size="inline">Inline (default)</Tag>
      <Tag size="xsmall">Extra Small</Tag>
      <Tag size="small">Small</Tag>
      <Tag size="medium">Medium</Tag>
      <Tag size="large">Large</Tag>
    </Space>
  ),
};

export const CustomStyles: Story = {
  args: {
    children: 'Custom Tag',
    styles: {
      fill: '#purple.10',
      color: '#purple',
      border: '#purple.30',
    },
  },
};
