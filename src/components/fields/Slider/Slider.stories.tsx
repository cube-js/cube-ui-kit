import { Meta, StoryFn } from '@storybook/react-vite';

import { baseProps } from '../../../stories/lists/baseProps';

import { CubeSliderProps, Slider } from './Slider';

export default {
  title: 'Forms/Slider',
  component: Slider,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    value: {
      control: { type: 'number' },
      description: 'The slider value in controlled mode',
    },
    defaultValue: {
      control: { type: 'number' },
      description: 'The default slider value in uncontrolled mode',
    },
    gradation: {
      control: { type: 'object' },
      description: 'Array of gradation labels to display below the slider',
    },

    /* Range */
    minValue: {
      control: { type: 'number' },
      description: 'The minimum allowed value',
      table: {
        defaultValue: { summary: 0 },
      },
    },
    maxValue: {
      control: { type: 'number' },
      description: 'The maximum allowed value',
      table: {
        defaultValue: { summary: 100 },
      },
    },
    step: {
      control: { type: 'number' },
      description: 'The value granularity',
      table: {
        defaultValue: { summary: 1 },
      },
    },

    /* Presentation */
    orientation: {
      options: ['horizontal', 'vertical'],
      control: { type: 'radio' },
      description: 'The orientation of the slider',
      table: {
        defaultValue: { summary: 'horizontal' },
      },
    },
    showValueLabel: {
      control: { type: 'boolean' },
      description: 'Whether to show the current value label',
      table: {
        defaultValue: { summary: true },
      },
    },
    getValueLabel: {
      control: { type: null },
      description: 'Function to format the value label',
    },
    formatOptions: {
      control: { type: 'object' },
      description: 'Options for number formatting',
    },

    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the slider is disabled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether user input is required before form submission',
      table: {
        defaultValue: { summary: false },
      },
    },
    validationState: {
      options: [undefined, 'valid', 'invalid'],
      control: { type: 'radio' },
      description:
        'Whether the slider should display valid or invalid visual styling',
    },
    autoFocus: {
      control: { type: 'boolean' },
      description: 'Whether the element should receive focus on render',
      table: {
        defaultValue: { summary: false },
      },
    },

    /* Events */
    onChange: {
      action: 'change',
      description: 'Callback fired when the slider value changes',
      control: { type: null },
    },
    onChangeEnd: {
      action: 'changeEnd',
      description: 'Callback fired when the slider interaction ends',
      control: { type: null },
    },
    onFocus: {
      action: 'focus',
      description: 'Callback fired when the slider receives focus',
      control: { type: null },
    },
    onBlur: {
      action: 'blur',
      description: 'Callback fired when the slider loses focus',
      control: { type: null },
    },

    /* Form */
    name: {
      control: { type: 'text' },
      description: 'The name of the input element for form submission',
    },
    label: {
      control: { type: 'text' },
      description: 'The label text for the slider',
    },
    labelPosition: {
      options: ['top', 'side'],
      control: { type: 'radio' },
      description: 'The position of the label relative to the input',
      table: {
        defaultValue: { summary: 'top' },
      },
    },
    necessityIndicator: {
      options: ['icon', 'label'],
      control: { type: 'radio' },
      description: 'How to display required or optional indicators',
      table: {
        defaultValue: { summary: 'icon' },
      },
    },
    isInvalid: {
      control: { type: 'boolean' },
      description: 'Whether the current value is invalid',
      table: {
        defaultValue: { summary: false },
      },
    },
    description: {
      control: { type: 'text' },
      description: 'Help text to describe the slider',
    },
    message: {
      control: { type: 'text' },
      description: 'Error message when validation fails',
    },

    /* Style */
    styles: {
      control: { type: 'object' },
      description:
        'Custom styles object for styling the component and sub-elements',
    },
  },
  args: {
    defaultValue: 6,
    minValue: 0,
    maxValue: 20,
    step: 2,
    fieldStyles: {
      width: '200px',
    },
  },
} as Meta<CubeSliderProps>;

const Template: StoryFn<CubeSliderProps> = (args) => <Slider {...args} />;

export const Default = Template.bind({});
Default.args = {};

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
};

export const WithLabel = Template.bind({});
WithLabel.args = {
  label: 'Slider',
};

export const WithoutValue = Template.bind({});
WithoutValue.args = {
  label: 'Slider',
  showValueLabel: false,
};

export const WithCustomValue = Template.bind({});
WithCustomValue.args = {
  label: 'Slider',
  getValueLabel(val) {
    return `(${val})`;
  },
};

export const Vertical = Template.bind({});
Vertical.args = {
  orientation: 'vertical',
};
