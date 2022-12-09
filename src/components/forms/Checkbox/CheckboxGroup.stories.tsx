import { Meta, Story } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { baseProps } from '../../../stories/lists/baseProps';
import { Form } from '../Form';
import { wait } from '../../../test';

import { CubeCheckboxGroupProps } from './CheckboxGroup';
import { Checkbox } from './Checkbox';

export default {
  title: 'Forms/CheckboxGroup',
  component: Checkbox.Group,
  subcomponents: { Checkbox },
  args: {
    label: 'Todo list',
    description: 'Pick your favorite todos',
  },
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
} as Meta<CubeCheckboxGroupProps>;

const Template: Story<CubeCheckboxGroupProps> = (props) => (
  <Checkbox.Group {...props}>
    <Checkbox value="one">Buy milk</Checkbox>
    <Checkbox value="two">Buy coffee</Checkbox>
    <Checkbox value="three">Buy bread</Checkbox>
  </Checkbox.Group>
);

export const Default = Template.bind({});
Default.args = {};

export const Horizontal = Template.bind({});
Horizontal.args = {
  orientation: 'horizontal',
};

export const HorizontalLabelSide = Template.bind({});
HorizontalLabelSide.args = {
  orientation: 'horizontal',
  labelPosition: 'side',
};

export const Invalid = Template.bind({});
Invalid.args = { validationState: 'invalid' };

export const Valid = Template.bind({});
Valid.args = { validationState: 'valid' };

export const Disabled = Template.bind({});
Disabled.args = { isDisabled: true };

export const InvalidDisabled = Template.bind({});
InvalidDisabled.args = { isDisabled: true, validationState: 'invalid' };

export const Readonly = Template.bind({});
Readonly.args = { isReadOnly: true };

export const InsideForm: Story<CubeCheckboxGroupProps> = (props) => {
  const onSubmit = action('onSubmit');

  return (
    <Form
      onSubmit={async (...args) => {
        await wait(500);
        onSubmit(...args);
      }}
    >
      <Checkbox.Group name="What to buy" defaultValue={['one']} {...props}>
        <Checkbox value="one">Buy milk</Checkbox>
        <Checkbox value="two">Buy coffee</Checkbox>
        <Checkbox value="three">Buy bread</Checkbox>
      </Checkbox.Group>

      <Form.Submit>Save</Form.Submit>
    </Form>
  );
};
