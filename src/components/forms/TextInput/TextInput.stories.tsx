import { DollarCircleOutlined } from '@ant-design/icons';
import { StoryFn } from '@storybook/react';

import {
  ICON_ARG,
  TEXT_VALUE_ARG,
  VALIDATION_STATE_ARG,
} from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';

import { TextInput, CubeTextInputProps } from './TextInput';

export default {
  title: 'Forms/TextInput',
  component: TextInput,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...TEXT_VALUE_ARG,
    ...ICON_ARG,
    ...VALIDATION_STATE_ARG,
  },
};

const Template: StoryFn<CubeTextInputProps> = (args) => <TextInput {...args} />;

export const Default = Template.bind({});
Default.args = {};

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultValue: 'default value' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: <DollarCircleOutlined /> };

export const Password = Template.bind({});
Password.args = { icon: <DollarCircleOutlined />, type: 'password' };

export const Invalid = Template.bind({});
Invalid.args = { validationState: 'invalid' };

export const Disabled = Template.bind({});
Disabled.args = { isDisabled: true };
