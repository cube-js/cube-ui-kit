import { parseDate } from '@internationalized/date';
import { StoryFn } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';

import { VALIDATION_ARGS } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';

import { MonthPicker } from './MonthPicker';
import { CubePeriodPickerProps } from './PeriodPicker';
import { QuarterPicker } from './QuarterPicker';
import { WeekPicker } from './WeekPicker';
import { YearPicker } from './YearPicker';

export default {
  title: 'Forms/PeriodPicker',
  component: MonthPicker,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    label: { control: { type: 'text' } },
    placeholder: { control: { type: 'text' } },
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'radio' },
      table: { defaultValue: { summary: 'medium' } },
    },
    isDisabled: { control: { type: 'boolean' } },
    isReadOnly: { control: { type: 'boolean' } },
    isRequired: { control: { type: 'boolean' } },
    ...VALIDATION_ARGS,
    onChange: { action: 'change', control: { type: null } },
    onOpenChange: { action: 'open-change', control: { type: null } },
  },
};

const MonthTemplate: StoryFn<CubePeriodPickerProps> = (props) => (
  <MonthPicker aria-label="Month" wrapperStyles={{ width: '30x' }} {...props} />
);

export const Month = MonthTemplate.bind({});
Month.args = {};

export const MonthWithValue = MonthTemplate.bind({});
MonthWithValue.args = { defaultValue: parseDate('2026-08-01') };

export const Quarter: StoryFn<CubePeriodPickerProps> = (props) => (
  <QuarterPicker
    aria-label="Quarter"
    wrapperStyles={{ width: '30x' }}
    {...props}
  />
);
Quarter.args = { defaultValue: parseDate('2026-04-01') };

export const Year: StoryFn<CubePeriodPickerProps> = (props) => (
  <YearPicker aria-label="Year" wrapperStyles={{ width: '30x' }} {...props} />
);
Year.args = { defaultValue: parseDate('2026-01-01') };

export const Week: StoryFn<CubePeriodPickerProps> = (props) => (
  <WeekPicker aria-label="Week" wrapperStyles={{ width: '30x' }} {...props} />
);
Week.args = { defaultValue: parseDate('2026-08-10') };

export const AllPickers: StoryFn<CubePeriodPickerProps> = (props) => (
  <Space gap="2x" flow="column" placeItems="start">
    <WeekPicker aria-label="Week" wrapperStyles={{ width: '30x' }} {...props} />
    <MonthPicker
      aria-label="Month"
      wrapperStyles={{ width: '30x' }}
      {...props}
    />
    <QuarterPicker
      aria-label="Quarter"
      wrapperStyles={{ width: '30x' }}
      {...props}
    />
    <YearPicker aria-label="Year" wrapperStyles={{ width: '30x' }} {...props} />
  </Space>
);

export const Disabled = MonthTemplate.bind({});
Disabled.args = { isDisabled: true };

export const Small = MonthTemplate.bind({});
Small.args = { size: 'small' };

export const WithLimitedRange = MonthTemplate.bind({});
WithLimitedRange.args = {
  minValue: parseDate('2026-03-01'),
  maxValue: parseDate('2026-09-30'),
};

export const Validation: StoryFn<CubePeriodPickerProps> = (props) => (
  <Space gap="2x" flow="column" placeItems="start">
    <MonthPicker {...props} isValid aria-label="Valid month" />
    <MonthPicker {...props} isInvalid aria-label="Invalid month" />
  </Space>
);

export const Open = MonthTemplate.bind({});
Open.args = { defaultValue: parseDate('2026-08-01') };
Open.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = await canvas.getByRole('button');

  await userEvent.click(button);
};
