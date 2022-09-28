import { Meta, Story } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';

import { Checkbox, CubeCheckboxProps } from './Checkbox';

export default {
  title: 'Forms/Checkbox',
  component: Checkbox,
  args: { label: 'Buy milk' },
  parameters: { layout: 'centered', controls: { exclude: baseProps } },
} as Meta<CubeCheckboxProps>;

const Template: Story<CubeCheckboxProps> = (props) => <Checkbox {...props} />;

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

export const Invalid = Template.bind({});
Invalid.args = {
  validationState: 'invalid',
  description: 'This field is required',
};

export const InvalidChecked = Template.bind({});
InvalidChecked.args = {
  isSelected: true,
  validationState: 'invalid',
  description: 'This field is required',
};

export const InvalidIntermediate = Template.bind({});
InvalidIntermediate.args = {
  isSelected: true,
  isIndeterminate: true,
  validationState: 'invalid',
};

export const InvalidDisabled = Template.bind({});
InvalidDisabled.args = {
  isDisabled: true,
  validationState: 'invalid',
  description: 'This field is required',
};

export const InvalidDisabledChecked = Template.bind({});
InvalidDisabledChecked.args = {
  isSelected: true,
  isDisabled: true,
  validationState: 'invalid',
};

export const Valid = Template.bind({});
Valid.args = {
  validationState: 'valid',
  description: 'Looks good',
};

export const ValidChecked = Template.bind({});
ValidChecked.args = {
  isSelected: true,
  validationState: 'valid',
  description: 'Looks good',
};

export const ValidIntermediate = Template.bind({});
ValidIntermediate.args = {
  isIndeterminate: true,
  validationState: 'valid',
  description: 'Looks good',
};

export const ValidDisabled = Template.bind({});
ValidDisabled.args = {
  isDisabled: true,
  validationState: 'valid',
  description: 'Looks good',
};
