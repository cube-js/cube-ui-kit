import { Meta, Story } from '@storybook/react';
import { userEvent, within } from '@storybook/testing-library';

import { baseProps } from '../../../stories/lists/baseProps';

import { Switch, CubeSwitchProps } from './Switch';

export default {
  title: 'Forms/Switch',
  component: Switch,
  args: {
    label: 'Switch',
  },
  parameters: { controls: { exclude: baseProps }, layout: 'centered' },
} as Meta<CubeSwitchProps>;

const Template: Story<CubeSwitchProps> = (args) => <Switch {...args} />;

export const Default = Template.bind({});
Default.play = async ({ canvasElement }) => {
  const { getByRole } = within(canvasElement);

  const input = getByRole('switch');

  await userEvent.click(input);
};

export const WithoutLabel = Template.bind({});
WithoutLabel.args = {
  label: '',
};

export const Checked = Template.bind({});
Checked.args = {
  isSelected: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
};

export const DisabledChecked = Template.bind({});
DisabledChecked.args = {
  isDisabled: true,
  isSelected: true,
};

export const Loading = Template.bind({});
Loading.args = {
  isLoading: true,
};

export const LoadingChecked = Template.bind({});
LoadingChecked.args = {
  isLoading: true,
  isSelected: true,
};

export const LoadingDisabled = Template.bind({});
LoadingDisabled.args = {
  isLoading: true,
  isDisabled: true,
};

export const LoadingDisabledChecked = Template.bind({});
LoadingDisabledChecked.args = {
  isLoading: true,
  isDisabled: true,
  isSelected: true,
};
