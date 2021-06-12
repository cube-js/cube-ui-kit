import React from 'react';
import { Select, Item } from './Select';
import { DollarCircleOutlined } from '@ant-design/icons';

export default {
  title: 'UIKit/Atoms/Select',
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
    isDisabled: {
      defaultValue: false,
      description: 'Disables the input.',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state with spinner. Also works as disabled',
      defaultValue: false,
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    validationState: {
      defaultValue: undefined,
      description: 'The position of labels for each field.',
      control: {
        type: 'radio',
        options: [undefined, 'valid', 'invalid'],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'top' },
      },
    },
    labelPosition: {
      defaultValue: 'top',
      description: 'The position of labels for each field.',
      control: {
        type: 'radio',
        options: ['top', 'side'],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'top' },
      },
    },
    label: {
      defaultValue: 'Field label',
      control: 'text',
    },
    errorMessage: {
      defaultValue: '',
      description: 'Validation error message',
      control: 'text',
    },
    defaultSelectedKey: {
      defaultValue: null,
      control: 'text',
    },
    defaultSelectedKeys: {
      defaultValue: null,
      control: 'array',
    },
    placeholder: {
      defaultValue: 'Placeholder',
      control: 'text',
    },
  },
};

const Template = ({
  icon,
  labelPosition,
  label,
  placeholder,
  isLoading,
  isDisabled,
  defaultSelectedKey,
  validationState,
  selectionMode,
  type,
}) => {
  return (
    <Select
      icon={icon ? <DollarCircleOutlined /> : null}
      label={label}
      validationState={validationState}
      labelPosition={labelPosition}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isLoading={isLoading}
      defaultSelectedKey={defaultSelectedKey}
      selectionMode={selectionMode}
      type={type}
      onChange={(query) => console.log('change', query)}
    >
      <Item key="red">Red</Item>
      <Item key="orange">Orange</Item>
      <Item key="yellow">Yellow</Item>
      <Item key="green">Green</Item>
      <Item key="blue">Blue</Item>
      <Item key="purple">Purple</Item>
      <Item key="violet">Violet</Item>
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
