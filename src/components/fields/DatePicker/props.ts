import {
  AriaDatePickerProps,
  AriaTimeFieldProps,
  DateValue,
  TimeValue,
} from 'react-aria';

export const DEFAULT_DATE_PROPS = {
  granularity: 'day',
  hideTimeZone: true,
  hourCycle: 24,
  shouldForceLeadingZeros: true,
} satisfies Partial<AriaDatePickerProps<DateValue>>;

export const DEFAULT_TIME_PROPS = {
  hideTimeZone: true,
  hourCycle: 24,
  shouldForceLeadingZeros: true,
} satisfies Partial<AriaTimeFieldProps<TimeValue>>;
