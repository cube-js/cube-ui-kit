import {
  CalendarDate,
  endOfMonth,
  endOfYear,
  getLocalTimeZone,
  toCalendarDate,
  today,
} from '@internationalized/date';
import { KeyboardEvent, ReactElement, useMemo, useState } from 'react';
import { DateValue, useDateFormatter } from 'react-aria';

import { useI18n } from '../../../i18n';
import { useProviderProps } from '../../../provider';
import { getQuarter } from '../../fields/DatePicker/period';

import { CalendarHeader } from './CalendarHeader';
import { CubePeriodGridCell, PeriodGrid } from './PeriodGrid';
import { CalendarElement } from './styled';

/** The year grid shows a decade plus one adjacent year on either side. */
const YEAR_CELLS = 12;

/** Explicit so the panel keeps one width across all three period views. */
const PERIOD_GRID_STYLES = { width: '28x' } as const;

export type CubePeriodCalendarPicker = 'month' | 'quarter' | 'year';

/** picker → grid columns */
const COLUMNS: Record<CubePeriodCalendarPicker, number> = {
  month: 3,
  quarter: 4,
  year: 3,
};

export interface CubePeriodCalendarProps {
  /** Which non-day period this panel selects. */
  picker: CubePeriodCalendarPicker;
  value?: DateValue | null;
  onChange?: (date: CalendarDate) => void;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  isDateUnavailable?: (date: DateValue) => boolean;
  isDisabled?: boolean;
  autoFocus?: boolean;
}

/**
 * The panel behind `MonthPicker`, `QuarterPicker` and `YearPicker`. The month
 * and quarter panels drill up into a year list, so reaching a distant year
 * never means clicking the arrow a dozen times.
 */
