import { StoryFn } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';
import { Submit } from '../../actions';
import { Form } from '../../form';
import { TextInput } from '../TextInput/index';

import { TextInputMapper, CubeTextInputMapperProps } from './TextInputMapper';

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
    <TextInput name="field.name" label="TextInput" />
    <Submit>Submit</Submit>
  </Form>
);

export const Default = Template.bind({});
Default.args = {};

export const WithValue = Template.bind({});
WithValue.args = { value: { name: 'value' } };

export const WithinForm = FormTemplate.bind({});
WithinForm.args = {};
