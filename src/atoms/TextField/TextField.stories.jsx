import React from 'react';
import { TextField } from './TextField';
import { DollarCircleOutlined } from '@ant-design/icons';

export default {
  title: 'UIKit/Atoms/TextField',
  component: TextField,
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
    type: {
      defaultValue: 'text',
      description: 'Input type',
      control: {
        type: 'radio',
        options: ['text', 'search', 'url', 'tel', 'email', 'password'],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'text' },
      },
    },
    inputMode: {
      defaultValue: 'none',
      description: 'Input type mode',
      control: {
        type: 'radio',
        options: [
          'none',
          'text',
          'tel',
          'url',
          'email',
          'numeric',
          'decimal',
          'search',
        ],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'none' },
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
    defaultValue: {
      defaultValue: '',
      control: 'text',
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
  defaultValue,
  validationState,
  type,
}) => (
  <TextField
    icon={icon ? <DollarCircleOutlined /> : null}
    label={label}
    validationState={validationState}
    labelPosition={labelPosition}
    placeholder={placeholder}
    isDisabled={isDisabled}
    isLoading={isLoading}
    defaultValue={defaultValue}
    type={type}
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
