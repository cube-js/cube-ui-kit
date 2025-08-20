import { StoryFn } from '@storybook/react-vite';
import { IconCoin } from '@tabler/icons-react';

import { baseProps } from '../../../stories/lists/baseProps';

import { Avatar, CubeAvatarProps } from './Avatar';

export default {
  title: 'Content/Avatar',
  component: Avatar,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template: StoryFn<CubeAvatarProps> = ({ label, icon, ...args }) => (
  <Avatar {...args} icon={icon ? <IconCoin /> : null}>
    {label}
  </Avatar>
);

export const Default = Template.bind({});
Default.args = {
  label: 'CU',
};