export function PeriodCalendar(props: CubePeriodCalendarProps) {
  const { t } = useI18n();

  props = useProviderProps(props);

  let {
    picker,
    value,
    onChange,
    minValue,
    maxValue,
    isDateUnavailable,
    isDisabled,
    autoFocus,
  } = props;

  let monthFormatter = useDateFormatter({ month: 'short', timeZone: 'UTC' });

  let selected = value ? toCalendarDate(value) : null;
  let todayDate = useMemo(() => today(getLocalTimeZone()), []);

  // A date inside the period the keyboard currently focuses. Drives both the
  // roving tab stop and which year / decade the panel shows.
  let [anchor, setAnchor] = useState<CalendarDate>(() => selected ?? todayDate);
  let [isYearView, setIsYearView] = useState(false);
  // Switching panels always moves focus into the new grid — the button the
  // user just pressed is gone by then.
  let [autoFocusGrid, setAutoFocusGrid] = useState(!!autoFocus);

  let showYearView = (next: boolean) => {
    setAutoFocusGrid(true);
    setIsYearView(next);
  };

  let view: CubePeriodCalendarPicker =
    picker === 'year' || isYearView ? 'year' : picker;

  let yearStart = (year: number) => new CalendarDate(year, 1, 1);

  let isPeriodDisabled = (start: CalendarDate, end: CalendarDate) => {
    if (isDisabled) return true;
    if (minValue && end.compare(minValue) < 0) return true;
    if (maxValue && start.compare(maxValue) > 0) return true;

    return isDateUnavailable?.(start) ?? false;
  };

  /** Header for the month and quarter panels — the year drills up to a list. */
  let renderYearHeader = () => {
    let prevYear = anchor.year - 1;
    let nextYear = anchor.year + 1;

    return (
      <CalendarHeader
        segments={[
          {
            key: 'year',
            label: String(anchor.year),
            isDisabled,
            onPress: () => showYearView(true),
          },
        ]}
        prevButtonProps={{
          'aria-label': t('calendar.previousYear', 'Previous year'),
          isDisabled: isPeriodDisabled(
            yearStart(prevYear),
            endOfYear(yearStart(prevYear)),
          ),
          onPress: () => setAnchor(anchor.subtract({ years: 1 })),
        }}
        nextButtonProps={{
          'aria-label': t('calendar.nextYear', 'Next year'),
          isDisabled: isPeriodDisabled(
            yearStart(nextYear),
            endOfYear(yearStart(nextYear)),
          ),
          onPress: () => setAnchor(anchor.add({ years: 1 })),
        }}
      />
    );
  };

  let onKeyDown = (e: KeyboardEvent) => {
    // The year list is a detour, so `Escape` returns to the period list rather
    // than closing the surrounding popover.
    if (isYearView && picker !== 'year' && e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      showYearView(false);
    }
  };

  let cells: CubePeriodGridCell[];
  let focusedIndex: number;
  let gridLabel: string;
  let header: ReactElement;
  let onCellPress: (index: number) => void;
  let onCellFocus: (index: number) => void;
  let onMoveFocus: (delta: number) => void;
  let onMovePage: (delta: -1 | 1) => void;

  if (view === 'year') {
    let decadeStart = Math.floor(anchor.year / 10) * 10;
    let firstYear = decadeStart - 1;

    cells = Array.from({ length: YEAR_CELLS }, (_, index) => {
      let year = firstYear + index;
      let date = yearStart(year);

      return {
        key: `year-${year}`,
        label: String(year),
        isSelected: selected?.year === year,
        isCurrent: todayDate.year === year,
        isOutside: year < decadeStart || year > decadeStart + 9,
        isDisabled: isPeriodDisabled(date, endOfYear(date)),
      };
    });

    focusedIndex = anchor.year - firstYear;
    gridLabel = t('calendar.years', 'Years');

    header = (
      <CalendarHeader
        title={`${decadeStart} – ${decadeStart + 9}`}
        prevButtonProps={{
          'aria-label': t('calendar.previousYears', 'Previous years'),
          isDisabled: isPeriodDisabled(
            yearStart(decadeStart - 10),
            endOfYear(yearStart(decadeStart - 1)),
          ),
          onPress: () => setAnchor(anchor.subtract({ years: 10 })),
        }}
        nextButtonProps={{
          'aria-label': t('calendar.nextYears', 'Next years'),
          isDisabled: isPeriodDisabled(
            yearStart(decadeStart + 10),
            endOfYear(yearStart(decadeStart + 19)),
          ),
          onPress: () => setAnchor(anchor.add({ years: 10 })),
        }}
      />
    );

    onCellPress = (index) => {
      let year = firstYear + index;

      if (picker === 'year') {
        onChange?.(yearStart(year));
      } else {
        setAnchor(anchor.set({ year }));
        showYearView(false);
      }
    };
    onCellFocus = (index) => setAnchor(anchor.set({ year: firstYear + index }));
    onMoveFocus = (delta) => setAnchor(anchor.add({ years: delta }));
    onMovePage = (delta) => setAnchor(anchor.add({ years: delta * 10 }));
  } else if (view === 'quarter') {
    let quarterDate = (quarter: number) =>
      new CalendarDate(anchor.year, (quarter - 1) * 3 + 1, 1);

    cells = Array.from({ length: 4 }, (_, index) => {
      let quarter = index + 1;
      let date = quarterDate(quarter);

      return {
        key: `quarter-${quarter}`,
        label: `Q${quarter}`,
        isSelected:
          selected != null &&
          selected.year === anchor.year &&
          getQuarter(selected.month) === quarter,
        isCurrent:
          todayDate.year === anchor.year &&
          getQuarter(todayDate.month) === quarter,
        isDisabled: isPeriodDisabled(date, endOfMonth(date.add({ months: 2 }))),
      };
    });

    focusedIndex = getQuarter(anchor.month) - 1;
    gridLabel = t('calendar.quarters', 'Quarters');
    header = renderYearHeader();

    onCellPress = (index) => onChange?.(quarterDate(index + 1));
    onCellFocus = (index) => setAnchor(quarterDate(index + 1));
    onMoveFocus = (delta) => setAnchor(anchor.add({ months: delta * 3 }));
    onMovePage = (delta) => setAnchor(anchor.add({ years: delta }));
  } else {
    let monthDate = (month: number) => new CalendarDate(anchor.year, month, 1);

    cells = Array.from({ length: 12 }, (_, index) => {
      let month = index + 1;
      let date = monthDate(month);

      return {
        key: `month-${month}`,
        label: monthFormatter.format(date.toDate('UTC')),
        isSelected:
          selected != null &&
          selected.year === anchor.year &&
          selected.month === month,
        isCurrent: todayDate.year === anchor.year && todayDate.month === month,
        isDisabled: isPeriodDisabled(date, endOfMonth(date)),
      };
    });

    focusedIndex = anchor.month - 1;
    gridLabel = t('calendar.months', 'Months');
    header = renderYearHeader();

    onCellPress = (index) => onChange?.(monthDate(index + 1));
    onCellFocus = (index) => setAnchor(monthDate(index + 1));
    onMoveFocus = (delta) => setAnchor(anchor.add({ months: delta }));
    onMovePage = (delta) => setAnchor(anchor.add({ years: delta }));
  }

  return (
    <CalendarElement onKeyDown={onKeyDown}>
      {header}
      <PeriodGrid
        // Remount per view so focus follows the user into the new grid.
        key={view}
        autoFocus={autoFocusGrid}
        aria-label={gridLabel}
        cells={cells}
        styles={PERIOD_GRID_STYLES}
        columns={COLUMNS[view]}
        focusedIndex={focusedIndex}
        onCellPress={onCellPress}
        onCellFocus={onCellFocus}
        onMoveFocus={onMoveFocus}
        onMovePage={onMovePage}
      />
    </CalendarElement>
  );
}
