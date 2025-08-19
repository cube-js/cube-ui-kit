import { Meta, StoryObj } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';
import { Input } from '../../fields';
import { Space } from '../../layout/Space';

import { Field } from './Field';
import { Form } from './Form';
import { ResetButton } from './ResetButton';
import { SubmitButton } from './SubmitButton';
import { SubmitError } from './SubmitError';

const meta: Meta<typeof Form> = {
  title: 'Forms/Form',
  component: Form,
  parameters: {
    controls: { exclude: baseProps },
  },
  argTypes: {
    /* Layout */
    orientation: {
      control: { type: 'radio' },
      options: ['vertical', 'horizontal'],
      description: 'Form layout orientation',
      table: {
        defaultValue: { summary: 'vertical' },
      },
    },
    labelPosition: {
      control: { type: 'radio' },
      options: ['top', 'side'],
      description: 'Where to place labels relative to inputs',
      table: {
        defaultValue: { summary: 'top' },
      },
    },
    labelWidth: {
      control: { type: 'text' },
      description: 'Width of label area for side-positioned labels',
    },

    /* Form State */
    name: {
      control: { type: 'text' },
      description: 'Form name attribute',
    },
    defaultValues: {
      control: { type: 'object' },
      description: 'Default field values',
    },
    form: {
      control: { type: null },
      description: 'Form instance created by useForm',
    },

    /* Field Defaults */
    requiredMark: {
      control: { type: 'boolean' },
      description: 'Whether to show required field indicators',
      table: {
        defaultValue: { summary: true },
      },
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether fields are required by default',
      table: {
        defaultValue: { summary: false },
      },
    },
    necessityIndicator: {
      control: { type: 'radio' },
      options: ['icon', 'label'],
      description: 'Type of necessity indicator',
      table: {
        defaultValue: { summary: 'icon' },
      },
    },
    isReadOnly: {
      control: { type: 'boolean' },
      description: 'Whether fields are read-only by default',
      table: {
        defaultValue: { summary: false },
      },
    },
    validationState: {
      control: { type: 'radio' },
      options: [undefined, 'valid', 'invalid'],
      description: 'Validation state for all fields',
    },
    validateTrigger: {
      control: { type: 'radio' },
      options: ['onBlur', 'onChange', 'onSubmit'],
      description: 'When to trigger validation',
      table: {
        defaultValue: { summary: 'onBlur' },
      },
    },
    showValid: {
      control: { type: 'boolean' },
      description: 'Whether to show valid state indicators',
      table: {
        defaultValue: { summary: false },
      },
    },

    /* HTML Form Properties */
    action: {
      control: { type: 'text' },
      description: 'Form action URL (for server submission)',
    },
    autoComplete: {
      control: { type: 'text' },
      description: 'Browser autocomplete behavior',
    },
    encType: {
      control: { type: 'text' },
      description: 'Form encoding type',
    },
    method: {
      control: { type: 'radio' },
      options: ['get', 'post'],
      description: 'HTTP method for form submission',
    },
    target: {
      control: { type: 'text' },
      description: 'Target for form submission',
    },

    /* Events */
    onSubmit: {
      action: 'submit',
      description: 'Triggered on successful form submission',
      control: { type: null },
    },
    onSubmitFailed: {
      action: 'submitFailed',
      description: 'Triggered when form submission fails',
      control: { type: null },
    },
    onValuesChange: {
      action: 'valuesChange',
      description: 'Triggered when any field value changes',
      control: { type: null },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Form>;

export const Default: Story = {
  render: (args) => (
    <Form
      requiredMark={false}
      onSubmit={(data) => {
        console.log('Form submitted:', data);
        return new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      }}
      {...args}
    >
      <Input.Text
        name="email"
        label="Email"
        type="email"
        placeholder="Enter your email"
        rules={[
          {
            required: true,
            message: 'Email is required',
          },
          {
            type: 'email',
            message: 'Please enter a valid email address',
          },
        ]}
      />

      <Input.Password
        name="password"
        label="Password"
        placeholder="Enter your password"
        rules={[
          {
            required: true,
            message: 'Password is required',
          },
          {
            min: 6,
            message: 'Password must be at least 6 characters',
          },
        ]}
      />

      <SubmitError />

      <Space>
        <SubmitButton>Sign In</SubmitButton>
        <ResetButton>Reset</ResetButton>
      </Space>
    </Form>
  ),
  args: {
    orientation: 'vertical',
    labelPosition: 'top',
  },
};

export const Horizontal: Story = {
  render: (args) => (
    <Form
      orientation="horizontal"
      labelPosition="side"
      requiredMark={false}
      onSubmit={(data) => {
        console.log('Form submitted:', data);
        return new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      }}
      {...args}
    >
      <Input.Text
        name="email"
        label="Email"
        type="email"
        size="small"
        placeholder="Enter your email"
        rules={[
          {
            required: true,
            message: 'Email is required',
          },
          {
            type: 'email',
            message: 'Please enter a valid email address',
          },
        ]}
      />

      <Input.Password
        name="password"
        label="Password"
        size="small"
        placeholder="Enter your password"
        rules={[
          {
            required: true,
            message: 'Password is required',
          },
        ]}
      />

      <SubmitButton size="small">Sign In</SubmitButton>
    </Form>
  ),
  args: {
    orientation: 'horizontal',
    labelPosition: 'side',
  },
};

export const WithValidationError: Story = {
  render: (args) => (
    <Form
      requiredMark={false}
      onSubmit={(data) => {
        console.log('Form submitted:', data);
        // Simulate server error
        return Promise.reject('Invalid credentials. Please try again.');
      }}
      {...args}
    >
      <Input.Text
        name="email"
        label="Email"
        type="email"
        placeholder="Enter your email"
        rules={[
          {
            required: true,
            message: 'Email is required',
          },
          {
            type: 'email',
            message: 'Please enter a valid email address',
          },
        ]}
      />

      <Input.Password
        name="password"
        label="Password"
        placeholder="Enter your password"
        rules={[
          {
            required: true,
            message: 'Password is required',
          },
        ]}
      />

      <SubmitError />

      <Space>
        <SubmitButton>Sign In</SubmitButton>
        <ResetButton>Reset</ResetButton>
      </Space>
    </Form>
  ),
  args: {
    orientation: 'vertical',
    labelPosition: 'top',
  },
};

export const WithDefaultValues: Story = {
  render: (args) => (
    <Form
      defaultValues={{
        email: 'user@example.com',
        password: '',
      }}
      requiredMark={false}
      onSubmit={(data) => {
        console.log('Form submitted:', data);
        return new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      }}
      {...args}
    >
      <Input.Text
        name="email"
        label="Email"
        type="email"
        placeholder="Enter your email"
        rules={[
          {
            required: true,
            message: 'Email is required',
          },
          {
            type: 'email',
            message: 'Please enter a valid email address',
          },
        ]}
      />

      <Input.Password
        name="password"
        label="Password"
        placeholder="Enter your password"
        rules={[
          {
            required: true,
            message: 'Password is required',
          },
        ]}
      />

      <SubmitError />

      <Space>
        <SubmitButton>Sign In</SubmitButton>
        <ResetButton>Reset</ResetButton>
      </Space>
    </Form>
  ),
  args: {
    orientation: 'vertical',
    labelPosition: 'top',
  },
};
