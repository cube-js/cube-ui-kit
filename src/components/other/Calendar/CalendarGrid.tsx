import { useCalendarGrid, useLocale } from 'react-aria';
import { getWeeksInMonth } from '@internationalized/date';

import { tasty } from '../../../tasty';

import { CalendarCell } from './CalendarCell';

const TableElement = tasty({
  as: 'table',
  styles: {
    borderCollapse: 'collapse',

    HeadRow: {
      color: '#dark-04',
    },
  },
});

export function CalendarGrid({ state, ...props }) {
  let { locale } = useLocale();
  let { gridProps, headerProps, weekDays } = useCalendarGrid(props, state);

  // Get the number of weeks in the month, so we can render the proper number of rows.
  let weeksInMonth = getWeeksInMonth(state.visibleRange.start, locale);

  return (
    <TableElement {...gridProps}>
      <thead data-element="Head" {...headerProps}>
        <tr data-element="HeadRow">
          {weekDays.map((day, index) => (
            <th key={index}>{day}</th>
          ))}
        </tr>
      </thead>
      <tbody data-element="Body">
        {[...new Array(weeksInMonth).keys()].map((weekIndex) => (
          <tr key={weekIndex} data-element="Row">
            {state
              .getDatesInWeek(weekIndex)
              .map((date, i) =>
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
        ))}
      </tbody>
    </TableElement>
  );
}
