import { StoryFn } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';

import { Action, CubeActionProps } from './Action';

export default {
  title: 'Actions/Action',
  component: Action,
  parameters: { controls: { exclude: baseProps } },
  argTypes: {},
};

const Template: StoryFn<CubeActionProps> = (props) => <Action {...props} />;

export const Default = Template.bind({});
Default.args = {
  children: 'Action',
};

export const Disabled = Template.bind({});
Disabled.args = {
  children: 'Action',
  isDisabled: true,
};
