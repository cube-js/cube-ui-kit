import {
  today as getToday,
  getWeeksInMonth,
  toCalendar,
} from '@internationalized/date';
import { tasty } from '@tenphi/tasty';
import { useMemo, useState } from 'react';
import { DateValue, useCalendarGrid, useLocale } from 'react-aria';
import { CalendarState, RangeCalendarState } from 'react-stately';

import { getWeekNumber } from '../../fields/DatePicker/period';

import { CalendarCell } from './CalendarCell';

const TableElement = tasty({
  as: 'table',
  styles: {
    borderCollapse: 'collapse',
    borderSpacing: 0,

    HeadRow: {
      color: '#dark-04',
    },

    WeekNumber: {
      preset: 't3m',
      color: '#dark-04',
      textAlign: 'center',
      padding: '0 1x',
    },
  },
});

export interface CubeCalendarGridProps {
  state: CalendarState | RangeCalendarState;
  /** Explicit range highlight, used when the range lives outside the state. */
  selectedRange?: { start: DateValue; end: DateValue };
  /**
   * When set to `week`, the grid shows a leading week-number column and
   * highlights the whole week under the pointer.
   */
  pickerMode?: 'day' | 'week';
}

export function CalendarGrid(props: CubeCalendarGridProps) {
  let { state, selectedRange, pickerMode = 'day' } = props;
  let { locale } = useLocale();
  let { gridProps, headerProps, weekDays } = useCalendarGrid(props, state);

  // Get the number of weeks in the month, so we can render the proper number of rows.
  let weeksInMonth = getWeeksInMonth(state.visibleRange.start, locale);
  let showWeekNumbers = pickerMode === 'week';

  let today = useMemo(
    () =>
      toCalendar(getToday(state.timeZone), state.visibleRange.start.calendar),
    [state.timeZone, state.visibleRange.start.calendar],
  );

  // In week mode, hovering any day highlights the whole week row.
  let [hoveredWeek, setHoveredWeek] = useState<number | null>(null);

  return (
    <TableElement {...gridProps}>
      <thead data-element="Head" {...headerProps}>
        <tr data-element="HeadRow">
          {showWeekNumbers && <th aria-hidden="true" />}
          {weekDays.map((day, index) => (
            <th key={index}>{day}</th>
          ))}
        </tr>
      </thead>
      <tbody data-element="Body">
        {[...new Array(weeksInMonth).keys()].map((weekIndex) => {
          let datesInWeek = state.getDatesInWeek(weekIndex);
          let firstDate = datesInWeek.find(Boolean);
          let isRowHovered = showWeekNumbers && hoveredWeek === weekIndex;

          return (
            <tr
              key={weekIndex}
              data-element="Row"
              onMouseEnter={
                showWeekNumbers ? () => setHoveredWeek(weekIndex) : undefined
              }
              onMouseLeave={
                showWeekNumbers ? () => setHoveredWeek(null) : undefined
              }
            >
              {showWeekNumbers && (
                <td data-element="WeekNumber" aria-hidden="true">
                  {firstDate ? getWeekNumber(firstDate, locale) : ''}
                </td>
              )}
              {datesInWeek.map((date, i) =>
                date ? (
                  <CalendarCell
                    key={i}
                    state={state}
                    date={date}
                    today={today}
                    selectedRange={selectedRange}
                    rangeHover={isRowHovered}
                  />
                ) : (
                  <td key={i} />
                ),
              )}
            </tr>
          );
        })}
      </tbody>
    </TableElement>
  );
}
