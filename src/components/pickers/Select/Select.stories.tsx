import { DollarCircleOutlined } from '@ant-design/icons';
import { Meta, Story } from '@storybook/react';

import { SELECTED_KEY_ARG } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';

import { Select, CubeSelectProps } from './Select';

export default {
  title: 'Pickers/Select',
  component: Select,
  args: { width: '200px' },
  subcomponents: { Item: Select.Item },
  parameters: { controls: { exclude: baseProps } },
  argTypes: SELECTED_KEY_ARG,
} as Meta<CubeSelectProps<any>>;

const options = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'violet',
];

const Template: Story<CubeSelectProps<any>> = (args) => (
  <Select {...args}>
    {options.map((option) => (
      <Select.Item key={option}>{option}</Select.Item>
    ))}
  </Select>
);

export const Default = Template.bind({});
Default.args = {};

export const Primary = Template.bind({});
Primary.args = { type: 'primary', placeholder: 'primary' };

export const Clear = Template.bind({});
Clear.args = { type: 'clear', placeholder: 'clear' };

export const Invalid = Template.bind({});
Invalid.args = { selectedKey: 'yellow', validationState: 'invalid' };

export const Valid = Template.bind({});
Valid.args = { selectedKey: 'yellow', validationState: 'valid' };

export const WithPlaceholder = Template.bind({});
WithPlaceholder.args = { placeholder: 'Enter a value' };

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultSelectedKey: 'purple' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: <DollarCircleOutlined /> };

export const OverTheCustomBG = Template.bind({});
OverTheCustomBG.parameters = { backgrounds: { default: 'gray' } };

export const Disabled = Template.bind({});
Disabled.args = { isDisabled: true, label: 'Disabled' };

export const Wide: Story<CubeSelectProps<any>> = (args) => (
  <Select {...args}>
    {options.map((option) => (
      <Select.Item key={option}>
        {option} lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </Select.Item>
    ))}
  </Select>
);
Wide.args = { width: '500px', defaultSelectedKey: options[0] };
