import React from 'react';

import UIKitButton from '../components/Button';

// fix component name
const Button = (args) => <UIKitButton {...args} />;

export default {
  title: 'Example/Button',
  component: UIKitButton,
  argTypes: {
    size: {
      defaultValue: 'medium',
      control: {
        type: 'radio',
        options: ['large', 'medium', 'small'],
      },
    },
    type: {
      defaultValue: 'default',
      control: {
        type: 'radio',
        options: ['default', 'primary'],
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

const Template = ({ size, type, radius, label }) => (
  <Button size={size} type={type} radius={radius}>
    {label}
  </Button>
);

export const Primary = Template.bind({});
Primary.args = {
  type: 'primary',
  label: 'Button',
};

export const Default = Template.bind({});
Default.args = {
  label: 'Button',
};
