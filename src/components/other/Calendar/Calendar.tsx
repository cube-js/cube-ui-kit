import {
  createCalendar,
  startOfWeek,
  toCalendarDate,
} from '@internationalized/date';
import { createDOMRef } from '@react-spectrum/utils';
import { FocusableRef } from '@react-types/shared';
import { tasty } from '@tenphi/tasty';
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
import { Button } from '../../actions';
import { Title } from '../../content/Title';
import { Space } from '../../layout/Space';

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
    <CalendarElement {...calendarProps}>
      <CalendarHeaderElement>
        <Title level={6} preset="h6">
          {title}
        </Title>
        <Space gap=".5x">
          <Button
            data-popover-keep
            size="xsmall"
            {...prevButtonProps}
            icon={<LeftIcon />}
          />
          <Button
            data-popover-keep
            size="xsmall"
            {...nextButtonProps}
            icon={<RightIcon />}
          />
        </Space>
      </CalendarHeaderElement>
      <CalendarGrid
        state={state}
        selectedRange={selectedRange}
        pickerMode={props.pickerMode}
      />
    </CalendarElement>
  );
}

const _Calendar = forwardRef(Calendar);

_Calendar.displayName = 'Calendar';

export { _Calendar as Calendar };
