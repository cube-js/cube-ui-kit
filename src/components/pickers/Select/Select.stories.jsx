import { Select } from '../../../index';
import { DollarCircleOutlined } from '@ant-design/icons';
import {
  IS_DISABLED_ARG,
  IS_LOADING_ARG, LABEL_ARG, LABEL_POSITION_ARG, MESSAGE_ARG, PLACEHOLDER_ARG,
  SIZE_ARG,
  VALIDATION_STATE_ARG,
} from '../../../stories/FormFieldArgs';

export default {
  title: 'UIKit/Pickers/Select',
  component: Select,
  argTypes: {
    icon: {
      defaultValue: false,
      description: 'Show the icon',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    ...SIZE_ARG,
    ...IS_DISABLED_ARG,
    ...IS_LOADING_ARG,
    ...VALIDATION_STATE_ARG,
    ...LABEL_POSITION_ARG,
    ...LABEL_ARG,
    ...MESSAGE_ARG,
    ...PLACEHOLDER_ARG,
    defaultSelectedKey: {
      defaultValue: null,
      control: 'text',
    },
    defaultSelectedKeys: {
      defaultValue: null,
      control: 'array',
    },
  },
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

// export const Multiple = Template.bind({});
// Multiple.args = { icon: true, defaultSelectedKeys: ['red', 'violet'] };
