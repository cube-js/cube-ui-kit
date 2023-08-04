import { useCalendar } from '@react-aria/calendar';
import { useCalendarState } from '@react-stately/calendar';
import { createCalendar } from '@internationalized/date';
import { useLocale } from '@react-aria/i18n';

import { Button } from '../../actions';

import { CalendarGrid } from './CalendarGrid';

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
    <div {...calendarProps} className="calendar">
      <div className="header">
        <h2>{title}</h2>
        <Button {...prevButtonProps}>&lt;</Button>
        <Button {...nextButtonProps}>&gt;</Button>
      </div>
      <CalendarGrid state={state} />
    </div>
  );
}
