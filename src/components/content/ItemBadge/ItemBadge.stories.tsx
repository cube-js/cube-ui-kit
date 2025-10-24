import { Meta, StoryObj } from '@storybook/react-vite';

import { CheckIcon } from '../../../icons/CheckIcon';
import { KeyIcon } from '../../../icons/KeyIcon';
import { ItemBase } from '../ItemBase';

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

export const WithItemBase: Story = {
  render: () => (
    <ItemBase
      size="large"
      actions={
        <>
          <ItemBase.Badge icon={<KeyIcon />} tooltip="Primary" />
          <ItemBase.Badge
            icon={<CheckIcon />}
            theme="success"
            tooltip="Success"
          />
        </>
      }
    >
      Item with badges
    </ItemBase>
  ),
};

export const InContext: Story = {
  render: () => (
    <ItemBase
      size="large"
      type="primary"
      theme="success"
      actions={
        <>
          <ItemBase.Badge icon={<CheckIcon />} tooltip="Verified" />
          <ItemBase.Badge icon={<KeyIcon />} tooltip="Primary" />
        </>
      }
    >
      Item with badges in context
    </ItemBase>
  ),
};
