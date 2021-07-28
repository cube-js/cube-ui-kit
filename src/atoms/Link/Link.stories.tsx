import React from 'react';
import { Link } from './Link';

export default {
  title: 'UIKit/Atoms/Link',
  component: Link,
  argTypes: {
    isDisabled: {
      defaultValue: false,
      description: 'Disables the button.',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    label: {
      defaultValue: 'Button',
      control: 'text',
    },
  },
};

const Template = ({ type, isDisabled, label }) => (
  <Link
    type={type}
    isDisabled={isDisabled}
    onPress={() => console.log('Press')}
    to="!https://cube.dev"
  >
    {label}
  </Link>
);

export const Default = Template.bind({});
Default.args = {
  label: 'Link',
};
