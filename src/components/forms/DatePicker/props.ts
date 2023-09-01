import { DatePickerProps } from '@react-types/datepicker';
import { DateValue } from '@react-aria/calendar';

export const DEFAULT_DATE_PROPS: Partial<DatePickerProps<DateValue>> = {
  granularity: 'day',
  hideTimeZone: true,
  hourCycle: 24,
  shouldForceLeadingZeros: true,
};

export const DEFAULT_TIME_PROPS: Partial<DatePickerProps<DateValue>> = {
  hideTimeZone: true,
  hourCycle: 24,
  shouldForceLeadingZeros: true,
};
