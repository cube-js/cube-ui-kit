import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useRangeCalendar } from '@react-aria/calendar';
import { useRangeCalendarState } from '@react-stately/calendar';
import { createCalendar } from '@internationalized/date';
import { useLocale } from '@react-aria/i18n';
import { AriaRangeCalendarProps, DateValue } from '@react-types/calendar';
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
    placeContent: 'end',
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
        <Button.Group gap=".5x">
          <Button size="small" {...prevButtonProps} icon={<LeftOutlined />} />
          <Button size="small" {...nextButtonProps} icon={<RightOutlined />} />
        </Button.Group>
      </CalendarHeaderElement>
      <CalendarGrid state={state} />
    </CalendarElement>
  );
}

const _RangeCalendar = forwardRef(RangeCalendar);
export { _RangeCalendar as RangeCalendar };

export type { AriaRangeCalendarProps as CubeRangeCalendarProps };
