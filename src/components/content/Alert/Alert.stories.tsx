import { Meta, StoryFn } from '@storybook/react-vite';

import { baseProps } from '../../../stories/lists/baseProps';

import { Alert } from './Alert';
import { CubeAlertProps } from './types';

export default {
  title: 'Content/Alert',
  component: Alert,
  parameters: { controls: { exclude: baseProps } },
  args: { children: 'Card content' },
} as Meta<typeof Alert>;

const Template: StoryFn<CubeAlertProps> = (args) => <Alert {...args} />;

export const Default = Template.bind({});

export const Success = Template.bind({});
Success.args = {
  theme: 'success',
};

export const Danger = Template.bind({});
Danger.args = {
  theme: 'danger',
};

export const Note = Template.bind({});
Note.args = {
  theme: 'note',
};

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
};

export const DisabledWithType = Template.bind({});
DisabledWithType.args = {
  theme: 'danger',
  isDisabled: true,
};

export const CustomStyling = Template.bind({});
CustomStyling.args = {
  padding: '4x',
  textAlign: 'center',
  fill: '#danger-bg',
};

export const SharpShape = Template.bind({});
SharpShape.args = {
  shape: 'sharp',
  theme: 'success',
};

export const CardShape = Template.bind({});
CardShape.args = {
  shape: 'card',
  theme: 'danger',
};
