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

export const Default = Template.bind({});
Default.args = {};

export const WithTooltip = Template.bind({});
WithTooltip.args = {
  tooltip: 'Long description',
};

export const WithMessage = Template.bind({});
WithMessage.args = {
  message: 'Inline description of the field',
};

export const WithErrorMessage = Template.bind({});
WithErrorMessage.args = {
  message: 'This field is required',
  validationState: 'error',
};

export const Styled = Template.bind({});
Styled.args = {
  // labelPosition: 'side',
  styles: {
    placeItems: 'end',
  },
};

export const StyledLabel = Template.bind({});
StyledLabel.args = {
  labelStyles: {
    preset: 't2m',
  },
};

export const StyledLabel = Template.bind({});
StyledLabel.args = {
  labelStyles: {
    preset: 't1',
  },
};
