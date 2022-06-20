import { Select } from './Select';
import { DollarCircleOutlined } from '@ant-design/icons';
import { SELECTED_KEY_ARG } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';

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
      prefix={icon ? <DollarCircleOutlined /> : null}
      label={label}
      validationState={validationState}
      labelPosition={labelPosition}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isLoading={isLoading}
      defaultSelectedKey={defaultSelectedKey}
      onSelectionChange={(query) => console.log('change', query)}
      size={size}
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

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultSelectedKey: 'purple' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: true };

export const OverTheCustomBG = Template.bind({});
OverTheCustomBG.parameters = { backgrounds: { default: 'gray' } };

// export const Multiple = Template.bind({});
// Multiple.args = { icon: true, defaultSelectedKeys: ['red', 'violet'] };
