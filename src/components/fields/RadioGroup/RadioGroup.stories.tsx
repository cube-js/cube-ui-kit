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
    /* Content */
    children: {
      control: { type: null },
      description: 'Radio elements that define the available options',
    },
    label: {
      control: { type: 'text' },
      description: 'Label for the radio group',
    },
    description: {
      control: { type: 'text' },
      description: 'Additional descriptive text for the group',
    },

    /* Value */
    value: {
      control: { type: 'text' },
      description: 'The currently selected value (controlled)',
    },
    defaultValue: {
      control: { type: 'text' },
      description: 'The default selected value (uncontrolled)',
    },

    /* Presentation */
    orientation: {
      options: [undefined, 'vertical', 'horizontal'],
      control: { type: 'radio' },
      description: 'Orientation of the radio group',
      table: {
        defaultValue: { summary: 'vertical' },
      },
    },
    isSolid: {
      control: { type: 'boolean' },
      description: 'Whether to use solid button styling',
      table: {
        defaultValue: { summary: false },
      },
    },

    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the entire radio group is disabled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isReadOnly: {
      control: { type: 'boolean' },
      description: 'Whether the radio group can be focused but not changed',
      table: {
        defaultValue: { summary: false },
      },
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether selection is required before form submission',
      table: {
        defaultValue: { summary: false },
      },
    },
    validationState: {
      options: [undefined, 'valid', 'invalid'],
      control: { type: 'radio' },
      description:
        'Whether the radio group should display valid or invalid visual styling',
    },

    /* Events */
    onChange: {
      action: 'change',
      description: 'Callback fired when the selected value changes',
      control: { type: null },
    },
    onBlur: {
      action: 'blur',
      description: 'Callback fired when the radio group loses focus',
      control: { type: null },
    },
    onFocus: {
      action: 'focus',
      description: 'Callback fired when the radio group receives focus',
      control: { type: null },
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
