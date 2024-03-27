import { Form, Field, Submit, Input } from '../index';

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
      <Submit>Submit</Submit>
    </Form>
  ),

  name: 'LoginForm',
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
      <Submit size="small">Submit</Submit>
    </Form>
  ),

  name: 'HorizontalLoginForm',
};

export const DialogFormExample = {
  render: () => <DialogFormApp />,
  name: 'DialogFormApp',
};
