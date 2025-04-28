import { StoryFn } from '@storybook/react';
import { userEvent, within } from '@storybook/test';

import { baseProps } from '../../../stories/lists/baseProps';
import { Form } from '../../form';
import { TextInput } from '../TextInput/index';

import { CubeTextInputMapperProps, TextInputMapper } from './TextInputMapper';

export default {
  title: 'Forms/TextInputMapper',
  component: TextInputMapper,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {},
};

const Template: StoryFn<CubeTextInputMapperProps> = ({ ...props }) => (
  <TextInputMapper
    name="field"
    {...props}
    onChange={(value) => console.log('! onChange', value)}
  />
);

const FormTemplate: StoryFn<CubeTextInputMapperProps> = ({ ...props }) => (
  <Form
    defaultValues={{ field: { name: 'value' } }}
    labelPosition="top"
    onSubmit={(data) => console.log('! onSubmit', data)}
  >
    <TextInputMapper
      name="field"
      label="Field Mapper"
      {...props}
      onChange={(value) => console.log('! onChange', value)}
    />
    <Form.Submit>Submit</Form.Submit>
  </Form>
);

const FormTemplateSync: StoryFn<CubeTextInputMapperProps> = ({ ...props }) => (
  <Form
    defaultValues={{ field: { name: 'value' } }}
    labelPosition="top"
    onSubmit={(data) => console.log('! onSubmit', data)}
  >
    <TextInputMapper
      name="field"
      label="Field Mapper"
      {...props}
      onChange={(value) => console.log('! onChange', value)}
    />
    <TextInput name="field.name" label="TextInput" />
    <Form.Submit>Submit</Form.Submit>
  </Form>
);

export const Default = Template.bind({});
Default.args = {};

export const WithValue = Template.bind({});
WithValue.args = { value: { name: 'value' } };

export const WithValueAndNewMapping = Template.bind({});
WithValueAndNewMapping.args = {
  value: { name: 'value' },
  keyProps: { placeholder: 'Key placeholder' },
  valueProps: { placeholder: 'Value placeholder' },
};

WithValueAndNewMapping.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = await canvas.getByText('Mapping');

  await userEvent.click(button);
};

export const WithinForm = FormTemplate.bind({});
WithinForm.args = {};

export const WithinFormInputSync = FormTemplateSync.bind({});
WithinFormInputSync.args = {};

export const WithComboBoxKeyAndValue = Template.bind({});
WithComboBoxKeyAndValue.args = {
  value: { 'Option 1': 'Option 2' },
  keyProps: {
    inputType: 'combobox',
    menuTrigger: 'focus',
    options: ['Option 1', 'Option 2', 'Option 3'],
  },
  valueProps: {
    inputType: 'combobox',
    options: ['Option 1', 'Option 2', 'Option 3'],
  },
};
WithComboBoxKeyAndValue.play = WithValueAndNewMapping.play;

export const WithPassword = Template.bind({});
WithPassword.args = {
  value: { 'Key 1': 'Hidden' },
  keyProps: { autocomplete: 'off' },
  valueProps: { inputType: 'password', autocomplete: 'off' },
};

export const WithTextArea = Template.bind({});
WithTextArea.args = {
  value: { 'Key 1': 'Line 1\nLine 2' },
  valueProps: { inputType: 'textarea' },
};
