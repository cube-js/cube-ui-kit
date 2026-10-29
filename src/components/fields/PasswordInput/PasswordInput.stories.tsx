import { StoryFn } from '@storybook/react-vite';
import { IconKey } from '@tabler/icons-react';
import { within } from 'storybook/test';

import { NO_SNAPSHOT } from '../../../stories/chromatic';
import { VALIDATION_ARGS } from '../../../stories/FormFieldArgs';
import { openTooltip } from '../../../stories/interactions';
import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';

import { CubePasswordInputProps, PasswordInput } from './PasswordInput';

export default {
  title: 'Forms/PasswordInput',
  component: PasswordInput,
  args: { fieldStyles: { width: '0 320px 100%' } },
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    value: {
      control: { type: 'text' },
      description: 'The password value in controlled mode',
    },
    defaultValue: {
      control: { type: 'text' },
      description: 'The default password value in uncontrolled mode',
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
      description:
        'Input decoration after the main input (before toggle button)',
    },

    /* Presentation */
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
      description: 'Input size',
      table: {
        defaultValue: { summary: 'medium' },
      },
    },
    shape: {
      options: ['default', 'plain'],
      control: { type: 'radio' },
      description:
        'Shape of the field box. `plain` is square with no border at rest, for a field set flush in a container that draws its edges',
      table: {
        defaultValue: { summary: 'default' },
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
        'HTML `autocomplete` token telling the browser what to autofill (`current-password`, `new-password`, `off`, …)',
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
      description: 'Position of suffix relative to validation/loading icons',
      table: {
        defaultValue: { summary: 'after' },
        type: { summary: "'before' | 'after'" },
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

const Template: StoryFn<CubePasswordInputProps> = (props) => (
  <PasswordInput
    {...props}
    onChange={(value) => console.log('change', value)}
  />
);

export const Default = Template.bind({});
Default.args = {
  label: 'Password',
  placeholder: 'Enter your password',
};

export const WithIcon = Template.bind({});
WithIcon.args = {
  label: 'Security Key',
  icon: <IconKey />,
  placeholder: 'Enter security key',
};

export const Validation: StoryFn<CubePasswordInputProps> = (props) => (
  <Space gap="2x" flow="column" placeItems="start">
    <PasswordInput {...props} label="Valid" isValid value="strong-password" />
    <PasswordInput {...props} label="Invalid" isInvalid isRequired />
  </Space>
);

export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Disabled Password',
  isDisabled: true,
  value: 'hidden-password',
};

export const WithTooltip: StoryFn<CubePasswordInputProps> = ({
  tooltip,
  ...args
}) => (
  <PasswordInput
    qa="ApiKey"
    {...args}
    // `delay: 0` only so the story does not depend on the open delay.
    tooltip={{ title: tooltip as string, delay: 0 }}
  />
);

WithTooltip.args = {
  'aria-label': 'API key',
  tooltip: 'Leave empty to keep the current key',
  // Room above the field, so the tooltip opens in its default `top` placement.
  fieldStyles: { width: '0 320px 100%', margin: '6x top' },
};

WithTooltip.parameters = {
  // The same open tooltip over a field box as `TextInput / WithTooltip`, and
  // `NumberInput / WithTooltip` photographs the anchor spanning a suffix.
  ...NO_SNAPSHOT,
  docs: {
    description: {
      story:
        'The tooltip says what an empty value means. It is anchored to the field box, the show-password button included.',
    },
  },
};

WithTooltip.play = async ({ canvasElement }) => {
  // The tooltip is the field box's, so hover the box, as a pointer would.
  await openTooltip(
    () =>
      within(canvasElement)
        .getByTestId('ApiKey')
        .closest('[data-qa="InputWrapper"]') as HTMLElement,
  );
};
