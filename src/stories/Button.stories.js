import React from 'react';

import UIKitButton from '../components/Button';

// fix component name
const Button = (args) => <UIKitButton {...args} />;

export default {
  title: 'Example/Button',
  component: UIKitButton,
  argTypes: {
    disabled: {
      defaultValue: false,
      control: {
        type: 'boolean',
      },
    },
    loading: {
      defaultValue: false,
      control: {
        type: 'boolean',
      },
    },
    size: {
      defaultValue: undefined,
      control: {
        type: 'radio',
        options: [undefined, 'default', 'small'],
      },
    },
    type: {
      defaultValue: 'default',
      control: {
        type: 'radio',
        options: ['default', 'primary', 'clear'],
      },
    },
    radius: {
      defaultValue: '1r',
      control: {
        type: 'radio',
        options: ['0', '1r', 'round'],
      },
    },
  },
};

const Template = ({ size, type, radius, disabled, loading, label }) => (
  <Button size={size} type={type} radius={radius} disabled={disabled} loading={loading}>
    {label}
  </Button>
);

export const Primary = Template.bind({});
Primary.args = {
  type: 'primary',
  label: 'Button',
};

export const Clear = Template.bind({});
Clear.args = {
  type: 'clear',
  label: 'Button',
};

export const Default = Template.bind({});
Default.args = {
  label: 'Button',
};
