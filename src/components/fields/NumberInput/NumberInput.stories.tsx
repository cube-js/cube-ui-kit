import { StoryFn } from '@storybook/react-vite';
import { IconCoin } from '@tabler/icons-react';
import { within } from 'storybook/test';

import { VALIDATION_ARGS } from '../../../stories/FormFieldArgs';
import { openTooltip } from '../../../stories/interactions';
import { baseProps } from '../../../stories/lists/baseProps';
import { Text } from '../../content/Text';
import { Space } from '../../layout/Space';

import { CubeNumberInputProps, NumberInput } from './NumberInput';

export default {
  title: 'Forms/NumberInput',
  component: NumberInput,
  args: { fieldStyles: { width: '0 200px 100%' } },
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
    tooltip: {
      control: { type: 'text' },
      description:
        "The input's own tooltip, shown on hover over the field box and on keyboard focus, including while disabled",
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
    ...VALIDATION_ARGS,
    autoFocus: {
      control: { type: 'boolean' },
      description: 'Whether the element should receive focus on render',
      table: {
        defaultValue: { summary: false },
      },
    },
    autoComplete: {
      control: { type: 'text' },
      description:
        'HTML `autocomplete` token telling the browser what to autofill (`cc-number`, `one-time-code`, …)',
      table: {
        defaultValue: { summary: 'off' },
      },
    },
    /* Events */
    onChange: {
      action: 'change',
      description:
        'Callback fired when a new value is committed (blur, Enter or a step), not on each keystroke. An empty field commits NaN',
      control: { type: null },
      table: { type: { summary: '(value: number) => void' } },
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
    onKeyDown: {
      action: 'keyDown',
      description: 'Callback fired when a key is pressed in the input',
      control: { type: null },
    },
    onKeyUp: {
      action: 'keyUp',
      description: 'Callback fired when a key is released in the input',
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
      description:
        'Position of suffix relative to the stepper buttons. The validation/loading icon always comes before both',
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

export const Validation: StoryFn<any> = (props) => (
  <Space gap="2x" flow="column" placeItems="start">
    <NumberInput {...props} label="Valid" isValid defaultValue={42} />
    <NumberInput {...props} label="Invalid" isInvalid defaultValue={-1} />
  </Space>
);

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
};

export const WithTooltip: StoryFn<CubeNumberInputProps> = ({
  tooltip,
  ...args
}) => (
  <NumberInput
    qa="DecimalPlaces"
    {...args}
    // `delay: 0` only so the snapshot does not depend on the open delay.
    tooltip={{ title: tooltip as string, delay: 0 }}
  />
);

WithTooltip.args = {
  'aria-label': 'Decimal places',
  defaultValue: 2,
  tooltip: 'Also applies to the axis labels',
  // Room above the field, so the tooltip opens in its default `top` placement.
  fieldStyles: { width: '0 200px 100%', margin: '6x top' },
};

WithTooltip.parameters = {
  docs: {
    description: {
      story:
        'The tooltip is anchored to the whole field box, the steppers included.',
    },
  },
};

WithTooltip.play = async ({ canvasElement }) => {
  // The tooltip is the field box's, so hover the box, as a pointer would.
  await openTooltip(
    () =>
      within(canvasElement)
        .getByTestId('DecimalPlaces')
        .closest('[data-qa="InputWrapper"]') as HTMLElement,
  );
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
