import {
  Form,
  Field,
  SubmitButton,
  Input,
  ResetButton,
  Space,
  TextInput,
  SubmitError,
} from '../index';

import { DialogFormApp } from './components/DialogFormApp';
import { DISABLE_BASE_ARGS } from './FormFieldArgs';

export default {
  title: 'Forms/Form',
  component: Form,

  argTypes: {
    ...DISABLE_BASE_ARGS,
  },
};

export const LoginForm = {
  // 1s of submitting
  render: (args) => (
    <Form
      requiredMark={false}
      onSubmit={() => {
        return new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      }}
      {...args}
    >
      <Field
        label="Email"
        name="email"
        rules={[
          {
            required: true,
            message: 'E-mail required',
          },
          {
            type: 'email',
            message: 'Please enter a valid e-mail',
          },
        ]}
      >
        <Input.Text type="email" />
      </Field>
      <Field
        label="Password"
        name="password"
        rules={[
          {
            required: true,
            message: 'Password required',
          },
          {
            min: 8,
            message: 'The password must be at least 8 characters',
          },
        ]}
      >
        <Input.Password type="password" />
      </Field>
      <SubmitError />
      <Space>
        <SubmitButton>Submit</SubmitButton>
        <ResetButton>Reset</ResetButton>
      </Space>
    </Form>
  ),

  name: 'LoginForm',
};

export const SimpleValidation = {
  render: (args) => (
    <Form
      onSubmit={(data) => {
        console.log('! Submit', data);
      }}
      {...args}
    >
      <Form.Item
        name="test"
        label="Test"
        rules={[
          {
            validator(rule, value) {
              return value ? Promise.resolve() : Promise.reject('Required');
            },
          },
        ]}
      >
        <TextInput />
      </Form.Item>

      <Space>
        <SubmitButton>Submit</SubmitButton>
        <ResetButton>Reset</ResetButton>
      </Space>
      <Form.SubmitError />
    </Form>
  ),
};

export const HorizontalLoginForm = {
  // 1s of submitting
  render: (args) => (
    <Form
      orientation="horizontal"
      labelPosition="side"
      requiredMark={false}
      onSubmit={() => {
        return new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      }}
      {...args}
    >
      <Field
        label="Email"
        name="email"
        rules={[
          {
            required: true,
            message: 'E-mail required',
          },
          {
            type: 'email',
            message: 'Please enter a valid e-mail',
          },
        ]}
      >
        <Input.Text type="email" size="small" />
      </Field>
      <Field
        label="Password"
        name="password"
        rules={[
          {
            required: true,
            message: 'Password required',
          },
          {
            min: 8,
            message: 'The password must be at least 8 characters',
          },
        ]}
      >
        <Input.Password type="password" size="small" />
      </Field>
      <SubmitButton size="small">Submit</SubmitButton>
    </Form>
  ),

  name: 'HorizontalLoginForm',
};

export const DialogFormExample = {
  render: () => <DialogFormApp />,
  name: 'DialogFormApp',
};
