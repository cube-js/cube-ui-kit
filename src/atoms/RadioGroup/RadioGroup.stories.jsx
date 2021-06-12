import React from 'react';
import { Radio, RadioButton } from './Radio';

export default {
  title: 'UIKit/Atoms/RadioGroup',
  component: Radio.Group,
  argTypes: {
    isDisabled: {
      defaultValue: false,
      description: 'Disables the radio group.',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    orientation: {
      defaultValue: undefined,
      description: 'Orientation of the radio group.',
      control: {
        type: 'radio',
        options: [undefined, 'horizontal', 'vertical'],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'horizontal' },
      },
    },
    labelPosition: {
      defaultValue: 'top',
      description: 'The position of label for the radio group.',
      control: {
        type: 'radio',
        options: ['top', 'side'],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'top' },
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
    defaultValue: {
      defaultValue: undefined,
      description: 'Default value of the radio group.',
      control: {
        type: 'radio',
        options: [undefined, 'yes', 'no'],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'yes' },
      },
    },
    label: {
      defaultValue: 'Radio group label',
      control: 'text',
    },
    type: {
      defaultValue: undefined,
      description: 'Type of the radio button',
      control: {
        type: 'radio',
        options: [undefined, 'button'],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'radio' },
      },
    },
  },
};

const Template = ({ type, ...props }) => (
  <Radio.Group {...props} onChange={(query) => console.log('change', query)}>
    {type !== 'button' ? (
      <>
        <Radio value="yes">Yes</Radio>
        <Radio value="no">No</Radio>
      </>
    ) : (
      <>
        <Radio.Button value="yes">Yes</Radio.Button>
        <Radio type="button" value="no">
          No
        </Radio>
      </>
    )}
  </Radio.Group>
);

export const Default = Template.bind({});
Default.args = {};

export const RadioButtons = Template.bind({});
RadioButtons.args = { type: 'button' };
