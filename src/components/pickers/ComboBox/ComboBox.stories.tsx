import { DollarCircleOutlined } from '@ant-design/icons';
import { Meta, Story } from '@storybook/react';

import { SELECTED_KEY_ARG } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';

import { ComboBox, CubeComboBoxProps } from './ComboBox';

export default {
  title: 'Pickers/ComboBox',
  component: ComboBox,
  subcomponents: { Item: ComboBox.Item },
  args: { id: 'name', width: '200px' },
  parameters: { controls: { exclude: baseProps } },
  argTypes: { ...SELECTED_KEY_ARG },
} as Meta<CubeComboBoxProps<any>>;

const Template: Story<CubeComboBoxProps<any>> = (args) => (
  <>
    <ComboBox {...args}>
      <ComboBox.Item key="red">Red</ComboBox.Item>
      <ComboBox.Item key="orange">Orange</ComboBox.Item>
      <ComboBox.Item key="yellow">Yellow</ComboBox.Item>
      <ComboBox.Item key="green">Green</ComboBox.Item>
      <ComboBox.Item key="blue">Blue</ComboBox.Item>
      <ComboBox.Item key="purple">Purple</ComboBox.Item>
      <ComboBox.Item key="violet">Violet</ComboBox.Item>
    </ComboBox>
  </>
);

export const Default = Template.bind({});
Default.args = {};

export const WithPlaceholder = Template.bind({});
WithPlaceholder.args = { placeholder: 'Enter a value' };

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultSelectedKey: 'purple' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: <DollarCircleOutlined /> };

export const Invalid = Template.bind({});
Invalid.args = { selectedKey: 'yellow', validationState: 'invalid' };

export const Valid = Template.bind({});
Valid.args = { selectedKey: 'yellow', validationState: 'valid' };

export const Disabled = Template.bind({});
Disabled.args = { selectedKey: 'yellow', isDisabled: true };

export const Wide: Story<CubeComboBoxProps<any>> = (args) => (
  <ComboBox {...args}>
    <ComboBox.Item key="red">
      Red lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </ComboBox.Item>
    <ComboBox.Item key="blue">
      Blue lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </ComboBox.Item>
  </ComboBox>
);

Wide.args = { width: '600px', defaultSelectedKey: 'red' };
