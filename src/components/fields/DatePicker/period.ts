import {
  CalendarDate,
  startOfMonth,
  startOfWeek,
  startOfYear,
  toCalendarDate,
} from '@internationalized/date';
import { DateValue } from 'react-aria';

/**
 * The period granularity a picker operates on. Unlike React Aria's `granularity`
 * (which controls the smallest *time* unit shown in a date field), this controls
 * which calendar panel is shown and which period a selected value is snapped to.
 */
export type PickerType = 'week' | 'month' | 'quarter' | 'year';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** The 1-based quarter (1–4) that a given month (1–12) belongs to. */
export function getQuarter(month: number): number {
  return Math.floor((month - 1) / 3) + 1;
}

/**
 * Snap a date to the start of the period it belongs to:
 * - `week`   → the first day of its week (locale-aware)
 * - `month`  → the 1st of its month
 * - `quarter`→ the 1st of the first month of its quarter
 * - `year`   → January 1st
 */
export function snapToPeriod(
  date: DateValue,
  picker: PickerType,
  locale: string,
): CalendarDate {
  const cd = toCalendarDate(date);

  switch (picker) {
    case 'week':
      return startOfWeek(cd, locale);
    case 'month':
      return startOfMonth(cd);
    case 'quarter': {
      const quarterStartMonth = (getQuarter(cd.month) - 1) * 3 + 1;
      return new CalendarDate(cd.year, quarterStartMonth, 1);
    }
    case 'year':
      return startOfYear(cd);
  }
}

/**
 * The locale-aware week-of-year number for a date, counted from the first week
 * of that date's calendar year (matches how the value's year is displayed).
 */
export function getWeekNumber(date: DateValue, locale: string): number {
  const cd = toCalendarDate(date);
  const weekStart = startOfWeek(cd, locale);
  const firstWeekStart = startOfWeek(startOfYear(cd), locale);
  const diffDays = Math.round(
    (weekStart.toDate('UTC').getTime() -
      firstWeekStart.toDate('UTC').getTime()) /
      MS_PER_DAY,
  );

  return Math.floor(diffDays / 7) + 1;
}

const pad2 = (value: number) => String(value).padStart(2, '0');

/**
 * Default formatting of a period value into a compact label, e.g.
 * `2026-08` (month), `2026-Q3` (quarter), `2026` (year), `2026-W33` (week).
 * Consumers can override this via the picker's `formatValue` prop.
 */
export function formatPeriod(
  date: DateValue,
  picker: PickerType,
  locale: string,
): string {
  const cd = toCalendarDate(date);

  switch (picker) {
    case 'year':
      return String(cd.year);
    case 'quarter':
      return `${cd.year}-Q${getQuarter(cd.month)}`;
    case 'month':
      return `${cd.year}-${pad2(cd.month)}`;
    case 'week':
      return `${cd.year}-W${pad2(getWeekNumber(cd, locale))}`;
  }
}
