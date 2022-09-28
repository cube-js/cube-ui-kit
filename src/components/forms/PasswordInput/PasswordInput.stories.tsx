import { expect } from '@storybook/jest';
import { Meta, Story } from '@storybook/react';
import { userEvent, within } from '@storybook/testing-library';
import { LockOutlined } from '@ant-design/icons';

import { baseProps } from '../../../stories/lists/baseProps';

import { PasswordInput, CubePasswordInputProps } from './PasswordInput';

export default {
  title: 'Forms/PasswordInput',
  component: PasswordInput,
  args: {
    label: 'Password',
  },
  parameters: {
    layout: 'centered',
    controls: {
      exclude: baseProps,
    },
  },
} as Meta<CubePasswordInputProps>;

const Template: Story<CubePasswordInputProps> = (args) => (
  <PasswordInput {...args} />
);

export const Default = Template.bind({});
Default.args = {};
Default.play = async ({ canvasElement }) => {
  const { getByTestId } = within(canvasElement);

  const input = getByTestId('Input');

  await userEvent.type(input, 'Lorem ipsum dolor sit amet');

  await expect(input).toHaveValue('Lorem ipsum dolor sit amet');
};

export const WithPlaceholder = Template.bind({});
WithPlaceholder.args = {
  placeholder: 'Enter your password',
};

export const WithError = Template.bind({});
WithError.args = {
  validationState: 'invalid',
};

export const Success = Template.bind({});
Success.args = {
  validationState: 'valid',
};

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
};

export const ReadOnly = Template.bind({});
ReadOnly.args = {
  isReadOnly: true,
};

export const Required = Template.bind({});
Required.args = {
  isRequired: true,
};

export const WithIcon = Template.bind({});
WithIcon.args = {
  icon: <LockOutlined />,
};

export const Loading = Template.bind({});
Loading.args = {
  isLoading: true,
};

export const EyeBefore = Template.bind({});
EyeBefore.args = {
  isLoading: true,
  validationState: 'invalid',
  suffixPosition: 'before',
};
