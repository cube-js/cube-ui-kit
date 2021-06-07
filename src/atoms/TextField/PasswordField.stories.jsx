import React from 'react';
import { PasswordField } from './PasswordField';

export default {
  title: 'UIKit/Atoms/PasswordField',
  component: PasswordField,
  argTypes: {
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
  labelPosition,
  label,
  placeholder,
  isDisabled,
  defaultValue,
  validationState,
}) => (
  <PasswordField
    label={label}
    validationState={validationState}
    labelPosition={labelPosition}
    placeholder={placeholder}
    isDisabled={isDisabled}
    defaultValue={defaultValue}
    onChange={(query) => console.log('change', query)}
  />
);

export const Default = Template.bind({});
Default.args = {};
