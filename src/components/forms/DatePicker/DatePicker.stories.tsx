import { StoryFn } from '@storybook/react';
import { parseDate } from '@internationalized/date';

import {
  ICON_ARG,
  TIME_VALUE_ARG,
  VALIDATION_STATE_ARG,
} from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';

import { DatePicker, CubeDatePickerProps } from './DatePicker';

export default {
  title: 'Forms/DatePicker',
  component: DatePicker,
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

const Template: StoryFn<CubeDatePickerProps> = ({ ...props }) => {
  try {
    if (props.defaultValue) {
      props.defaultValue = parseDate(props.defaultValue);
    }
  } catch (e) {
    props.defaultValue = undefined;
  }

  try {
    if (props.value) {
      props.value = parseDate(props.value);
    }
  } catch (e) {
    props.value = undefined;
  }

  return (
    <DatePicker
      aria-label="DatePicker"
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
