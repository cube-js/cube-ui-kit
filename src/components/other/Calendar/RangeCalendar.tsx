import { createCalendar } from '@internationalized/date';
import { createDOMRef } from '@react-spectrum/utils';
import { FocusableRef } from '@react-types/shared';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  AriaRangeCalendarProps,
  DateValue,
  useLocale,
  useRangeCalendar,
} from 'react-aria';
import { useRangeCalendarState } from 'react-stately';

import { useProviderProps } from '../../../provider';

import { CalendarPanel } from './CalendarPanel';
import { CalendarCoreProps, RangeCalendarValueProps } from './types';

export interface CubeRangeCalendarProps<T extends DateValue = DateValue>
  extends AriaRangeCalendarProps<T>,
    CalendarCoreProps,
    RangeCalendarValueProps {}

function RangeCalendar<T extends DateValue>(
  props: CubeRangeCalendarProps<T>,
  ref: FocusableRef<HTMLElement>,
) {
  props = useProviderProps(props);

  let { locale } = useLocale();
  let state = useRangeCalendarState({
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

  let { calendarProps, prevButtonProps, nextButtonProps, title } =
    useRangeCalendar(props, state, domRef);

  return (
    <CalendarPanel
      elementRef={domRef}
      state={state}
      title={title}
      calendarProps={calendarProps}
      prevButtonProps={prevButtonProps}
      nextButtonProps={nextButtonProps}
      hasMonthYearNavigation={props.hasMonthYearNavigation}
    />
  );
}

const _RangeCalendar = forwardRef(RangeCalendar);

_RangeCalendar.displayName = 'RangeCalendar';

export { _RangeCalendar as RangeCalendar };
