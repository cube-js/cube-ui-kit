import { StoryFn } from '@storybook/react-vite';

import { baseProps } from '../../../stories/lists/baseProps';
import { Flow } from '../../layout/Flow';

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
    type: {
      options: ['radio', 'button', 'tabs'],
      control: { type: 'radio' },
      description:
        'Visual type for all radios in the group (button/tabs default to horizontal)',
      table: {
        defaultValue: { summary: 'radio' },
      },
    },
    orientation: {
      options: [undefined, 'vertical', 'horizontal'],
      control: { type: 'radio' },
      description: 'Orientation of the radio group (auto-set based on type)',
      table: {
        defaultValue: { summary: 'auto' },
      },
    },
    size: {
      options: ['xsmall', 'small', 'medium', 'large', 'xlarge'],
      control: { type: 'radio' },
      description: 'Size for all radio buttons in the group',
      table: {
        defaultValue: { summary: 'xsmall' },
      },
    },
    buttonType: {
      options: ['outline', 'neutral', 'primary', 'clear'],
      control: { type: 'radio' },
      description:
        'Button type for button-style radios (ignored in tabs mode). When set to "primary", selected buttons use primary style and non-selected use secondary',
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
    isInvalid: {
      control: { type: 'boolean' },
      description:
        'Whether the radio group should display invalid visual styling',
      table: {
        defaultValue: { summary: false },
      },
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

// Basic radio group template
const Template: StoryFn<CubeRadioGroupProps> = (args) => (
  <Radio.Group defaultValue="yes" {...args}>
    <Radio value="yes">Yes</Radio>
    <Radio value="no">No</Radio>
    <Radio value="maybe">Maybe</Radio>
  </Radio.Group>
);

// Basic stories
export const Default = Template.bind({});
Default.args = {};

export const Invalid = Template.bind({});
Invalid.args = { isInvalid: true };

export const WithLabel = Template.bind({});
WithLabel.args = {
  label: 'Choose an option',
};

export const WithLabelAndDescription = Template.bind({});
WithLabelAndDescription.args = {
  label: 'Choose an option',
  description: 'Select one of the available options',
};

export const HorizontalOrientation = Template.bind({});
HorizontalOrientation.args = {
  orientation: 'horizontal',
};

// Button group stories
export const ButtonGroup = Template.bind({});
ButtonGroup.args = {
  type: 'button',
};

export const TabsGroup: StoryFn<CubeRadioGroupProps> = (args) => (
  <Radio.Tabs defaultValue="yes" {...args}>
    <Radio value="yes">Yes</Radio>
    <Radio value="no">No</Radio>
    <Radio value="maybe">Maybe</Radio>
  </Radio.Tabs>
);

// Size demonstrations
export const ButtonGroupSizes: StoryFn<CubeRadioGroupProps> = () => (
  <>
    <Radio.Group type="button" size="xsmall" defaultValue="yes" label="XSmall">
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </Radio.Group>
    <Radio.Group type="button" size="small" defaultValue="yes" label="Small">
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </Radio.Group>
    <Radio.Group type="button" size="medium" defaultValue="yes" label="Medium">
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </Radio.Group>
    <Radio.Group type="button" size="large" defaultValue="yes" label="Large">
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </Radio.Group>
    <Radio.Group type="button" size="xlarge" defaultValue="yes" label="XLarge">
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </Radio.Group>
  </>
);

export const TabsGroupSizes: StoryFn<CubeRadioGroupProps> = () => (
  <>
    <Radio.Tabs
      size="xsmall"
      defaultValue="yes"
      label="XSmall (stays xsmall in tabs mode)"
    >
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </Radio.Tabs>
    <Radio.Tabs
      size="small"
      defaultValue="yes"
      label="Small (maps to xsmall in tabs mode)"
    >
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </Radio.Tabs>
    <Radio.Tabs
      size="medium"
      defaultValue="yes"
      label="Medium (maps to xsmall in tabs mode)"
    >
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </Radio.Tabs>
    <Radio.Tabs
      size="large"
      defaultValue="yes"
      label="Large (maps to medium in tabs mode)"
    >
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </Radio.Tabs>
    <Radio.Tabs
      size="xlarge"
      defaultValue="yes"
      label="XLarge (maps to large in tabs mode)"
    >
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </Radio.Tabs>
  </>
);

// Button type variants
export const CustomButtonTypes: StoryFn<CubeRadioGroupProps> = () => (
  <>
    <Radio.Group
      type="button"
      buttonType="primary"
      defaultValue="yes"
      label="Primary (selected: primary, non-selected: secondary)"
    >
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </Radio.Group>
    <Radio.Group
      type="button"
      buttonType="outline"
      defaultValue="yes"
      label="Outline (default)"
    >
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </Radio.Group>
    <Radio.Group
      type="button"
      buttonType="neutral"
      defaultValue="yes"
      label="Neutral"
    >
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </Radio.Group>
    <Radio.Group
      type="button"
      buttonType="clear"
      defaultValue="yes"
      label="Clear"
    >
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </Radio.Group>
  </>
);

// Disabled state
export const DisabledState: StoryFn<CubeRadioGroupProps> = () => (
  <Flow gap="2x">
    <Radio.Group
      type="radio"
      isDisabled={true}
      defaultValue="yes"
      label="Radio (Disabled)"
    >
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </Radio.Group>
    <Radio.Group
      type="button"
      isDisabled={true}
      defaultValue="yes"
      label="Button (Disabled)"
    >
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </Radio.Group>
    <Radio.Tabs isDisabled={true} defaultValue="yes" label="Tabs (Disabled)">
      <Radio value="yes">Yes</Radio>
      <Radio value="no">No</Radio>
      <Radio value="maybe">Maybe</Radio>
    </Radio.Tabs>
  </Flow>
);
