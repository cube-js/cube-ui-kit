import React from 'react';
import { PasswordInput } from './PasswordInput';

export default {
  title: 'UIKit/Atoms/PasswordInput',
  component: PasswordInput,
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
      defaultValue: 'Password',
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

const Template = (props) => (
  <PasswordInput
    {...props}
    onChange={(query) => console.log('change', query)}
  />
);

export const Default = Template.bind({});
Default.args = {};
