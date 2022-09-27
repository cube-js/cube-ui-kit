import { Meta, Story } from '@storybook/react';

import { TextInput } from '../../TextInput';
import { Form } from '../Form';

import { Field } from './Field';

import type { CubeFieldProps } from './types';

export default {
  title: 'Forms/Field',
  component: Field,
  args: { children: <TextInput label="Field name" /> },
  decorators: [(Story, context) => <Form>{Story(context.args)}</Form>],
} as Meta<CubeFieldProps<any>>;

const Template: Story<CubeFieldProps<any>> = (args) => <Field {...args} />;

export const Default = Template.bind({});

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = {
  defaultValue: 'Default value',
};

export const Invalid = Template.bind({});
Invalid.args = {
  validationState: 'invalid',
};
