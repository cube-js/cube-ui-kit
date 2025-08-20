import { StoryFn } from '@storybook/react-vite';

import { baseProps } from '../../../stories/lists/baseProps';

import { Checkbox, CubeCheckboxProps } from './Checkbox';

export default {
  title: 'Forms/Checkbox',
  component: Checkbox,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    children: {
      control: { type: 'text' },
      description: 'The content to display as the checkbox label',
    },
    label: {
      control: { type: 'text' },
      description: 'External label for the checkbox',
    },
    value: {
      control: { type: 'text' },
      description: 'Value for the checkbox when used in a group',
    },

    /* State */
    isSelected: {
      control: { type: 'boolean' },
      description: 'Whether the checkbox is selected (controlled)',
      table: {
        defaultValue: { summary: false },
      },
    },
    defaultSelected: {
      control: { type: 'boolean' },
      description: 'Whether the checkbox is selected by default (uncontrolled)',
      table: {
        defaultValue: { summary: false },
      },
    },
    isIndeterminate: {
      control: { type: 'boolean' },
      description: 'Whether the checkbox is in an indeterminate state',
      table: {
        defaultValue: { summary: false },
      },
    },
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the checkbox is disabled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isReadOnly: {
      control: { type: 'boolean' },
      description: 'Whether the checkbox can be focused but not changed',
      table: {
        defaultValue: { summary: false },
      },
    },
    isRequired: {
      control: { type: 'boolean' },
      description:
        'Whether the checkbox must be checked before form submission',
      table: {
        defaultValue: { summary: false },
      },
    },
    validationState: {
      options: [undefined, 'valid', 'invalid'],
      control: { type: 'radio' },
      description:
        'Whether the checkbox should display valid or invalid visual styling',
    },
    autoFocus: {
      control: { type: 'boolean' },
      description: 'Whether the element should receive focus on render',
      table: {
        defaultValue: { summary: false },
      },
    },

    /* Events */
    onChange: {
      action: 'change',
      description: 'Callback fired when the checkbox value changes',
      control: { type: null },
    },
    onFocus: {
      action: 'focus',
      description: 'Callback fired when the checkbox receives focus',
      control: { type: null },
    },
    onBlur: {
      action: 'blur',
      description: 'Callback fired when the checkbox loses focus',
      control: { type: null },
    },
  },
};

const Template: StoryFn<CubeCheckboxProps> = (props) => (
  <Checkbox
    {...props}
    onChange={(isSelected) => console.log('change', isSelected)}
  />
);

export const Default = Template.bind({});
Default.args = {
  children: 'Checkbox label',
};

export const WithDefaultSelected = Template.bind({});
WithDefaultSelected.args = {
  children: 'Pre-selected checkbox',
  defaultSelected: true,
};

export const Indeterminate = Template.bind({});
Indeterminate.args = {
  children: 'Select all items',
  isIndeterminate: true,
};

export const Invalid = Template.bind({});
Invalid.args = {
  children: 'Required checkbox',
  validationState: 'invalid',
  isRequired: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  children: 'Disabled checkbox',
  isDisabled: true,
};

// Stories showing both checked and unchecked states for visual testing
const MultiStateTemplate: StoryFn<CubeCheckboxProps> = (props) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <Checkbox
      {...props}
      isSelected={false}
      onChange={(isSelected) => console.log('unchecked change', isSelected)}
    >
      {props.children} (unchecked)
    </Checkbox>
    <Checkbox
      {...props}
      isSelected={true}
      onChange={(isSelected) => console.log('checked change', isSelected)}
    >
      {props.children} (checked)
    </Checkbox>
  </div>
);

export const AllStates = MultiStateTemplate.bind({});
AllStates.args = {
  children: 'Checkbox',
};

export const AllStatesDisabled = MultiStateTemplate.bind({});
AllStatesDisabled.args = {
  children: 'Disabled checkbox',
  isDisabled: true,
};

export const AllStatesInvalid = MultiStateTemplate.bind({});
AllStatesInvalid.args = {
  children: 'Invalid checkbox',
  validationState: 'invalid',
  isRequired: true,
};

const IndeterminateMultiStateTemplate: StoryFn<CubeCheckboxProps> = (props) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <Checkbox
      {...props}
      isSelected={false}
      onChange={(isSelected) => console.log('unchecked change', isSelected)}
    >
      {props.children} (unchecked)
    </Checkbox>
    <Checkbox
      {...props}
      isIndeterminate={true}
      onChange={(isSelected) => console.log('indeterminate change', isSelected)}
    >
      {props.children} (indeterminate)
    </Checkbox>
    <Checkbox
      {...props}
      isSelected={true}
      onChange={(isSelected) => console.log('checked change', isSelected)}
    >
      {props.children} (checked)
    </Checkbox>
  </div>
);

export const AllStatesWithIndeterminate = IndeterminateMultiStateTemplate.bind(
  {},
);
AllStatesWithIndeterminate.args = {
  children: 'Select items',
};
