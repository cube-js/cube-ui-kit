import { CalendarDate, parseDate } from '@internationalized/date';

import { renderWithRoot, userEvent, waitFor, within } from '../../../test';

import { MonthPicker } from './MonthPicker';
import { formatPeriod, getWeekNumber, snapToPeriod } from './period';
import { QuarterPicker } from './QuarterPicker';
import { YearPicker } from './YearPicker';

vi.mock('../../../_internal/hooks/use-warn');

const LOCALE = 'en-US';

describe('period helpers', () => {
  const date = parseDate('2026-08-12'); // Wednesday

  it('snapToPeriod snaps to the start of each period', () => {
    expect(snapToPeriod(date, 'month', LOCALE).toString()).toBe('2026-08-01');
    // Q3 (Jul–Sep) starts in July
    expect(snapToPeriod(date, 'quarter', LOCALE).toString()).toBe('2026-07-01');
    expect(snapToPeriod(date, 'year', LOCALE).toString()).toBe('2026-01-01');
    // en-US week starts on Sunday → Aug 9
    expect(snapToPeriod(date, 'week', LOCALE).toString()).toBe('2026-08-09');
  });

  it('formatPeriod renders compact period labels', () => {
    expect(formatPeriod(parseDate('2026-08-01'), 'month', LOCALE)).toBe(
      '2026-08',
    );
    expect(formatPeriod(parseDate('2026-08-01'), 'quarter', LOCALE)).toBe(
      '2026-Q3',
    );
    expect(formatPeriod(parseDate('2026-08-01'), 'year', LOCALE)).toBe('2026');
    expect(formatPeriod(parseDate('2026-08-09'), 'week', LOCALE)).toMatch(
      /^2026-W\d{2}$/,
    );
  });

  it('getWeekNumber counts weeks from the start of the year', () => {
    expect(getWeekNumber(parseDate('2026-01-01'), LOCALE)).toBe(1);
    expect(getWeekNumber(parseDate('2026-08-12'), LOCALE)).toBeGreaterThan(30);
  });
});

describe('<MonthPicker />', () => {
  const user = userEvent.setup({ delay: null });

  const openPanel = async (baseElement: HTMLElement) => {
    await user.click(
      baseElement.querySelector('[data-popover-trigger]') as HTMLElement,
    );
    return waitFor(() => {
      const dialog = baseElement.querySelector('[data-qa="Dialog"]');
      expect(dialog).toBeTruthy();
      return dialog as HTMLElement;
    });
  };

  it('selects a month snapped to the 1st and shows the label', async () => {
    const onChange = vi.fn();
    const { baseElement, getByText } = renderWithRoot(
      <MonthPicker
        aria-label="Month"
        defaultValue={new CalendarDate(2026, 5, 1)}
        onChange={onChange}
      />,
    );

    const dialog = await openPanel(baseElement);

    await user.click(within(dialog).getByRole('button', { name: 'Aug' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const value = onChange.mock.calls[0][0] as CalendarDate;
    expect(value.year).toBe(2026);
    expect(value.month).toBe(8);
    expect(value.day).toBe(1);

    // Field displays the formatted value.
    expect(getByText('2026-08')).toBeTruthy();
  });

  it('disables months outside the allowed range', async () => {
    const { baseElement } = renderWithRoot(
      <MonthPicker
        aria-label="Month"
        defaultValue={new CalendarDate(2026, 5, 1)}
        minValue={new CalendarDate(2026, 3, 1)}
        maxValue={new CalendarDate(2026, 6, 30)}
      />,
    );

    const dialog = await openPanel(baseElement);

    expect(within(dialog).getByRole('button', { name: 'Jan' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Aug' })).toBeDisabled();
    expect(
      within(dialog).getByRole('button', { name: 'Apr' }),
    ).not.toBeDisabled();
  });
});

describe('<QuarterPicker />', () => {
  const user = userEvent.setup({ delay: null });

  it('selects the first day of a quarter', async () => {
    const onChange = vi.fn();
    const { baseElement } = renderWithRoot(
      <QuarterPicker
        aria-label="Quarter"
        defaultValue={new CalendarDate(2026, 1, 1)}
        onChange={onChange}
      />,
    );

    await user.click(
      baseElement.querySelector('[data-popover-trigger]') as HTMLElement,
    );
    const dialog = await waitFor(() => {
      const d = baseElement.querySelector('[data-qa="Dialog"]');
      expect(d).toBeTruthy();
      return d as HTMLElement;
    });

    await user.click(within(dialog).getByRole('button', { name: 'Q3' }));

    const value = onChange.mock.calls[0][0] as CalendarDate;
    expect(value.year).toBe(2026);
    expect(value.month).toBe(7); // Q3 → July
    expect(value.day).toBe(1);
  });
});

describe('<YearPicker />', () => {
  const user = userEvent.setup({ delay: null });

  it('selects January 1st of the chosen year', async () => {
    const onChange = vi.fn();
    const { baseElement } = renderWithRoot(
      <YearPicker
        aria-label="Year"
        defaultValue={new CalendarDate(2026, 6, 15)}
        onChange={onChange}
      />,
    );

    await user.click(
      baseElement.querySelector('[data-popover-trigger]') as HTMLElement,
    );
    const dialog = await waitFor(() => {
      const d = baseElement.querySelector('[data-qa="Dialog"]');
      expect(d).toBeTruthy();
      return d as HTMLElement;
    });

    await user.click(within(dialog).getByRole('button', { name: '2028' }));

    const value = onChange.mock.calls[0][0] as CalendarDate;
    expect(value.year).toBe(2028);
    expect(value.month).toBe(1);
    expect(value.day).toBe(1);
  });
});
