import React from 'react';

import UIKitButton from './Button';

// fix component name
const Button = (args) => <UIKitButton {...args} />;

export default {
  title: 'UIKit/Atoms/Button',
  component: UIKitButton,
  argTypes: {
    disabled: {
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
    loading: {
      control: 'boolean',
      description: 'Loading state with spinner. Also works as disabled',
      defaultValue: false,
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    type: {
      defaultValue: 'default',
      description: "A visual type of the button. Don't affect any logic",
      control: {
        type: 'radio',
        options: [undefined, 'default', 'primary', 'clear', 'item', 'tab'],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    selected: {
      control: 'boolean',
      description: 'Selected state for Tab type buttons',
      defaultValue: false,
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    size: {
      defaultValue: undefined,
      description: 'The size of the button',
      control: {
        type: 'radio',
        options: [undefined, 'default', 'small'],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    radius: {
      defaultValue: undefined,
      control: {
        type: 'radio',
        options: [undefined, '0', '1r', 'round'],
      },
      table: {
        type: { summary: 'string|number' },
        defaultValue: { summary: '1r' },
      },
    },
    label: {
      defaultValue: 'Button',
      control: 'text',
    },
  },
};

const Template = ({
  size,
  type,
  radius,
  selected,
  disabled,
  loading,
  label,
}) => (
  <Button
    size={size}
    type={type}
    radius={radius}
    disabled={disabled}
    loading={loading}
    selected={selected}
  >
    {label}
  </Button>
);

export const Default = Template.bind({});
Default.args = {
  label: 'Button',
};

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

export const Item = Template.bind({});
Item.args = {
  label: 'Button',
  type: 'item',
};

export const Tab = Template.bind({});
Tab.args = {
  label: 'Tab',
  type: 'tab',
  selected: true,
};
