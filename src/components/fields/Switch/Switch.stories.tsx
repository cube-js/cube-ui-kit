import { StoryFn } from '@storybook/react-vite';

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
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
      description: 'Switch size',
      table: {
        defaultValue: { summary: 'large' },
      },
    },

    /* Events */
    onChange: {
      description: 'Callback fired when the switch value changes',
      control: { type: null },
    },
    onFocus: {
      description: 'Callback fired when the switch receives focus',
      control: { type: null },
    },
    onBlur: {
      description: 'Callback fired when the switch loses focus',
      control: { type: null },
    },
  },
};

const Template: StoryFn<CubeSwitchProps> = (props) => <Switch {...props} />;

export const Default = Template.bind({});
Default.args = {
  children: 'Switch label',
};

export const WithDefaultSelected = Template.bind({});
WithDefaultSelected.args = {
  children: 'Pre-selected switch',
  defaultSelected: true,
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

export const WithLabel = Template.bind({});
WithLabel.args = {
  label: 'Toggle feature',
};

// Stories showing all sizes for visual comparison
const SizesTemplate: StoryFn<CubeSwitchProps> = (props) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <Switch {...props} size="small">
      Small switch
    </Switch>
    <Switch {...props} size="medium">
      Medium switch
    </Switch>
    <Switch {...props} size="large">
      Large switch
    </Switch>
  </div>
);

export const Sizes = SizesTemplate.bind({});
Sizes.args = {};

// Stories showing both selected and unselected states for visual testing
const MultiStateTemplate: StoryFn<CubeSwitchProps> = (props) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <Switch {...props} isSelected={false}>
      {props.children} (unselected)
    </Switch>
    <Switch {...props} isSelected={true}>
      {props.children} (selected)
    </Switch>
  </div>
);

export const AllStates = MultiStateTemplate.bind({});
AllStates.args = {
  children: 'Switch',
};

export const AllStatesSmall = MultiStateTemplate.bind({});
AllStatesSmall.args = {
  children: 'Small switch',
  size: 'small',
};

export const AllStatesDisabled = MultiStateTemplate.bind({});
AllStatesDisabled.args = {
  children: 'Disabled switch',
  isDisabled: true,
};

export const AllStatesInvalid = MultiStateTemplate.bind({});
AllStatesInvalid.args = {
  children: 'Invalid switch',
  validationState: 'invalid',
  isRequired: true,
};

export const AllStatesLoading = MultiStateTemplate.bind({});
AllStatesLoading.args = {
  children: 'Loading switch',
  isLoading: true,
};
