import {
  CalendarDate,
  endOfMonth,
  endOfYear,
  isSameMonth,
  startOfMonth,
  startOfYear,
  toCalendar,
  today,
} from '@internationalized/date';
import { KeyboardEvent, ReactElement, Ref, useMemo, useState } from 'react';
import { DateValue, useDateFormatter } from 'react-aria';
import { CalendarState, RangeCalendarState } from 'react-stately';

import { useI18n } from '../../../i18n';
import { mergeProps } from '../../../utils/react';

import { CalendarGrid } from './CalendarGrid';
import { CalendarHeader } from './CalendarHeader';
import { CubePeriodGridCell, PeriodGrid } from './PeriodGrid';
import { CalendarElement } from './styled';

import type { Props } from '../../../props';

/** Which panel the calendar currently shows. */
export type CubeCalendarView = 'day' | 'month' | 'year';

/** The year grid shows a decade plus one adjacent year on either side. */
const YEAR_CELLS = 12;
const MONTH_COLUMNS = 3;
const YEAR_COLUMNS = 3;

/**
 * Exactly as wide as seven day cells (`3x` cell + a `2bw` gutter), so switching
 * between the day, month and year panels keeps the popover roughly in place.
 */
const PERIOD_GRID_STYLES = { width: '(7 * (3x + 2bw))' } as const;

interface Formatter {
  format(date: Date): string;
}

export interface CubeCalendarPanelProps {
  state: CalendarState | RangeCalendarState;
  /** The visible range title provided by React Aria. */
  title: string;
  calendarProps: Props;
  prevButtonProps: Props;
  nextButtonProps: Props;
  /**
   * Whether the header lets the user jump straight to a month or a year.
   * @default true
   */
  hasMonthYearNavigation?: boolean;
  selectedRange?: { start: DateValue; end: DateValue };
  pickerMode?: 'day' | 'week';
  elementRef?: Ref<HTMLElement>;
}

/**
 * The body shared by `Calendar` and `RangeCalendar`: a header plus one of three
 * panels. The month and year panels only *navigate* — they move the focused
 * date and never select a value, so a range selection in progress survives a
 * jump to another month.
 */
