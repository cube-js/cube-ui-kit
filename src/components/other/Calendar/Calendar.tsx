import { useCalendar } from '@react-aria/calendar';
import { useCalendarState } from '@react-stately/calendar';
import { createCalendar } from '@internationalized/date';
import { useLocale } from '@react-aria/i18n';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

import { Button } from '../../actions';
import { tasty } from '../../../tasty';
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
    placeContent: 'end',
    placeItems: 'center',
    gap: '1.5x',
  },
});

export function Calendar(props) {
  let { locale } = useLocale();
  let state = useCalendarState({
    ...props,
    locale,
    createCalendar,
  });

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
      <CalendarGrid state={state} />
    </CalendarElement>
  );
}
