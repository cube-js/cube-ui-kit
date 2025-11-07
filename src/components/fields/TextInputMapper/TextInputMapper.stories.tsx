import { StoryFn } from '@storybook/react-vite';
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
  argTypes: {
    /* Content */
    value: {
      control: { type: 'object' },
      description: 'The key-value mappings in controlled mode',
    },
    actionLabel: {
      control: { type: 'text' },
      description: 'Label for the add mapping button',
      table: {
        defaultValue: { summary: 'Add mapping' },
      },
    },

    /* Components */
    KeyComponent: {
      control: { type: null },
      description: 'Custom component for key inputs',
    },
    ValueComponent: {
      control: { type: null },
      description: 'Custom component for value inputs',
    },
    keyProps: {
      control: { type: 'object' },
      description: 'Props to pass to key input components',
    },
    valueProps: {
      control: { type: 'object' },
      description: 'Props to pass to value input components',
    },

    /* Behavior */
    allowsCustomValue: {
      control: { type: 'boolean' },
      description: 'Whether users can enter custom values',
      table: {
        defaultValue: { summary: true },
      },
    },

    /* State */
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the entire mapper is disabled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether user input is required before form submission',
      table: {
        defaultValue: { summary: false },
      },
    },
    validationState: {
      options: [undefined, 'valid', 'invalid'],
      control: { type: 'radio' },
      description:
        'Whether the mapper should display valid or invalid visual styling',
    },

    /* Events */
    onChange: {
      action: 'change',
      description: 'Callback fired when the mappings change',
      control: { type: null },
    },

    /* Form */
    name: {
      control: { type: 'text' },
      description: 'The name of the field for form submission',
    },
    label: {
      control: { type: 'text' },
      description: 'The label text for the mapper',
    },
    labelPosition: {
      options: ['top', 'side'],
      control: { type: 'radio' },
      description: 'The position of the label relative to the mapper',
      table: {
        defaultValue: { summary: 'top' },
      },
    },
    necessityIndicator: {
      options: ['icon', 'label'],
      control: { type: 'radio' },
      description: 'How to display required or optional indicators',
      table: {
        defaultValue: { summary: 'icon' },
      },
    },
    isInvalid: {
      control: { type: 'boolean' },
      description: 'Whether the current mappings are invalid',
      table: {
        defaultValue: { summary: false },
      },
    },
    description: {
      control: { type: 'text' },
      description: 'Help text to describe the mapper',
    },
    message: {
      control: { type: 'text' },
      description: 'Error message when validation fails',
    },

    /* Style */
    styles: {
      control: { type: 'object' },
      description: 'Custom styles object for styling the component',
    },
  },
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
