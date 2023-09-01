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
    fill: {
      '': '#purple.0',
      ':hover': '#purple.16',
      pressed: '#purple.10',

      selected: '#purple',
      'selected & :hover': '#purple-text',
      'selected & pressed': '#purple',

      'disabled | unavailable': '#purple.0',
    },
    color: {
      '': '#dark',
      selected: '#white',
      'disabled | unavailable': '#dark.30',
    },
    outline: {
      '': '0 #purple-03.0',
      focused: '@outline-width #purple-03',
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
    isPressed,
    isFocused,
    isInvalid,
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
