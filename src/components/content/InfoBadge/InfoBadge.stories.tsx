import { Meta, StoryObj } from '@storybook/react-vite';

import { Switch } from '../../fields/Switch';
import { Flow } from '../../layout/Flow';
import { Space } from '../../layout/Space';
import { Paragraph } from '../Paragraph';
import { Text } from '../Text';

import { InfoBadge } from './InfoBadge';

const meta: Meta<typeof InfoBadge> = {
  title: 'Content/InfoBadge',
  component: InfoBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    tooltip: 'Deployments run in the region closest to your data source.',
  },
};

export default meta;
type Story = StoryObj<typeof InfoBadge>;

export const Default: Story = {};

export const AsLink: Story = {
  args: {
    to: '!https://docs.cube.dev',
  },
};

export const AsButton: Story = {
  args: {
    onPress: () => alert('Pressed'),
  },
};

export const WithoutSuffix: Story = {
  args: {
    to: '!https://docs.cube.dev',
    tooltipSuffix: null,
  },
};

export const Sizes: Story = {
  render: (args) => (
    <Space gap="1x" placeItems="center">
      <InfoBadge {...args} size="small" />
      <InfoBadge {...args} size="medium" />
      <InfoBadge {...args} size="large" />
    </Space>
  ),
};

/**
 * Every size contributes exactly one line to the text around it, so the badge
 * stays aligned with the label regardless of which one you pick.
 */
export const SizesInText: Story = {
  render: (args) => (
    <Flow gap="1x">
      {(['small', 'medium', 'large'] as const).map((size) => (
        <Paragraph key={size}>
          Deployments are billed per consumption unit{' '}
          <InfoBadge {...args} size={size} />
        </Paragraph>
      ))}
    </Flow>
  ),
};

export const Themes: Story = {
  render: (args) => (
    <Space gap="1x" placeItems="center">
      <InfoBadge {...args} theme="default" />
      <InfoBadge {...args} theme="danger" />
      <InfoBadge {...args} theme="success" />
    </Space>
  ),
};

export const Types: Story = {
  render: (args) => (
    <Space gap="1x" placeItems="center">
      <InfoBadge {...args} type="clear" />
      <InfoBadge {...args} type="outline" />
      <InfoBadge {...args} type="primary" />
    </Space>
  ),
};

export const InlineWithText: Story = {
  render: (args) => (
    <Paragraph>
      <Text>Deployments are billed per consumption unit</Text>{' '}
      <InfoBadge {...args} to="!https://docs.cube.dev" />
    </Paragraph>
  ),
};

/**
 * The badge contains its own press events, so it can live inside another click
 * target — here a switch label — without activating it.
 */
export const InsideClickableContainer: Story = {
  render: (args) => (
    <Switch label="Auto-suspend" labelSuffix={<InfoBadge {...args} />} />
  ),
};

/** Every field's `tooltip` prop renders an `InfoBadge` next to the label. */
export const InField: Story = {
  render: () => (
    <Switch
      label="Auto-suspend"
      tooltip="Suspends the deployment after a period of inactivity."
    />
  ),
};
