import { CalendarDate, isSameDay } from '@internationalized/date';
import { tasty } from '@tenphi/tasty';
import { useRef } from 'react';
import { DateValue, useCalendarCell } from 'react-aria';
import { CalendarState, RangeCalendarState } from 'react-stately';

import { CALENDAR_CELL_STYLES } from './styled';

const CalendarCellElement = tasty({
  as: 'td',
  styles: {
    margin: 0,
    padding: '2bw right bottom',
  },
});

const CalendarButtonElement = tasty({
  'data-popover-keep': true,
  styles: {
    ...CALENDAR_CELL_STYLES,
    width: '3x',
    height: '3x',
  },
});

export interface CubeCalendarCellProps {
  state: CalendarState | RangeCalendarState;
  date: CalendarDate;
  /** Today, expressed in the calendar system of the grid. */
  today?: CalendarDate;
  /** Explicit range highlight, used when the range lives outside the state. */
  selectedRange?: { start: DateValue; end: DateValue };
  /** Whether the whole row is highlighted (week picker mode). */
  rangeHover?: boolean;
}

export function CalendarCell(props: CubeCalendarCellProps) {
  let { state, selectedRange, date, today, rangeHover } = props;
  let ref = useRef(null);
  let {
    cellProps,
    buttonProps,
    isSelected,
    isPressed,
    isFocused,
    isInvalid,
    isOutsideVisibleRange,
    isDisabled,
    isUnavailable,
    formattedDate,
  } = useCalendarCell({ date }, state, ref);

  const isFinalSelected =
    !isOutsideVisibleRange &&
    (selectedRange
      ? date.compare(selectedRange.start) >= 0 &&
        date.compare(selectedRange.end) <= 0
      : isSelected);

  return (
    <CalendarCellElement {...cellProps}>
      <CalendarButtonElement
        {...buttonProps}
        ref={ref}
        mods={{
          selected: isFinalSelected,
          current: !!today && !isOutsideVisibleRange && isSameDay(date, today),
          outside: isOutsideVisibleRange,
          rangeHover: rangeHover && !isFinalSelected,
          pressed: isPressed,
          focused: isFocused,
          invalid: isInvalid,
          disabled: isDisabled,
          unavailable: isUnavailable,
        }}
      >
        {formattedDate}
      </CalendarButtonElement>
    </CalendarCellElement>
  );
}
