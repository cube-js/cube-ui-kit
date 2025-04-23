import { createCalendar } from '@internationalized/date';
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

import { LeftIcon, RightIcon } from '../../../icons';
import { useProviderProps } from '../../../provider';
import { tasty } from '../../../tasty';
import { Button } from '../../actions';
import { Title } from '../../content/Title';

import { CalendarGrid } from './CalendarGrid';

const CalendarElement = tasty({
  styles: {
    padding: '1x',
    gap: '1x',
  },
});

const CalendarHeaderElement = tasty({
  styles: {
    display: 'flex',
    placeContent: 'center space-between',
    placeItems: 'center',
    gap: '1.5x',
  },
});

export interface CubeCalendarProps extends AriaCalendarProps<DateValue> {
  selectedRange?: {
    start: DateValue;
    end: DateValue;
  };
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

  return (
    <CalendarElement {...calendarProps}>
      <CalendarHeaderElement>
        <Title level={6} preset="h6">
          {title}
        </Title>
        <Button.Group gap=".5x">
          <Button size="small" {...prevButtonProps} icon={<LeftIcon />} />
          <Button size="small" {...nextButtonProps} icon={<RightIcon />} />
        </Button.Group>
      </CalendarHeaderElement>
      <CalendarGrid state={state} selectedRange={props.selectedRange} />
    </CalendarElement>
  );
}

const _Calendar = forwardRef(Calendar);

_Calendar.displayName = 'Calendar';

export { _Calendar as Calendar };
