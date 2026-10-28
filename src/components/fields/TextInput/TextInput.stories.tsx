import { StoryFn } from '@storybook/react-vite';
import { IconCoin } from '@tabler/icons-react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { IS_BARE_ARG, VALIDATION_ARGS } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';
import { Title } from '../../content/Title';
import { Space } from '../../layout/Space';

import { CubeTextInputProps, TextInput } from './TextInput';

export default {
  title: 'Forms/TextInput',
  component: TextInput,
  args: { fieldStyles: { width: '0 320px 100%' } },
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...IS_BARE_ARG,
    /* Content */
    value: {
      control: { type: 'text' },
      description: 'The text value in controlled mode',
    },
    defaultValue: {
      control: { type: 'text' },
      description: 'The default text value in uncontrolled mode',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text when input is empty',
    },
    icon: {
      control: { type: null },
      description: 'Icon element rendered before the input',
    },
    prefix: {
      control: { type: null },
      description: 'Input decoration before the main input',
    },
    suffix: {
      control: { type: null },
      description: 'Input decoration after the main input',
    },
    tooltip: {
      control: { type: 'text' },
      description:
        "The input's own tooltip, shown on hover over the field box and on keyboard focus, including while disabled",
    },

    /* Presentation */
    type: {
      options: ['text', 'password', 'email', 'url', 'tel', 'search'],
      control: { type: 'radio' },
      description: 'Input type',
      table: {
        defaultValue: { summary: 'text' },
      },
    },
    multiLine: {
      control: { type: 'boolean' },
      description: 'Whether the input is multiline (textarea)',
      table: {
        defaultValue: { summary: false },
      },
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
        'HTML `autocomplete` token telling the browser what to autofill (`email`, `username`, `off`, …)',
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

    suffixPosition: {
      options: ['before', 'after'],
      control: { type: 'radio' },
      description:
        'Position of suffix relative to validation/loading state icons',
      table: {
        defaultValue: { summary: 'before' },
        type: { summary: "'before' | 'after'" },
      },
    },
    inputProps: {
      control: { type: null },
      description: 'Direct HTML props passed to the inner input element',
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
    wrapperProps: {
      control: { type: null },
      table: {
        type: { summary: 'Styles' },
      },
    },
  },
};

const Template: StoryFn<CubeTextInputProps> = (props) => (
  <TextInput
    placeholder="Placeholder"
    {...props}
    onChange={(query) => console.log('change', query)}
  />
);

export const Default = Template.bind({});
Default.args = {};

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultValue: 'default value' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: <IconCoin /> };

export const Password = Template.bind({});
// A `defaultValue` is what makes this story worth photographing: an empty
// password input is pixel-identical to `WithIcon`, so without a value the
// masking it exists to show never appears.
Password.args = {
  icon: <IconCoin />,
  type: 'password',
  defaultValue: 'correct horse battery staple',
};

export const Validation: StoryFn<CubeTextInputProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Valid State</Title>
    <TextInput {...args} isValid defaultValue="Valid input" />

    <Title level={5}>Invalid State</Title>
    <TextInput {...args} isInvalid defaultValue="Invalid input" />
  </Space>
);

Validation.args = {
  fieldStyles: { width: '0 300px 100%' },
};

Validation.parameters = {
  docs: {
    description: {
      story:
        'Use the `isValid` and `isInvalid` props to indicate validation status.',
    },
  },
};

export const Disabled = Template.bind({});
Disabled.args = { isDisabled: true };

const timeout = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const DisabledWithTooltip: StoryFn<CubeTextInputProps> = (args) => (
  <TextInput qa="DisabledInput" {...args} />
);

DisabledWithTooltip.args = {
  isDisabled: true,
  'aria-label': 'Axis title',
  defaultValue: 'Count',
  tooltip: 'Show the axis to change its title',
  // Room above the field, so the tooltip opens in its default `top` placement.
  fieldStyles: { width: '0 320px 100%', margin: '6x top' },
};

DisabledWithTooltip.parameters = {
  docs: {
    description: {
      story:
        'A disabled field with a `tooltip` stays in the Tab order, so keyboard users can read why it is disabled. Keyboard focus shows its focus border and opens the tooltip at once.',
    },
  },
};

DisabledWithTooltip.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  // `TooltipProvider` wires the trigger up in a mount effect.
  await timeout(250);

  const input = await canvas.findByTestId('DisabledInput');

  // Keyboard focus opens it without the hover delay or pointer modality.
  await userEvent.tab();

  await waitFor(() => expect(input).toHaveFocus());
  await waitFor(() => expect(canvas.getByRole('tooltip')).toBeVisible());
};

export const DifferentSizes: StoryFn<CubeTextInputProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Small Input</Title>
    <TextInput {...args} size="small" placeholder="Small size" />

    <Title level={5}>Medium Input</Title>
    <TextInput {...args} size="medium" placeholder="Medium size" />

    <Title level={5}>Large Input</Title>
    <TextInput {...args} size="large" placeholder="Large size" />
  </Space>
);

DifferentSizes.args = {
  fieldStyles: { width: '0 300px 100%' },
};

DifferentSizes.parameters = {
  docs: {
    description: {
      story:
        'TextInput supports three sizes: `small`, `medium` (default), and `large` to accommodate different interface requirements.',
    },
  },
};
