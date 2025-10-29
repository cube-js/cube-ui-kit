import { Meta, StoryObj } from '@storybook/react-vite';

import { CheckIcon } from '../../../icons/CheckIcon';
import { KeyIcon } from '../../../icons/KeyIcon';
import { Item } from '../Item';

import { ItemBadge } from './ItemBadge';

const meta: Meta<typeof ItemBadge> = {
  title: 'Content/ItemBadge',
  component: ItemBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ItemBadge>;

export const Default: Story = {
  args: {
    icon: <KeyIcon />,
    tooltip: 'Information',
  },
};

export const WithLabel: Story = {
  args: {
    icon: <CheckIcon />,
    children: 'Success',
  },
};

export const Types: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <ItemBadge icon={<KeyIcon />} type="primary" tooltip="Primary" />
      <ItemBadge icon={<KeyIcon />} type="secondary" tooltip="Secondary" />
      <ItemBadge icon={<KeyIcon />} type="neutral" tooltip="Neutral" />
      <ItemBadge icon={<KeyIcon />} type="clear" tooltip="Clear" />
    </div>
  ),
};

export const Themes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <ItemBadge icon={<KeyIcon />} theme="default" tooltip="Default" />
      <ItemBadge icon={<KeyIcon />} theme="danger" tooltip="Danger" />
      <ItemBadge icon={<KeyIcon />} theme="success" tooltip="Success" />
      <ItemBadge icon={<KeyIcon />} theme="special" tooltip="Special" />
    </div>
  ),
};

export const Loading: Story = {
  args: {
    icon: <KeyIcon />,
    isLoading: true,
    tooltip: 'Loading...',
  },
};

export const Selected: Story = {
  args: {
    icon: 'checkbox',
    isSelected: true,
    tooltip: 'Selected',
  },
};

export const WithItem: Story = {
  render: () => (
    <Item
      size="large"
      actions={
        <>
          <Item.Badge icon={<KeyIcon />} tooltip="Primary" />
          <Item.Badge icon={<CheckIcon />} theme="success" tooltip="Success" />
        </>
      }
    >
      Item with badges
    </Item>
  ),
};

export const InContext: Story = {
  render: () => (
    <Item
      size="large"
      type="primary"
      theme="success"
      actions={
        <>
          <Item.Badge icon={<CheckIcon />} tooltip="Verified" />
          <Item.Badge icon={<KeyIcon />} tooltip="Primary" />
        </>
      }
    >
      Item with badges in context
    </Item>
  ),
};
