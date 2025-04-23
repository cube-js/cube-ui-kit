import { StoryFn } from '@storybook/react';

import { TEXT_VALUE_ARG } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';

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

const Template: StoryFn<CubeRadioGroupProps> = (args) => (
  <Radio.Group defaultValue="yes" {...args}>
    <Radio value="yes">Yes</Radio>
    <Radio value="no">No</Radio>
  </Radio.Group>
);

const RadioButtonsTemplate: StoryFn<CubeRadioGroupProps> = (args) => (
  <Radio.Group defaultValue="yes" {...args}>
    <Radio.Button value="yes">Yes</Radio.Button>
    <Radio type="button" value="no">
      No
    </Radio>
  </Radio.Group>
);

const SolidRadioButtonsTemplate: StoryFn<CubeRadioGroupProps> = (args) => (
  <Radio.ButtonGroup defaultValue="no" {...args}>
    <Radio.Button value="yes">Yes</Radio.Button>
    <Radio.Button value="no">No</Radio.Button>
    <Radio.Button value="maybe">Maybe</Radio.Button>
  </Radio.ButtonGroup>
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

export const SolidRadioButtons = SolidRadioButtonsTemplate.bind({});

export const SolidRadioButtonsDisabled = SolidRadioButtonsTemplate.bind({});
SolidRadioButtonsDisabled.args = { isDisabled: true };
