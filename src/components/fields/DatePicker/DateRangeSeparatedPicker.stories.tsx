import { StoryFn } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';

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
  args: { fieldStyles: { width: '0 max-content 100%' } },
  parameters: {
    controls: {
      exclude: baseProps,
    },
    docs: {
      description: {
        component:
          'In a container too narrow for one row, the end box wraps onto a second row under the start box, and the dash stays at the end of the first row. The dates never shrink, and the field is never narrower than its widest row.',
      },
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
  // `getByRole('button')` the single-field pickers use is ambiguous here.
  const start = within(canvasElement).getByRole('button', {
    name: /^Show calendar for the start date/,
  });

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

// Too narrow for one row, so the end date wraps onto a second row.
export const Narrow = Template.bind({});
Narrow.args = {
  ...WithDefaultValue.args,
  fieldStyles: { width: '200px' },
};

export const Disabled = Template.bind({});
Disabled.args = { isDisabled: true };

export const Small = Template.bind({});
Small.args = { size: 'small' };

export const WithLocale = Template.bind({});
WithLocale.args = { useLocale: true };
