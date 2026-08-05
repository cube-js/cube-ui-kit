import { getWeeksInMonth } from '@internationalized/date';
import { tasty } from '@tenphi/tasty';
import { useCalendarGrid, useLocale } from 'react-aria';

import { getWeekNumber } from '../../fields/DatePicker/period';

import { CalendarCell } from './CalendarCell';

const TableElement = tasty({
  as: 'table',
  styles: {
    borderCollapse: 'collapse',

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

export function CalendarGrid({ state, pickerMode = 'day', ...props }) {
  let { locale } = useLocale();
  let { gridProps, headerProps, weekDays } = useCalendarGrid(props, state);

  // Get the number of weeks in the month, so we can render the proper number of rows.
  let weeksInMonth = getWeeksInMonth(state.visibleRange.start, locale);
  let showWeekNumbers = pickerMode === 'week';

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

          return (
            <tr key={weekIndex} data-element="Row">
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
                    selectedRange={props.selectedRange}
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
