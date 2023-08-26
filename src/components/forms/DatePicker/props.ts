import { DatePickerProps } from '@react-types/datepicker';
import { DateValue } from '@react-aria/calendar';

export const DEFAULT_DATE_PROPS: Pick<
  DatePickerProps<DateValue>,
  'hideTimeZone' | 'hourCycle'
> = {
  hideTimeZone: true,
  hourCycle: 24,
};
