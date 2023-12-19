import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useCalendar, useLocale } from 'react-aria';
import { useCalendarState } from 'react-stately';
import { createCalendar } from '@internationalized/date';
import { AriaCalendarProps, DateValue } from '@react-types/calendar';
import { FocusableRef } from '@react-types/shared';
import { createDOMRef } from '@react-spectrum/utils';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

import { Button } from '../../actions';
import { tasty } from '../../../tasty';
import { Title } from '../../content/Title';
import { useProviderProps } from '../../../provider';

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
          <Button size="small" {...prevButtonProps} icon={<LeftOutlined />} />
          <Button size="small" {...nextButtonProps} icon={<RightOutlined />} />
        </Button.Group>
      </CalendarHeaderElement>
      <CalendarGrid state={state} selectedRange={props.selectedRange} />
    </CalendarElement>
  );
}

const _Calendar = forwardRef(Calendar);
export { _Calendar as Calendar };
