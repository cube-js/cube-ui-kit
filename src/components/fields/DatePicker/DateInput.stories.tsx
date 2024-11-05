import { StoryFn } from '@storybook/react';

import {
  ICON_ARG,
  TIME_VALUE_ARG,
  VALIDATION_STATE_ARG,
} from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';

import { DateInput, CubeDateInputProps } from './DateInput';
import { parseAbsoluteDate } from './parseDate';

export default {
  title: 'Forms/DateInput',
  component: DateInput,
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

const Template: StoryFn<CubeDateInputProps> = ({ ...props }) => {
  try {
    if (props.defaultValue) {
      props.defaultValue = parseAbsoluteDate(props.defaultValue);
    }
  } catch (e) {
    props.defaultValue = undefined;
  }

  try {
    if (props.value) {
      props.value = parseAbsoluteDate(props.value);
    }
  } catch (e) {
    props.value = undefined;
  }

  return (
    <DateInput
      aria-label="DateInput"
      wrapperStyles={{ width: 'max-content' }}
      {...props}
      onChange={(query) => console.log('change', query)}
    />
  );
};

export const Default = Template.bind({});
Default.args = {};

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultValue: new Date('2023-10-04 12:14') };

export const WithSecondGranularity = Template.bind({});
WithSecondGranularity.args = {
  defaultValue: new Date('2023-10-04 12:14'),
  granularity: 'second',
};

export const Invalid = Template.bind({});
Invalid.args = { validationState: 'invalid' };

export const Disabled = Template.bind({});
Disabled.args = { isDisabled: true };

export const Small = Template.bind({});
Small.args = { size: 'small' };

export const WithLimitedRange = Template.bind({});
WithLimitedRange.args = {
  minValue: parseAbsoluteDate('2023-10-04'),
  maxValue: parseAbsoluteDate('2023-12-15'),
};

export const WithLocale = Template.bind({});
WithLocale.args = { useLocale: true };
