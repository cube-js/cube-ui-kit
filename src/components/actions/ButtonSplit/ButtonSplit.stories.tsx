import {
  IconCopy,
  IconDownload,
  IconPlayerPlay,
  IconPlus,
  IconSend,
} from '@tabler/icons-react';
import { useState } from 'react';

import { Button } from '..';
import { DirectionIcon } from '../../../icons/DirectionIcon';
import { baseProps } from '../../../stories/lists/baseProps';
import { Text } from '../../content/Text';
import { Space } from '../../layout/Space';
import { Menu } from '../Menu/Menu';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Actions/Button.Split',
  component: Button.Split,
  parameters: { controls: { exclude: baseProps } },
  argTypes: {
    /* Strict mode */
    actions: {
      control: { type: null },
      description: 'Array of actions for strict mode',
    },
    actionKey: {
      control: { type: 'text' },
      description: 'Currently selected action key (controlled)',
    },
    defaultActionKey: {
      control: { type: 'text' },
      description: 'Initially selected action key (uncontrolled)',
    },
    onAction: {
      action: 'action',
      control: { type: null },
      description: 'Called when the action button is pressed',
    },
    onActionChange: {
      action: 'actionChange',
      control: { type: null },
      description: 'Called when the selected action changes via the menu',
    },

    /* Presentation */
    type: {
      options: ['primary', 'secondary', 'outline', 'neutral', 'clear'],
      control: { type: 'radio' },
      description: 'Button type (inherited by children via context)',
      table: { defaultValue: { summary: 'outline' } },
    },
    theme: {
      options: ['default', 'danger', 'success', 'warning', 'note', 'special'],
      control: { type: 'radio' },
      description: 'Button theme (inherited by children via context)',
      table: { defaultValue: { summary: 'default' } },
    },
    size: {
      options: ['xsmall', 'small', 'medium', 'large', 'xlarge'],
      control: { type: 'radio' },
      description: 'Button size (inherited by children via context)',
      table: { defaultValue: { summary: 'medium' } },
    },

    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Disables all buttons (inherited via context)',
      table: { defaultValue: { summary: false } },
    },
  },
} satisfies Meta<typeof Button.Split>;

export default meta;
type Story = StoryObj<typeof meta>;

const DEPLOY_ACTIONS = [
  { key: 'deploy', label: 'Deploy', icon: <IconSend /> },
  { key: 'deploy-staging', label: 'Deploy to Staging', icon: <IconSend /> },
  { key: 'deploy-preview', label: 'Deploy Preview', icon: <IconPlayerPlay /> },
];

export const Default: Story = {
  args: {
    actions: DEPLOY_ACTIONS,
    defaultActionKey: 'deploy',
    type: 'primary',
  },
};

export const Custom: Story = {
  render: () => (
    <Button.Split type="primary">
      <Button onPress={() => console.log('Save')}>Save</Button>
      <Menu.Trigger placement="bottom end">
        <Button
          aria-label="More save options"
          icon={({ pressed }) => <DirectionIcon to={pressed ? 'up' : 'down'} />}
        />
        <Menu onAction={(key) => console.log('Selected:', key)}>
          <Menu.Item key="save-draft">Save as Draft</Menu.Item>
          <Menu.Item key="save-publish">Save & Publish</Menu.Item>
          <Menu.Item key="save-template">Save as Template</Menu.Item>
        </Menu>
      </Menu.Trigger>
    </Button.Split>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [currentKey, setCurrentKey] = useState('deploy');

    return (
      <Space gap="2x">
        <Button.Split
          actions={DEPLOY_ACTIONS}
          actionKey={currentKey}
          type="primary"
          onAction={(key) => console.log('Action:', key)}
          onActionChange={setCurrentKey}
        />
        <Text>Current action: {currentKey}</Text>
      </Space>
    );
  },
};

export const Variants: Story = {
  render: () => {
    const actions = [
      { key: 'copy', label: 'Copy', icon: <IconCopy /> },
      { key: 'download', label: 'Download', icon: <IconDownload /> },
    ];

    return (
      <Space gap="2x" flow="column">
        <Space gap="2x">
          <Button.Split
            actions={actions}
            defaultActionKey="copy"
            type="primary"
          />
          <Button.Split
            actions={actions}
            defaultActionKey="copy"
            type="secondary"
          />
          <Button.Split
            actions={actions}
            defaultActionKey="copy"
            type="outline"
          />
        </Space>
        <Space gap="2x">
          <Button.Split
            actions={actions}
            defaultActionKey="copy"
            type="primary"
            theme="danger"
          />
          <Button.Split
            actions={actions}
            defaultActionKey="copy"
            type="primary"
            theme="success"
          />
          <Button.Split
            isDisabled
            actions={actions}
            defaultActionKey="copy"
            type="primary"
          />
        </Space>
      </Space>
    );
  },
};

export const ThreeButtons: Story = {
  render: () => (
    <Button.Split type="outline">
      <Button icon={<IconPlus />}>Add</Button>
      <Button icon={<IconCopy />}>Copy</Button>
      <Button icon={<IconDownload />}>Export</Button>
    </Button.Split>
  ),
};
