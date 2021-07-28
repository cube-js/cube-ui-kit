import { Checkbox } from './Checkbox';

export default {
  title: 'UIKit/Atoms/Checkbox',
  component: Checkbox,
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
    isIndeterminate: {
      defaultValue: false,
      description: 'Intermediate state',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    isDisabled: {
      defaultValue: false,
      description: 'Disables the checkbox.',
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
      defaultValue: 'Checkbox label',
      control: 'text',
    },
  },
};

const Template = ({
  label,
  isSelected,
  isIndeterminate,
  isDisabled,
  validationState,
}) => (
  <Checkbox
    label={label}
    validationState={validationState}
    isDisabled={isDisabled}
    defaultSelected={isSelected}
    isIndeterminate={isIndeterminate}
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

export const Intermediate = Template.bind({});
Intermediate.args = {
  isIndeterminate: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
};
