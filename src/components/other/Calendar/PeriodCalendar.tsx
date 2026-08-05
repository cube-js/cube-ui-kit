import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { tasty } from '@tenphi/tasty';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DateValue, useDateFormatter, useLocale } from 'react-aria';

import { LeftIcon, RightIcon } from '../../../icons';
import { useProviderProps } from '../../../provider';
import { Button } from '../../actions';
import { Title } from '../../content/Title';
import {
  getQuarter,
  PickerType,
  snapToPeriod,
} from '../../fields/DatePicker/period';
import { Space } from '../../layout/Space';

const PeriodCalendarElement = tasty({
  styles: {
    padding: '1x',
    gap: '1x',
    width: 'min 30x',
  },
});

const PeriodHeaderElement = tasty({
  styles: {
    display: 'flex',
    placeContent: 'center space-between',
    placeItems: 'center',
    gap: '1.5x',
  },
});

const PeriodGridElement = tasty({
  styles: {
    display: 'grid',
    gap: '1bw',
    padding: '.5x top',
  },
});

const PeriodCellElement = tasty({
  as: 'button',
  'data-popover-keep': true,
  styles: {
    preset: 't3m',
    display: 'grid',
    placeItems: 'center',
    height: '5x',
    padding: '1x',
    border: 0,
    fill: {
      '': '#primary.0',
      ':hover': '#primary.16',
      pressed: '#primary.10',

      selected: '#primary',
      'selected & :hover': '#primary',

      disabled: '#primary.0',
    },
    color: {
      '': '#dark',
      outside: '#dark.30',
      selected: '#white',
      disabled: '#dark.30',
    },
    outline: {
      '': '1bw #primary-text.0',
      focused: '1bw #primary-text',
    },
    outlineOffset: 0.5,
    radius: true,
    cursor: {
      '': 'pointer',
      disabled: 'not-allowed',
    },
  },
});

// picker → grid columns
const COLUMNS: Record<'month' | 'quarter' | 'year', number> = {
  month: 3,
  quarter: 4,
  year: 3,
};

export interface CubePeriodCalendarProps {
  /** Which non-day period this panel selects. */
  picker: 'month' | 'quarter' | 'year';
  value?: DateValue | null;
  onChange?: (date: CalendarDate) => void;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  isDateUnavailable?: (date: DateValue) => boolean;
  isDisabled?: boolean;
  autoFocus?: boolean;
}

interface Cell {
  key: string;
  label: string;
  date: CalendarDate;
  isSelected: boolean;
  isDisabled: boolean;
  isOutside: boolean;
}

