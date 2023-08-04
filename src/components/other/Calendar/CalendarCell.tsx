import { useRef } from 'react';
import { useCalendarCell } from '@react-aria/calendar';

import { tasty } from '../../../tasty';

const CalendarCellElement = tasty({
  as: 'td',
  styles: {
    preset: 't3m',
    margin: 0,
    padding: '1bw right bottom',
  },
});

const CalendarButtonElement = tasty({
  styles: {
    display: 'grid',
    placeItems: 'center',
    width: '3.5x',
    height: '3.5x',
    color: {
      '': '#dark',
      selected: '#white',
    },
    fill: {
      '': '#white',
      ':hover': '#purple.2',
      selected: '#purple',
    },
    radius: true,
    cursor: 'pointer',
  },
});

export function CalendarCell({ state, date }) {
  let ref = useRef(null);
  let {
    cellProps,
    buttonProps,
    isSelected,
    isOutsideVisibleRange,
    isDisabled,
    isUnavailable,
    formattedDate,
  } = useCalendarCell({ date }, state, ref);

  return (
    <CalendarCellElement {...cellProps}>
      <CalendarButtonElement
        {...buttonProps}
        ref={ref}
        hidden={isOutsideVisibleRange}
        mods={{
          selected: isSelected,
          disabled: isDisabled,
          unavailable: isUnavailable,
        }}
      >
        {formattedDate}
      </CalendarButtonElement>
    </CalendarCellElement>
  );
}
