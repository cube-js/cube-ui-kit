import { Switch } from './Switch';

export default {
  title: 'UIKit/Atoms/Switch',
  component: Switch,
  argTypes: {
    isSelected: {
      defaultValue: undefined,
      description: 'The position of labels for each field.',
      control: {
        type: 'radio',
        options: [undefined, true, false],
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'top' },
      },
    },
    isDisabled: {
      defaultValue: false,
      description: 'Disables the switch.',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    validationState: {
      defaultValue: undefined,
      description: 'The position of labels for each field.',
      control: {
        type: 'radio',
        options: [undefined, 'valid', 'invalid'],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'top' },
      },
    },
    label: {
      defaultValue: 'Switch label',
      control: 'text',
    },
  },
};

const Template = ({ label, isSelected, isDisabled, validationState }) => (
  <Switch
    label={label}
    validationState={validationState}
    isDisabled={isDisabled}
    defaultSelected={isSelected}
    onChange={(query) => console.log('change', query)}
  />
);

export const Default = Template.bind({});
Default.args = {};

export const WithoutLabel = Template.bind({});
WithoutLabel.args = {
  label: '',
};

export const Checked = Template.bind({});
Checked.args = {
  isSelected: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
};
