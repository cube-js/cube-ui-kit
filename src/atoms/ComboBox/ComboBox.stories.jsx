import React from 'react';
import { ComboBox } from './ComboBox';
import { Item } from '../Select/Select';
import { DollarCircleOutlined } from '@ant-design/icons';

export default {
  title: 'UIKit/Atoms/ComboBox',
  component: ComboBox,
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
    hideTrigger: {
      defaultValue: false,
      description: 'Hides trigger button',
      control: {
        type: 'boolean',
      },
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
        defaultValue: { summary: undefined },
      },
    },
    allowsCustomValue: {
      defaultValue: false,
      description: 'Allows values that are not listed in options',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    menuTrigger: {
      defaultValue: undefined,
      description: 'Menu trigger behavior',
      control: {
        type: 'radio',
        options: ['input', 'focus', 'manual'],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'input' },
      },
    },
    labelPosition: {
      defaultValue: undefined,
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
      description: 'Label text.',
      control: 'text',
    },
    message: {
      defaultValue: '',
      description: 'Validation error message',
      control: 'text',
    },
    defaultSelectedKey: {
      defaultValue: null,
      description: 'Default selected key',
      control: 'text',
    },
    placeholder: {
      defaultValue: 'Placeholder',
      description: 'Placeholder text which appears if no value provided',
      control: 'text',
    },
  },
};

const Template = ({ icon, ...props }) => {
  return (
    <>
      <ComboBox
        prefix={icon ? <DollarCircleOutlined /> : null}
        {...props}
        onChange={(query) => console.log('change', query)}
      >
        <Item key="red">Red</Item>
        <Item key="orange">Orange</Item>
        <Item key="yellow">Yellow</Item>
        <Item key="green">Green</Item>
        <Item key="blue">Blue</Item>
        <Item key="purple">Purple</Item>
        <Item key="violet">Violet</Item>
      </ComboBox>
    </>
  );
};

export const Default = Template.bind({});
Default.args = { disallowEmptySelection: true };

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultSelectedKey: 'purple' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: true };
