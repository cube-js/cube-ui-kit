import { DollarCircleOutlined } from '@ant-design/icons';
import { Meta, Story } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';

import { Avatar, CubeAvatarProps } from './Avatar';

export default {
  title: 'Content/Avatar',
  component: Avatar,
  parameters: { controls: { exclude: baseProps } },
} as Meta<CubeAvatarProps>;

const Template: Story<CubeAvatarProps> = ({ ...args }) => <Avatar {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: 'CU',
};

export const WithIcon = Template.bind({});
WithIcon.args = {
  icon: <DollarCircleOutlined />,
};
