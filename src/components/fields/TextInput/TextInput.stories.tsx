import { StoryFn } from '@storybook/react-vite';
import { IconCoin } from '@tabler/icons-react';

import { baseProps } from '../../../stories/lists/baseProps';
import { Title } from '../../content/Title';
import { Space } from '../../layout/Space';

import { CubeTextInputProps, TextInput } from './TextInput';

export default {
  title: 'Forms/TextInput',
  component: TextInput,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
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

const Template: StoryFn<CubeTextInputProps> = (props) => (
  <TextInput {...props} onChange={(query) => console.log('change', query)} />
);

export const Default = Template.bind({});
Default.args = {};

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultValue: 'default value' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: <IconCoin /> };

export const Password = Template.bind({});
Password.args = { icon: <IconCoin />, type: 'password' };

export const Valid = Template.bind({});
Valid.args = { validationState: 'valid', defaultValue: 'Valid input' };

export const Invalid = Template.bind({});
Invalid.args = { validationState: 'invalid', defaultValue: 'Invalid input' };

export const ValidationStates: StoryFn<CubeTextInputProps> = (args) => (
  <Space gap="2x" flow="column" placeItems="start">
    <Title level={5}>Valid State</Title>
    <TextInput {...args} validationState="valid" defaultValue="Valid input" />

    <Title level={5}>Invalid State</Title>
    <TextInput
      {...args}
      validationState="invalid"
      defaultValue="Invalid input"
    />
  </Space>
);

ValidationStates.args = {
  width: '300px',
};

ValidationStates.parameters = {
  docs: {
    description: {
      story:
        'Use `validationState` prop to indicate validation status. Set to `valid` for success styling or `invalid` for error styling.',
    },
  },
};

export const Disabled = Template.bind({});
Disabled.args = { isDisabled: true };

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
  width: '300px',
};

DifferentSizes.parameters = {
  docs: {
    description: {
      story:
        'TextInput supports three sizes: `small`, `medium` (default), and `large` to accommodate different interface requirements.',
    },
  },
};
