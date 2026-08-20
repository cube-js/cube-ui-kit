import { Meta, StoryObj } from '@storybook/react-vite';

import { CheckIcon } from '../../../icons/CheckIcon';
import { KeyIcon } from '../../../icons/KeyIcon';
import { Space } from '../../layout/Space';
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
    <Space placeItems="center">
      <ItemBadge
        theme="default"
        icon={<KeyIcon />}
        type="primary"
        tooltip="Primary"
      />
      <ItemBadge
        theme="default"
        icon={<KeyIcon />}
        type="outline"
        tooltip="Outline"
      />
      <ItemBadge
        isSelected
        theme="default"
        icon={<KeyIcon />}
        type="outline"
        tooltip="Outline (selected)"
      />
      <ItemBadge theme="default" icon={<KeyIcon />} tooltip="Clear" />
      <ItemBadge
        isSelected
        theme="default"
        icon={<KeyIcon />}
        tooltip="Clear (selected)"
      />
    </Space>
  ),
};

export const Themes: Story = {
  render: () => (
    <Space placeItems="center">
      <ItemBadge icon={<KeyIcon />} theme="default" tooltip="Default" />
      <ItemBadge icon={<KeyIcon />} theme="danger" tooltip="Danger" />
      <ItemBadge icon={<KeyIcon />} theme="success" tooltip="Success" />
      <ItemBadge icon={<KeyIcon />} theme="special" tooltip="Special" />
      <Space
        fill="#note-surface"
        color="#note-accent-text"
        padding="1x"
        radius="1x"
        placeItems="center"
      >
        {/* `current` is the default theme: no color of its own, mixed from the
            container's inherited text color instead. */}
        <ItemBadge icon={<KeyIcon />} tooltip="Current (default)" />
      </Space>
    </Space>
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
    icon: 'checkmark',
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
