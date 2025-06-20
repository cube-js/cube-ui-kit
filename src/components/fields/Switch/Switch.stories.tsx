import { StoryFn } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';

import { CubeSwitchProps, Switch } from './Switch';

export default {
  title: 'Forms/Switch',
  component: Switch,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    children: {
      control: { type: 'text' },
      description: 'The content to display as the switch label',
    },
    label: {
      control: { type: 'text' },
      description: 'External label for the switch',
    },

    /* State */
    isSelected: {
      control: { type: 'boolean' },
      description: 'Whether the switch is selected (controlled)',
      table: {
        defaultValue: { summary: false },
      },
    },
    defaultSelected: {
      control: { type: 'boolean' },
      description: 'Whether the switch is selected by default (uncontrolled)',
      table: {
        defaultValue: { summary: false },
      },
    },
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the switch is disabled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isReadOnly: {
      control: { type: 'boolean' },
      description: 'Whether the switch can be focused but not changed',
      table: {
        defaultValue: { summary: false },
      },
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether the switch must be toggled before form submission',
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
        'Whether the switch should display valid or invalid visual styling',
    },
    autoFocus: {
      control: { type: 'boolean' },
      description: 'Whether the element should receive focus on render',
      table: {
        defaultValue: { summary: false },
      },
    },

    /* Presentation */
    size: {
      options: ['small', 'default'],
      control: { type: 'radio' },
      description: 'Switch size',
      table: {
        defaultValue: { summary: 'default' },
      },
    },

    /* Events */
    onChange: {
      action: 'change',
      description: 'Callback fired when the switch value changes',
      control: { type: null },
    },
    onFocus: {
      action: 'focus',
      description: 'Callback fired when the switch receives focus',
      control: { type: null },
    },
    onBlur: {
      action: 'blur',
      description: 'Callback fired when the switch loses focus',
      control: { type: null },
    },
  },
};

const Template: StoryFn<CubeSwitchProps> = (props) => (
  <Switch
    {...props}
    onChange={(isSelected) => console.log('change', isSelected)}
  />
);

export const Default = Template.bind({});
Default.args = {
  children: 'Switch label',
};

export const WithDefaultSelected = Template.bind({});
WithDefaultSelected.args = {
  children: 'Pre-selected switch',
  defaultSelected: true,
};

export const Small = Template.bind({});
Small.args = {
  children: 'Small switch',
  size: 'small',
};

export const Invalid = Template.bind({});
Invalid.args = {
  children: 'Required switch',
  validationState: 'invalid',
  isRequired: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  children: 'Disabled switch',
  isDisabled: true,
};

export const Loading = Template.bind({});
Loading.args = {
  children: 'Loading switch',
  isLoading: true,
};
