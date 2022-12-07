import { Meta, Story } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';

import { CubeNotificationProps, Notification } from './Notification';

export default {
  title: 'Overlays/Notification',
  component: Notification,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    label: {
      defaultValue: 'Notification text',
      control: 'text',
    },
  },
} as Meta<CubeNotificationProps>;

const Template: Story<CubeNotificationProps> = (args) => (
  <Notification {...args} />
);

export const Note = Template.bind({});
Note.args = {
  type: 'note',
  children: 'Notification text',
};

export const Danger = Template.bind({});
Danger.args = {
  type: 'danger',
  children: 'Notification text',
};

export const Success = Template.bind({});
Success.args = {
  type: 'success',
  children: 'Notification text',
};
