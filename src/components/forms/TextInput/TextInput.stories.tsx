import { TextInput } from './TextInput';
import { DollarCircleOutlined } from '@ant-design/icons';
import { TEXT_VALUE_ARG } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';

export default {
  title: 'UIKit/Forms/TextInput',
  component: TextInput,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...TEXT_VALUE_ARG,
  },
};

const Template = ({ icon, ...props }) => (
  <TextInput
    prefix={icon ? <DollarCircleOutlined /> : null}
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
Password.args = { icon: true, type: 'password' };