export function PeriodCalendar(props: CubePeriodCalendarProps) {
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

  let { locale } = useLocale();
  let monthFormatter = useDateFormatter({ month: 'short', timeZone: 'UTC' });

  let selected = value ?? null;
  let selectedYear = selected?.year ?? null;
  let selectedMonth = selected?.month ?? null;

  let [focusedYear, setFocusedYear] = useState(
    () => selectedYear ?? today(getLocalTimeZone()).year,
  );

  let cols = COLUMNS[picker];
  let step = picker === 'year' ? 10 : 1;
  let decadeStart = Math.floor(focusedYear / 10) * 10;

  let isPeriodDisabled = (date: CalendarDate) => {
    if (isDisabled) return true;
    if (minValue && date.compare(snapToPeriod(minValue, picker, locale)) < 0) {
      return true;
    }
    if (maxValue && date.compare(snapToPeriod(maxValue, picker, locale)) > 0) {
      return true;
    }

    return isDateUnavailable?.(date) ?? false;
  };

  let cells = useMemo<Cell[]>(() => {
    if (picker === 'month') {
      return Array.from({ length: 12 }, (_, m) => {
        let date = new CalendarDate(focusedYear, m + 1, 1);

        return {
          key: `m-${m}`,
          label: monthFormatter.format(new Date(Date.UTC(2021, m, 15))),
          date,
          isSelected: selectedYear === focusedYear && selectedMonth === m + 1,
          isDisabled: isPeriodDisabled(date),
          isOutside: false,
        };
      });
    }

    if (picker === 'quarter') {
      return Array.from({ length: 4 }, (_, q) => {
        let date = new CalendarDate(focusedYear, q * 3 + 1, 1);

        return {
          key: `q-${q}`,
          label: `Q${q + 1}`,
          date,
          isSelected:
            selectedYear === focusedYear &&
            selectedMonth != null &&
            getQuarter(selectedMonth) === q + 1,
          isDisabled: isPeriodDisabled(date),
          isOutside: false,
        };
      });
    }

    // year: render 12 cells — one leading + a decade + one trailing.
    return Array.from({ length: 12 }, (_, i) => {
      let year = decadeStart - 1 + i;
      let date = new CalendarDate(year, 1, 1);

      return {
        key: `y-${year}`,
        label: String(year),
        date,
        isSelected: selectedYear === year,
        isDisabled: isPeriodDisabled(date),
        isOutside: year < decadeStart || year > decadeStart + 9,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    picker,
    focusedYear,
    decadeStart,
    selectedYear,
    selectedMonth,
    monthFormatter,
    locale,
    minValue,
    maxValue,
    isDateUnavailable,
    isDisabled,
  ]);

  let title =
    picker === 'year'
      ? `${decadeStart}-${decadeStart + 9}`
      : String(focusedYear);

  let cellRefs = useRef<Array<HTMLButtonElement | null>>([]);
  let [focusedIndex, setFocusedIndex] = useState(() => {
    let idx = cells.findIndex((cell) => cell.isSelected);

    return idx >= 0 ? idx : 0;
  });

  useEffect(() => {
    if (autoFocus) {
      cellRefs.current[focusedIndex]?.focus();
    }
    // Focus only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let moveFocus = (index: number) => {
    let clamped = Math.max(0, Math.min(cells.length - 1, index));
    setFocusedIndex(clamped);
    cellRefs.current[clamped]?.focus();
  };

  let onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        moveFocus(focusedIndex + 1);
        break;
      case 'ArrowLeft':
        moveFocus(focusedIndex - 1);
        break;
      case 'ArrowDown':
        moveFocus(focusedIndex + cols);
        break;
      case 'ArrowUp':
        moveFocus(focusedIndex - cols);
        break;
      case 'Home':
        moveFocus(0);
        break;
      case 'End':
        moveFocus(cells.length - 1);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  return (
    <PeriodCalendarElement>
      <PeriodHeaderElement>
        <Title level={6} preset="h6">
          {title}
        </Title>
        <Space gap=".5x">
          <Button
            data-popover-keep
            size="xsmall"
            aria-label="Previous"
            icon={<LeftIcon />}
            isDisabled={isDisabled}
            onPress={() => setFocusedYear((year) => year - step)}
          />
          <Button
            data-popover-keep
            size="xsmall"
            aria-label="Next"
            icon={<RightIcon />}
            isDisabled={isDisabled}
            onPress={() => setFocusedYear((year) => year + step)}
          />
        </Space>
      </PeriodHeaderElement>
      <PeriodGridElement
        role="grid"
        styles={{ gridColumns: `repeat(${cols}, 1fr)` }}
        onKeyDown={onKeyDown}
      >
        {cells.map((cell, i) => (
          <PeriodCellElement
            key={cell.key}
            ref={(el: HTMLButtonElement | null) => {
              cellRefs.current[i] = el;
            }}
            type="button"
            tabIndex={i === focusedIndex ? 0 : -1}
            disabled={cell.isDisabled}
            aria-pressed={cell.isSelected}
            mods={{
              selected: cell.isSelected,
              outside: cell.isOutside,
              disabled: cell.isDisabled,
            }}
            onFocus={() => setFocusedIndex(i)}
            onClick={() => {
              if (!cell.isDisabled) onChange?.(cell.date);
            }}
          >
            {cell.label}
          </PeriodCellElement>
        ))}
      </PeriodGridElement>
    </PeriodCalendarElement>
  );
}
