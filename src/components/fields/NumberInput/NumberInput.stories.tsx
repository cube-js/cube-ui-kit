import { StoryFn } from '@storybook/react-vite';
import { IconCoin } from '@tabler/icons-react';

import { baseProps } from '../../../stories/lists/baseProps';
import { Text } from '../../content/Text';

import { NumberInput } from './NumberInput';

export default {
  title: 'Forms/NumberInput',
  component: NumberInput,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    value: {
      control: { type: 'number' },
      description: 'The numeric value in controlled mode',
    },
    defaultValue: {
      control: { type: 'number' },
      description: 'The default numeric value in uncontrolled mode',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text when input is empty',
    },
    prefix: {
      control: { type: null },
      description: 'Input decoration before the main input',
    },
    suffix: {
      control: { type: null },
      description: 'Input decoration after the main input',
    },
    /* Presentation */
    hideStepper: {
      control: { type: 'boolean' },
      description: 'Whether to hide the stepper buttons',
      table: {
        defaultValue: { summary: false },
      },
    },
    minValue: {
      control: { type: 'number' },
      description: 'Minimum allowed value',
    },
    maxValue: {
      control: { type: 'number' },
      description: 'Maximum allowed value',
    },
    step: {
      control: { type: 'number' },
      description: 'Amount to increment or decrement the value',
    },
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
      description: 'Input size',
      table: {
        defaultValue: { summary: 'medium' },
      },
    },
    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isReadOnly: {
      control: { type: 'boolean' },
      description: 'Whether the input can be selected but not changed',
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
    isLoading: {
      control: { type: 'boolean' },
      description: 'Show loading spinner and disable interactions',
      table: {
        defaultValue: { summary: false },
      },
    },
    validationState: {
      options: [undefined, 'valid', 'invalid'],
      control: { type: 'radio' },
      description:
        'Whether the input should display valid or invalid visual styling',
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
      description: 'Callback fired when the input value changes',
      control: { type: null },
    },
    onBlur: {
      action: 'blur',
      description: 'Callback fired when the input loses focus',
      control: { type: null },
    },
    onFocus: {
      action: 'focus',
      description: 'Callback fired when the input receives focus',
      control: { type: null },
    },

    icon: {
      control: { type: null },
      description: 'Icon element rendered before the input',
      table: {
        type: { summary: 'ReactElement' },
      },
    },
    suffixPosition: {
      options: ['before', 'after'],
      control: { type: 'radio' },
      description: 'Position of suffix relative to validation/loading icons',
      table: {
        defaultValue: { summary: 'before' },
        type: { summary: "'before' | 'after'" },
      },
    },
    formatOptions: {
      control: { type: null },
      description: 'Options for formatting the displayed number value',
      table: {
        type: { summary: 'Intl.NumberFormatOptions' },
      },
    },
    isWheelDisabled: {
      control: 'boolean',
      description: 'Whether scrolling the mouse wheel changes the value',
      table: {
        type: { summary: 'boolean' },
      },
    },
    decrementAriaLabel: {
      control: { type: 'text' },
      description: 'Custom aria-label for the decrement button',
      table: {
        type: { summary: 'string' },
      },
    },
    incrementAriaLabel: {
      control: { type: 'text' },
      description: 'Custom aria-label for the increment button',
      table: {
        type: { summary: 'string' },
      },
    },
    inputProps: {
      control: { type: null },
      description: 'Direct props passed to the native input element',
      table: {
        type: { summary: 'Props' },
      },
    },
    wrapperProps: {
      control: { type: null },
      description: 'Direct props passed to the input wrapper element',
      table: {
        type: { summary: 'Props' },
      },
    },
    inputStyles: {
      control: { type: null },
      table: {
        type: { summary: 'Styles' },
      },
    },
  },
};

const Template: StoryFn<any> = (props) => (
  <NumberInput {...props} onChange={(query) => console.log('change', query)} />
);

export const Default = Template.bind({});
Default.args = {};

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultValue: 5 };

export const Small = Template.bind({});
Small.args = {
  size: 'small',
};

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
};

export const WithSuffixBefore = Template.bind({});
WithSuffixBefore.args = {
  suffix: <Text>suffix</Text>,
  suffixPosition: 'before',
};

export const WithSuffixAfter = Template.bind({});
WithSuffixAfter.args = {
  suffix: <Text>suffix</Text>,
  suffixPosition: 'after',
};
