import { StoryFn } from '@storybook/react';
import { parseTime } from '@internationalized/date';

import {
  ICON_ARG,
  TIME_VALUE_ARG,
  VALIDATION_STATE_ARG,
} from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';

import { TimeInput, CubeTimeInputProps } from './TimeInput';

export default {
  title: 'Forms/TimeInput',
  component: TimeInput,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...TIME_VALUE_ARG,
    ...ICON_ARG,
    ...VALIDATION_STATE_ARG,
  },
};

const Template: StoryFn<CubeTimeInputProps> = ({ ...props }) => {
  try {
    if (props.defaultValue) {
      props.defaultValue = parseTime(props.defaultValue);
    }
  } catch (e) {
    props.defaultValue = undefined;
  }

  try {
    if (props.value) {
      props.value = parseTime(props.value);
    }
  } catch (e) {
    props.value = undefined;
  }

  return (
    <TimeInput
      aria-label="TimeInput"
      wrapperStyles={{ width: 'max-content' }}
      {...props}
      onChange={(query) => console.log('change', query)}
    />
  );
};

export const Default = Template.bind({});
Default.args = {};

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultValue: new Date() };

export const Invalid = Template.bind({});
Invalid.args = { validationState: 'invalid' };

export const Disabled = Template.bind({});
Disabled.args = { isDisabled: true };

export const Small = Template.bind({});
Small.args = { size: 'small' };
