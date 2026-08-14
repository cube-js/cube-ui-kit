import {
  createCalendar,
  startOfWeek,
  toCalendarDate,
} from '@internationalized/date';
import { createDOMRef } from '@react-spectrum/utils';
import { FocusableRef } from '@react-types/shared';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  AriaCalendarProps,
  DateValue,
  useCalendar,
  useLocale,
} from 'react-aria';
import { useCalendarState } from 'react-stately';

import { useProviderProps } from '../../../provider';

import { CalendarPanel } from './CalendarPanel';
import { CalendarCoreProps, CalendarValueProps } from './types';

export interface CubeCalendarProps
  extends AriaCalendarProps<DateValue>,
    CalendarCoreProps,
    CalendarValueProps {
  /** Highlights a range that lives outside the calendar's own state. */
  selectedRange?: {
    start: DateValue;
    end: DateValue;
  };
  /**
   * When set to `week`, the grid shows a leading week-number column and
   * highlights the whole week that the selected value belongs to.
   */
  pickerMode?: 'day' | 'week';
}

function Calendar(props: CubeCalendarProps, ref: FocusableRef<HTMLElement>) {
  props = useProviderProps(props);

  let { locale } = useLocale();
  let state = useCalendarState({
    ...props,
    locale,
    createCalendar,
  });

  let domRef = useRef(null);
  useImperativeHandle(ref, () => ({
    ...createDOMRef(domRef),
    focus() {
      state.setFocused(true);
    },
  }));

  let { calendarProps, prevButtonProps, nextButtonProps, title } = useCalendar(
    props,
    state,
  );

  let selectedRange = props.selectedRange;
  if (props.pickerMode === 'week' && state.value) {
    let start = startOfWeek(toCalendarDate(state.value), locale);
    selectedRange = { start, end: start.add({ days: 6 }) };
  }

  return (
    <CalendarPanel
      elementRef={domRef}
      state={state}
      title={title}
      calendarProps={calendarProps}
      prevButtonProps={prevButtonProps}
      nextButtonProps={nextButtonProps}
      hasMonthYearNavigation={props.hasMonthYearNavigation}
      selectedRange={selectedRange}
      pickerMode={props.pickerMode}
    />
  );
}

const _Calendar = forwardRef(Calendar);

_Calendar.displayName = 'Calendar';

export { _Calendar as Calendar };
