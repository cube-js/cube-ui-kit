import { StoryFn } from '@storybook/react-vite';

import { NO_SNAPSHOT } from '../../../stories/chromatic';
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
// `Action` is the unstyled base element, so `isDisabled` changes behaviour and attributes but paints nothing.
Disabled.parameters = NO_SNAPSHOT;
