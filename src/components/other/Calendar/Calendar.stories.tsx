import { CalendarDate, parseDate } from '@internationalized/date';
import { StoryFn } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { baseProps } from '../../../stories/lists/baseProps';
import { Space } from '../../layout/Space';

import { Calendar, CubeCalendarProps } from './Calendar';
import { CubePeriodCalendarProps, PeriodCalendar } from './PeriodCalendar';
import { RangeCalendar } from './RangeCalendar';

export default {
  title: 'Other/Calendar',
  component: Calendar,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Presentation */
    pickerMode: {
      options: ['day', 'week'],
      control: { type: 'radio' },
      description:
        'Set to `week` to show week numbers and highlight the whole week.',
      table: { defaultValue: { summary: 'day' } },
    },
    hasMonthYearNavigation: {
      control: { type: 'boolean' },
      description:
        'Whether the header lets the user jump straight to a month or a year.',
      table: { defaultValue: { summary: 'true' } },
    },
    /* State */
    isDisabled: { control: { type: 'boolean' } },
    isReadOnly: { control: { type: 'boolean' } },
    /* Events */
    onChange: { action: 'change', control: { type: null } },
  },
};

const Template: StoryFn<CubeCalendarProps> = (props) => <Calendar {...props} />;

export const Default = Template.bind({});
Default.args = { defaultValue: parseDate('2026-08-12') };

export const WeekMode = Template.bind({});
WeekMode.args = {
  defaultValue: parseDate('2026-08-12'),
  pickerMode: 'week',
};

export const LimitedRange = Template.bind({});
LimitedRange.args = {
  defaultValue: parseDate('2026-08-12'),
  minValue: parseDate('2026-08-05'),
  maxValue: parseDate('2026-09-20'),
};

export const Disabled = Template.bind({});
Disabled.args = { defaultValue: parseDate('2026-08-12'), isDisabled: true };

export const WithoutMonthYearNavigation = Template.bind({});
WithoutMonthYearNavigation.args = {
  defaultValue: parseDate('2026-08-12'),
  hasMonthYearNavigation: false,
};

export const Range: StoryFn = () => (
  <RangeCalendar
    defaultValue={{
      start: parseDate('2026-08-10'),
      end: parseDate('2026-08-19'),
    }}
  />
);

export const Periods: StoryFn<CubePeriodCalendarProps> = () => (
  <Space gap="2x" placeItems="start">
    <PeriodCalendar picker="month" value={new CalendarDate(2026, 8, 1)} />
    <PeriodCalendar picker="quarter" value={new CalendarDate(2026, 7, 1)} />
    <PeriodCalendar picker="year" value={new CalendarDate(2026, 1, 1)} />
  </Space>
);

/** The month panel is only reachable through an interaction. */
export const MonthPanel = Template.bind({});
MonthPanel.args = { defaultValue: parseDate('2026-08-12') };
MonthPanel.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await userEvent.click(await canvas.findByRole('button', { name: 'August' }));

  await waitFor(() =>
    expect(canvas.getByRole('grid', { name: 'Months' })).toBeVisible(),
  );
};

/** The year panel is only reachable through an interaction. */
export const YearPanel = Template.bind({});
YearPanel.args = { defaultValue: parseDate('2026-08-12') };
YearPanel.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await userEvent.click(await canvas.findByRole('button', { name: '2026' }));

  await waitFor(() =>
    expect(canvas.getByRole('grid', { name: 'Years' })).toBeVisible(),
  );
};
