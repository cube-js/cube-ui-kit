import React from 'react';
import { TextField } from '../TextField/TextField';
import { Form } from '../Form/Form';
import { Block } from '../../components/Block';
import { Submit } from '../../components/Submit';

export default {
  title: 'UIKit/Atoms/Form',
  component: Form,
  argTypes: {
    isDisabled: {
      defaultValue: false,
      description: 'Disables the input.',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    labelPosition: {
      defaultValue: 'top',
      description: 'The position of labels for each field.',
      control: {
        type: 'radio',
        options: ['top', 'side'],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'top' },
      },
    },
  },
};

const Template = ({ isDisabled, labelPosition }) => (
  <Form
    isDisabled={isDisabled}
    labelPosition={labelPosition}
    onSubmit={(v) => {
      console.log('!', v);
    }}
  >
    <TextField name="first" label="First field" />
    <TextField name="second" label="Second field" />
    <Block styles={{ margin: '2x top' }}>
      <Submit>Submit</Submit>
    </Block>
  </Form>
);

export const Default = Template.bind({});
Default.args = {};
