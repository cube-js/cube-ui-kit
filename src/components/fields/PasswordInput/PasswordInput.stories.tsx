import { StoryFn } from '@storybook/react';
import { IconKey } from '@tabler/icons-react';

import { baseProps } from '../../../stories/lists/baseProps';

import { CubePasswordInputProps, PasswordInput } from './PasswordInput';

export default {
  title: 'Forms/PasswordInput',
  component: PasswordInput,
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
      options: ['small', 'default', 'large'],
      control: { type: 'radio' },
      description: 'Input size',
      table: {
        defaultValue: { summary: 'default' },
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

export const Invalid = Template.bind({});
Invalid.args = {
  label: 'New Password',
  validationState: 'invalid',
  isRequired: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Disabled Password',
  isDisabled: true,
  value: 'hidden-password',
};
