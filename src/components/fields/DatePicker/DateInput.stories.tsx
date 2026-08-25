import { StoryFn } from '@storybook/react-vite';

import { NO_SNAPSHOT } from '../../../stories/chromatic';
import {
  ICON_ARG,
  TIME_VALUE_ARG,
  VALIDATION_ARGS,
} from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';

import { CubeDateInputProps, DateInput } from './DateInput';
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
    ...VALIDATION_ARGS,
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

export const Validation: StoryFn<CubeDateInputProps> = (props) => (
  <Space gap="2x" flow="column" placeItems="start">
    <DateInput {...props} isValid aria-label="Valid date" />
    <DateInput {...props} isInvalid aria-label="Invalid date" />
  </Space>
);

export const Disabled = Template.bind({});
Disabled.args = { isDisabled: true };

export const Small = Template.bind({});
Small.args = { size: 'small' };

export const WithLimitedRange = Template.bind({});
WithLimitedRange.args = {
  minValue: parseAbsoluteDate('2023-10-04'),
  maxValue: parseAbsoluteDate('2023-12-15'),
};
// The range bounds only show once the calendar opens; closed, this is `Default`.
WithLimitedRange.parameters = NO_SNAPSHOT;

export const WithLocale = Template.bind({});
WithLocale.args = { useLocale: true };
