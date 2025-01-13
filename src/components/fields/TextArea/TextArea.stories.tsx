import { DollarCircleOutlined } from '@ant-design/icons';
import { StoryFn } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';
import { TEXT_VALUE_ARG } from '../../../stories/FormFieldArgs';

import { CubeTextAreaProps, TextArea } from './TextArea';

export default {
  title: 'Forms/TextArea',
  component: TextArea,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...TEXT_VALUE_ARG,
  },
};

const Template: StoryFn<CubeTextAreaProps> = ({ icon, ...props }) => (
  <TextArea
    icon={icon ? <DollarCircleOutlined /> : null}
    {...props}
    onChange={(query) => console.log('change', query)}
  />
);

export const Default = Template.bind({});
Default.args = {};

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultValue: 'default value' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: true };

export const Password = Template.bind({});
Password.args = { icon: true, type: 'password', defaultValue: 'hidden value' };

export const AutoSize = Template.bind({});
AutoSize.args = { autoSize: true, defaultValue: '1\n2\n3\n4', rows: 1 };
