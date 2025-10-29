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

import { LeftIcon, RightIcon } from '../../../icons';
import { useProviderProps } from '../../../provider';
import { tasty } from '../../../tasty';
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

function RangeCalendar<T extends DateValue>(
  props: AriaRangeCalendarProps<T>,
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
    <CalendarElement ref={domRef} {...calendarProps}>
      <CalendarHeaderElement>
        <Title level={6} preset="h6">
          {title}
        </Title>
        <Space gap=".5x">
          <Button size="small" {...prevButtonProps} icon={<LeftIcon />} />
          <Button size="small" {...nextButtonProps} icon={<RightIcon />} />
        </Space>
      </CalendarHeaderElement>
      <CalendarGrid state={state} />
    </CalendarElement>
  );
}

const _RangeCalendar = forwardRef(RangeCalendar);

_RangeCalendar.displayName = 'RangeCalendar';

export { _RangeCalendar as RangeCalendar };

export type { AriaRangeCalendarProps as CubeRangeCalendarProps };
