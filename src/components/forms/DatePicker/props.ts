import { DatePickerProps } from '@react-types/datepicker';
import { DateValue } from '@react-aria/calendar';

export const DEFAULT_DATE_PROPS: Pick<
  DatePickerProps<DateValue>,
  'hideTimeZone' | 'hourCycle' | 'granularity'
> = {
  granularity: 'day',
  hideTimeZone: true,
  hourCycle: 24,
};

export const DEFAULT_TIME_PROPS: Pick<
  DatePickerProps<DateValue>,
  'hideTimeZone' | 'hourCycle'
> = {
  hideTimeZone: true,
  hourCycle: 24,
};
