import { Checkbox } from './Checkbox';

export default {
  title: 'UIKit/Atoms/CheckboxGroup',
  component: Checkbox.Group,
  argTypes: {
    isDisabled: {
      defaultValue: false,
      description: 'Disables the radio group.',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    orientation: {
      defaultValue: undefined,
      description: 'Orientation of the radio group.',
      control: {
        type: 'radio',
        options: [undefined, 'horizontal', 'vertical'],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'horizontal' },
      },
    },
    labelPosition: {
      defaultValue: 'top',
      description: 'The position of label for the radio group.',
      control: {
        type: 'radio',
        options: ['top', 'side'],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'top' },
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
    defaultValue: {
      defaultValue: undefined,
      description: 'Default value of the radio group.',
      control: {
        type: 'radio',
        options: [undefined, ['one'], ['one', 'three']],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'yes' },
      },
    },
    label: {
      defaultValue: 'Checkbox group label',
      control: 'text',
    },
  },
};

const Template = (props) => (
  <Checkbox.Group {...props} onChange={(query) => console.log('change', query)}>
    <Checkbox value="one">One</Checkbox>
    <Checkbox value="two">Two</Checkbox>
    <Checkbox value="three">Three</Checkbox>
  </Checkbox.Group>
);

export const Default = Template.bind({});
Default.args = {};
