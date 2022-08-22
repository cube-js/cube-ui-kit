import { DollarCircleOutlined } from '@ant-design/icons';

import { SELECTED_KEY_ARG } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';

import { Select } from './Select';

export default {
  title: 'Pickers/Select',
  component: Select,
  parameters: { controls: { exclude: baseProps } },
  argTypes: SELECTED_KEY_ARG,
};

const options = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'violet',
];

const Template = ({
  icon,
  labelPosition,
  label,
  placeholder,
  isLoading,
  isDisabled,
  defaultSelectedKey,
  validationState,
  size,
  ...props
}) => {
  return (
    <Select
      icon={icon ? <DollarCircleOutlined /> : undefined}
      label={label}
      validationState={validationState}
      labelPosition={labelPosition}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isLoading={isLoading}
      defaultSelectedKey={defaultSelectedKey}
      size={size}
      width="200px"
      onSelectionChange={(query) => console.log('change', query)}
      {...props}
    >
      {options.map((option) => {
        return <Select.Item key={option}>{option}</Select.Item>;
      })}
    </Select>
  );
};

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
WithIcon.args = { icon: true };

export const OverTheCustomBG = Template.bind({});
OverTheCustomBG.parameters = { backgrounds: { default: 'gray' } };

export const Disabled = Template.bind({});
Disabled.args = { isDisabled: true, label: 'Disabled' };
