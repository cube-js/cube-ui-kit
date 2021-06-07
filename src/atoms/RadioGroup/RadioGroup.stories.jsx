import React from 'react';
import { RadioGroup } from './RadioGroup';
import { Radio } from './Radio';

export default {
  title: 'UIKit/Atoms/RadioGroup',
  component: RadioGroup,
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
  },
};

const Template = ({
  label,
  defaultValue,
  isDisabled,
  validationState,
  labelPosition,
  orientation,
}) => (
  <RadioGroup
    label={label}
    validationState={validationState}
    isDisabled={isDisabled}
    defaultValue={defaultValue}
    labelPosition={labelPosition}
    orientation={orientation}
    onChange={(query) => console.log('change', query)}
  >
    <Radio value="yes">Yes</Radio>
    <Radio value="no">No</Radio>
  </RadioGroup>
);

export const Default = Template.bind({});
Default.args = {};
