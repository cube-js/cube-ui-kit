import {
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
  IconNote,
  IconX,
} from '@tabler/icons-react';

import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';

import { CubeItemCardProps, ItemCard } from './ItemCard';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Content/ItemCard',
  component: ItemCard,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    title: {
      control: { type: 'text' },
      description: 'Card heading',
    },
    children: {
      control: { type: 'text' },
      description: 'Card body content',
    },
    icon: {
      control: { type: null },
      description: 'Icon rendered before the content',
    },

    /* Presentation */
    theme: {
      options: ['default', 'success', 'danger', 'warning', 'note'],
      control: { type: 'radio' },
      description: 'Card theme',
      table: { defaultValue: { summary: 'default' } },
    },
    level: {
      options: [1, 2, 3, 4, 5, 6],
      control: { type: 'select' },
      description: 'Heading level for the title (h1-h6)',
      table: { defaultValue: { summary: 3 } },
    },
  },
} satisfies Meta<typeof ItemCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Card Title',
    children: 'This is the card body content with additional details.',
    icon: <IconInfoCircle />,
  },
};

export const Sizes = (args: CubeItemCardProps) => (
  <Space gap="1x" flow="column" width="max 400px">
    <ItemCard
      {...args}
      size="medium"
      title="Medium Card"
      icon={<IconInfoCircle />}
      actions={<ItemCard.Action icon={<IconX />} aria-label="Dismiss" />}
    >
      Default size suitable for most use cases.
    </ItemCard>
    <ItemCard
      {...args}
      size="large"
      title="Large Card"
      icon={<IconCheck />}
      actions={<ItemCard.Action icon={<IconX />} aria-label="Dismiss" />}
    >
      Larger size for prominent notifications.
    </ItemCard>
    <ItemCard
      {...args}
      size="xlarge"
      title="Extra Large Card"
      icon={<IconAlertTriangle />}
      actions={<ItemCard.Action icon={<IconX />} aria-label="Dismiss" />}
    >
      Extra large size for emphasized alerts.
    </ItemCard>
  </Space>
);
