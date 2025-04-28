import { AriaDatePickerProps, DateValue } from 'react-aria';

export const DEFAULT_DATE_PROPS: Partial<AriaDatePickerProps<DateValue>> = {
  granularity: 'day',
  hideTimeZone: true,
  hourCycle: 24,
  shouldForceLeadingZeros: true,
};

export const DEFAULT_TIME_PROPS: Partial<AriaDatePickerProps<DateValue>> = {
  hideTimeZone: true,
  hourCycle: 24,
  shouldForceLeadingZeros: true,
};
