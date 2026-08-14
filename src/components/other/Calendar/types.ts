import { CalendarDate } from '@internationalized/date';
import { RangeValue } from '@react-types/shared';
import { DateValue } from 'react-aria';

/**
 * `AriaCalendarProps` silently resolves to nothing under `preserveSymlinks`
 * (see AGENTS.md → TypeScript & Exports), so `extends AriaCalendarProps`
 * contributes no members and every prop below would go unchecked. Declare the
 * ones the calendars genuinely support instead.
 */
export interface CalendarCoreProps {
  /** The earliest date a user may select. */
  minValue?: DateValue | null;
  /** The latest date a user may select. */
  maxValue?: DateValue | null;
  /** Called for each visible date; return `true` to make it unselectable. */
  isDateUnavailable?: (date: DateValue) => boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  autoFocus?: boolean;
  /** The date the calendar shows and focuses (controlled). */
  focusedValue?: DateValue | null;
  /** The date the calendar shows and focuses initially (uncontrolled). */
  defaultFocusedValue?: DateValue | null;
  /** Whether paging moves by one page or by one unit. */
  pageBehavior?: 'single' | 'visible';
  onFocusChange?: (date: CalendarDate) => void;
  /**
   * Whether the header month and year are buttons that open the month and year
   * lists.
   * @default true
   */
  hasMonthYearNavigation?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-details'?: string;
}

export interface CalendarValueProps {
  value?: DateValue | null;
  defaultValue?: DateValue | null;
  onChange?: (value: DateValue) => void;
}

export interface RangeCalendarValueProps {
  value?: RangeValue<DateValue> | null;
  defaultValue?: RangeValue<DateValue> | null;
  onChange?: (value: RangeValue<DateValue>) => void;
  /** Whether a range may span dates that `isDateUnavailable` rejects. */
  allowsNonContiguousRanges?: boolean;
}
