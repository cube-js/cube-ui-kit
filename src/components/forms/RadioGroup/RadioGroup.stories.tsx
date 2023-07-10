import { Story } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';
import { TEXT_VALUE_ARG } from '../../../stories/FormFieldArgs';

import { Radio } from './Radio';
import { CubeRadioGroupProps } from './RadioGroup';

export default {
  title: 'Forms/RadioGroup',
  component: Radio.Group,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...TEXT_VALUE_ARG,
    orientation: {
      defaultValue: undefined,
      description: 'Orientation of the group',
      control: {
        type: 'radio',
        options: [undefined, 'vertical', 'horizontal'],
      },
      table: {
        type: { summary: 'boolean' },
      },
    },
  },
};

const Template: Story<CubeRadioGroupProps> = (args) => (
  <Radio.Group {...args}>
    <Radio value="yes">Yes</Radio>
    <Radio value="no">No</Radio>
  </Radio.Group>
);

const RadioButtonsTemplate: Story<CubeRadioGroupProps> = (args) => (
  <Radio.Group {...args}>
    <Radio.Button value="yes">Yes</Radio.Button>
    <Radio type="button" value="no">
      No
    </Radio>
  </Radio.Group>
);

export const Default = Template.bind({});
Default.args = {};

export const Invalid = Template.bind({});
Invalid.args = { validationState: 'invalid' };

export const RadioButtons = RadioButtonsTemplate.bind({});

export const RadioGroupHorizontalOrientation = Template.bind({});
RadioGroupHorizontalOrientation.args = {
  orientation: 'horizontal',
};

export const ButtonRadioGroupVerticalOrientation = RadioButtonsTemplate.bind(
  {},
);
ButtonRadioGroupVerticalOrientation.args = {
  orientation: 'vertical',
};

export const ButtonRadioGroupHorizontalOrientation = RadioButtonsTemplate.bind(
  {},
);
ButtonRadioGroupHorizontalOrientation.args = {
  orientation: 'horizontal',
};

export const RadioGroupWithLabel = Template.bind({});
RadioGroupWithLabel.args = {
  label: 'Radio Group',
};

export const RadioGroupWithLabelAndDescription = Template.bind({});
RadioGroupWithLabelAndDescription.args = {
  label: 'Radio Group',
  description: 'This is a description',
};

export const RadioGroupWithLabelAndSuffix = Template.bind({});
RadioGroupWithLabelAndSuffix.args = {
  label: 'Radio Group',
  labelSuffix: 'Suffix',
};
