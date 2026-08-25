import { StoryFn } from '@storybook/react-vite';
import { userEvent } from 'storybook/test';

import { ICON_ARG, VALIDATION_ARGS } from '../../../stories/FormFieldArgs';
import { waitForOverlay } from '../../../stories/interactions';
import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';

import {
  CubeDateRangeSeparatedPickerProps,
  DateRangeSeparatedPicker,
} from './DateRangeSeparatedPicker';
import { parseAbsoluteDate } from './parseDate';

export default {
  title: 'Forms/DateRangeSeparatedPicker',
  component: DateRangeSeparatedPicker,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...ICON_ARG,
    ...VALIDATION_ARGS,
  },
};

const Template: StoryFn<CubeDateRangeSeparatedPickerProps> = ({ ...props }) => {
  return (
    <DateRangeSeparatedPicker
      aria-label="DateRangeSeparatedPicker"
      wrapperStyles={{ width: 'max-content' }}
      {...props}
      onChange={(query) => console.log('change', query)}
    />
  );
};

export const Default = Template.bind({});
Default.args = {};

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = {
  defaultValue: {
    start: parseAbsoluteDate(new Date('2020-09-10')),
    end: parseAbsoluteDate(new Date('2021-04-01')),
  },
};

export const WithDefaultValueOpen = Template.bind({});
WithDefaultValueOpen.args = WithDefaultValue.args;
// Without this the story photographs a closed picker — identical to
// `WithDefaultValue` — and the calendar it is named for goes untested.
WithDefaultValueOpen.play = async ({ canvasElement }) => {
  // Two calendar triggers (start and end) plus the segment buttons, so the
  // `getByRole('button')` the single-field pickers use is ambiguous here. Nor
  // can the trigger be found by accessible name: it carries both `aria-label`
  // and an `aria-labelledby`, and `aria-labelledby` wins, so its name is the
  // field's label rather than "Calendar". Query the attribute directly.
  const start = canvasElement.querySelector('button[aria-label="Calendar"]');

  await userEvent.click(start);

  await waitForOverlay('dialog');
};

export const WithSecondGranularity = Template.bind({});
WithSecondGranularity.args = {
  defaultValue: {
    start: parseAbsoluteDate(new Date('2020-09-10 18:19')),
    end: parseAbsoluteDate(new Date('2020-10-02 14:12')),
  },
  granularity: 'second',
};

export const Validation: StoryFn<CubeDateRangeSeparatedPickerProps> = (
  props,
) => (
  <Space gap="2x" flow="column" placeItems="start">
    <DateRangeSeparatedPicker {...props} isValid aria-label="Valid range" />
    <DateRangeSeparatedPicker {...props} isInvalid aria-label="Invalid range" />
  </Space>
);

export const Disabled = Template.bind({});
Disabled.args = { isDisabled: true };

export const Small = Template.bind({});
Small.args = { size: 'small' };

export const WithLocale = Template.bind({});
WithLocale.args = { useLocale: true };