export function CalendarPanel(props: CubeCalendarPanelProps) {
  const { t } = useI18n();

  let {
    state,
    title,
    calendarProps,
    prevButtonProps,
    nextButtonProps,
    hasMonthYearNavigation = true,
    selectedRange,
    pickerMode,
    elementRef,
  } = props;

  let [view, setView] = useState<CubeCalendarView>('day');
  // The period the month / year panels navigate around. Seeded from the
  // focused date every time the user leaves the day panel.
  let [anchor, setAnchor] = useState<CalendarDate>(state.focusedDate);

  let visibleStart = state.visibleRange.start;
  let calendar = visibleStart.calendar;
  let timeZone = state.timeZone;
  let calendarId = calendar.identifier;

  let monthFormatter = useDateFormatter({
    month: 'long',
    timeZone,
    calendar: calendarId,
  });
  let shortMonthFormatter = useDateFormatter({
    month: 'short',
    timeZone,
    calendar: calendarId,
  });
  let yearFormatter = useDateFormatter({
    year: 'numeric',
    timeZone,
    calendar: calendarId,
  });

  let todayDate = useMemo(
    () => toCalendar(today(timeZone), calendar),
    [timeZone, calendar],
  );

  let format = (formatter: Formatter, date: CalendarDate) =>
    formatter.format(date.toDate(timeZone));

  /** Whether a whole period lies outside the calendar's allowed range. */
  let isPeriodDisabled = (start: CalendarDate, end: CalendarDate) =>
    state.isDisabled ||
    (state.minValue != null && end.compare(state.minValue) < 0) ||
    (state.maxValue != null && start.compare(state.maxValue) > 0);

  // A multi-month view has no single month or year to drill into.
  let hasNavigation =
    hasMonthYearNavigation && isSameMonth(visibleStart, state.visibleRange.end);

  let openView = (next: CubeCalendarView) => {
    setAnchor(state.focusedDate);
    setView(next);
  };

  let onKeyDown = (e: KeyboardEvent) => {
    // Step back to the day panel rather than closing the surrounding popover.
    if (view !== 'day' && e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setView('day');
      // The grid the user was in is about to unmount. Claim focus for the day
      // cell, or it falls out of the popover and the next `Escape` is lost.
      state.setFocused(true);
    }
  };

  let header: ReactElement;
  let body: ReactElement;

  if (view === 'month') {
    let monthDate = (month: number) => startOfMonth(anchor.set({ month }));
    let monthCount = calendar.getMonthsInYear(anchor);

    let cells: CubePeriodGridCell[] = Array.from(
      { length: monthCount },
      (_, index) => {
        let date = monthDate(index + 1);

        return {
          key: `month-${index + 1}`,
          label: format(shortMonthFormatter, date),
          isSelected: isSameMonth(date, visibleStart),
          isCurrent: isSameMonth(date, todayDate),
          isDisabled: isPeriodDisabled(date, endOfMonth(date)),
        };
      },
    );

    let prevYear = anchor.subtract({ years: 1 });
    let nextYear = anchor.add({ years: 1 });

    header = (
      <CalendarHeader
        segments={[
          {
            key: 'year',
            label: format(yearFormatter, anchor),
            isDisabled: state.isDisabled,
            onPress: () => setView('year'),
          },
        ]}
        prevButtonProps={{
          'aria-label': t('calendar.previousYear', 'Previous year'),
          isDisabled: isPeriodDisabled(
            startOfYear(prevYear),
            endOfYear(prevYear),
          ),
          onPress: () => setAnchor(prevYear),
        }}
        nextButtonProps={{
          'aria-label': t('calendar.nextYear', 'Next year'),
          isDisabled: isPeriodDisabled(
            startOfYear(nextYear),
            endOfYear(nextYear),
          ),
          onPress: () => setAnchor(nextYear),
        }}
      />
    );

    body = (
      <PeriodGrid
        // Remount per view so focus follows the user into the new grid.
        key="month"
        autoFocus
        aria-label={t('calendar.months', 'Months')}
        cells={cells}
        styles={PERIOD_GRID_STYLES}
        columns={MONTH_COLUMNS}
        focusedIndex={anchor.month - 1}
        onCellPress={(index) => {
          state.setFocusedDate(anchor.set({ month: index + 1 }));
          setView('day');
        }}
        onCellFocus={(index) => setAnchor(anchor.set({ month: index + 1 }))}
        onMoveFocus={(delta) => setAnchor(anchor.add({ months: delta }))}
        onMovePage={(delta) => setAnchor(anchor.add({ years: delta }))}
      />
    );
  } else if (view === 'year') {
    let yearDate = (year: number) => startOfYear(anchor.set({ year }));
    let decadeStart = Math.floor(anchor.year / 10) * 10;
    let firstYear = decadeStart - 1;

    let cells: CubePeriodGridCell[] = Array.from(
      { length: YEAR_CELLS },
      (_, index) => {
        let year = firstYear + index;
        let date = yearDate(year);

        return {
          key: `year-${year}`,
          label: format(yearFormatter, date),
          isSelected: year === visibleStart.year,
          isCurrent: year === todayDate.year,
          isOutside: year < decadeStart || year > decadeStart + 9,
          isDisabled: isPeriodDisabled(date, endOfYear(date)),
        };
      },
    );

    header = (
      <CalendarHeader
        title={`${format(yearFormatter, yearDate(decadeStart))} – ${format(
          yearFormatter,
          yearDate(decadeStart + 9),
        )}`}
        prevButtonProps={{
          'aria-label': t('calendar.previousYears', 'Previous years'),
          isDisabled: isPeriodDisabled(
            yearDate(decadeStart - 10),
            endOfYear(yearDate(decadeStart - 1)),
          ),
          onPress: () => setAnchor(anchor.subtract({ years: 10 })),
        }}
        nextButtonProps={{
          'aria-label': t('calendar.nextYears', 'Next years'),
          isDisabled: isPeriodDisabled(
            yearDate(decadeStart + 10),
            endOfYear(yearDate(decadeStart + 19)),
          ),
          onPress: () => setAnchor(anchor.add({ years: 10 })),
        }}
      />
    );

    body = (
      <PeriodGrid
        key="year"
        autoFocus
        aria-label={t('calendar.years', 'Years')}
        cells={cells}
        styles={PERIOD_GRID_STYLES}
        columns={YEAR_COLUMNS}
        focusedIndex={anchor.year - firstYear}
        onCellPress={(index) => {
          setAnchor(anchor.set({ year: firstYear + index }));
          setView('month');
        }}
        onCellFocus={(index) =>
          setAnchor(anchor.set({ year: firstYear + index }))
        }
        onMoveFocus={(delta) => setAnchor(anchor.add({ years: delta }))}
        onMovePage={(delta) => setAnchor(anchor.add({ years: delta * 10 }))}
      />
    );
  } else {
    header = (
      <CalendarHeader
        title={title}
        segments={
          hasNavigation
            ? [
                {
                  key: 'month',
                  label: format(monthFormatter, visibleStart),
                  isDisabled: state.isDisabled,
                  onPress: () => openView('month'),
                },
                {
                  key: 'year',
                  label: format(yearFormatter, visibleStart),
                  isDisabled: state.isDisabled,
                  onPress: () => openView('year'),
                },
              ]
            : undefined
        }
        prevButtonProps={prevButtonProps}
        nextButtonProps={nextButtonProps}
      />
    );

    body = (
      <CalendarGrid
        state={state}
        selectedRange={selectedRange}
        pickerMode={pickerMode}
      />
    );
  }

  return (
    <CalendarElement
      ref={elementRef}
      {...mergeProps(calendarProps, { onKeyDown })}
    >
      {header}
      {body}
    </CalendarElement>
  );
}
