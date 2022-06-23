import { StoryFn } from '@storybook/react';
import { Field, TextInput } from '../../../index';
import { baseProps } from '../../../stories/lists/baseProps';

export default {
  title: 'Forms/Field',
  component: Field,
  parameters: { controls: { exclude: baseProps } },
};

const Template: StoryFn<typeof Field> = (args) => {
  return (
    <Field label="Field name" {...args}>
      <TextInput />
    </Field>
  );
};

export const Default: StoryFn<typeof Field> = Template.bind({});
Default.args = {};

export const WithTooltip: StoryFn<typeof Field> = Template.bind({});
WithTooltip.args = {
  tooltip: 'Long description',
};

export const WithMessage: StoryFn<typeof Field> = Template.bind({});
WithMessage.args = {
  message: 'Inline description of the field',
};

export const WithErrorMessage: StoryFn<typeof Field> = Template.bind({});
WithErrorMessage.args = {
  message: 'This field is required',
  validationState: 'error',
};

export const Styled: StoryFn<typeof Field> = Template.bind({});
Styled.args = {
  styles: {
    width: '30x',
  },
};
