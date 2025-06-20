import { StoryFn } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';
import { Block } from '../../Block';
import { TextInput } from '../../fields/TextInput';

import { Field } from './Field';
import { CubeFieldProps } from './use-field/types';

export default {
  title: 'Forms/Field',
  component: Field,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    label: {
      control: { type: 'text' },
      description: 'Field label text',
    },
    description: {
      control: { type: 'text' },
      description: 'Field description text',
    },
    extra: {
      control: { type: 'text' },
      description: 'Additional information displayed below help text',
    },
    tooltip: {
      control: { type: 'text' },
      description: 'Tooltip content for the field label',
    },
    message: {
      control: { type: 'text' },
      description: 'Error or help message',
    },

    /* Field Properties */
    name: {
      control: { type: 'text' },
      description: 'Field name for form data',
    },
    defaultValue: {
      control: { type: 'text' },
      description: 'Default field value',
    },
    rules: {
      control: { type: null },
      description: 'Validation rules array',
    },

    /* Presentation */
    labelPosition: {
      options: ['top', 'side'],
      control: { type: 'radio' },
      description: 'Position of the field label',
      table: {
        defaultValue: { summary: 'top' },
      },
    },
    necessityIndicator: {
      options: ['icon', 'label'],
      control: { type: 'radio' },
      description: 'Type of necessity indicator',
    },
    necessityLabel: {
      control: { type: 'text' },
      description: 'Custom necessity label text',
    },

    /* State */
    isRequired: {
      control: { type: 'boolean' },
      description: 'Whether the field is required',
      table: {
        defaultValue: { summary: false },
      },
    },
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Whether the field is disabled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isLoading: {
      control: { type: 'boolean' },
      description: 'Whether the field is in loading state',
      table: {
        defaultValue: { summary: false },
      },
    },
    isHidden: {
      control: { type: 'boolean' },
      description: 'Whether the field is hidden',
      table: {
        defaultValue: { summary: false },
      },
    },
    validationState: {
      options: [undefined, 'valid', 'invalid'],
      control: { type: 'radio' },
      description: 'Validation state of the field',
    },

    /* Styling */
    styles: {
      control: { type: null },
      description: 'Style map for the field wrapper',
    },
    labelStyles: {
      control: { type: null },
      description: 'Style map for the field label',
    },
    labelProps: {
      control: { type: null },
      description: 'Additional props for the label element',
    },
    labelSuffix: {
      control: { type: null },
      description: 'Content to display after the label',
    },

    /* Advanced */
    form: {
      control: { type: null },
      description: 'Form instance',
    },
    children: {
      control: { type: null },
      description: 'Field content (input component or function)',
    },
  },
};

const Template: StoryFn<CubeFieldProps<any>> = (args) => (
  <Field {...args}>
    <Block padding="2x" border="#purple-text.10" radius="1r">
      Read-only content styled as a field
    </Block>
  </Field>
);

export const Default = Template.bind({});
Default.args = {
  label: 'Field Label',
  description: 'This is a field description',
};

export const WithInput = () => (
  <Field isRequired label="Email" name="email">
    <TextInput placeholder="Enter your email" />
  </Field>
);

export const ReadOnlyContent = Template.bind({});
ReadOnlyContent.args = {
  label: 'Status',
  description: 'Current system status',
  validationState: 'valid',
};

export const WithError = Template.bind({});
WithError.args = {
  label: 'Error Field',
  validationState: 'invalid',
  message: 'This field has an error',
};
