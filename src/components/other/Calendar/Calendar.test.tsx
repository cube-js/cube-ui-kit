import { CalendarDate } from '@internationalized/date';

import { renderWithRoot, userEvent, waitFor, within } from '../../../test';

import { Calendar } from './Calendar';
import { PeriodCalendar } from './PeriodCalendar';

vi.mock('../../../_internal/hooks/use-warn');

describe('<Calendar />', () => {
  const user = userEvent.setup({ delay: null });

  const heading = (container: HTMLElement) =>
    within(container).getByRole('heading', { level: 6 });

  it('jumps to a month picked from the month panel', async () => {
    const { getByRole, container } = renderWithRoot(
      <Calendar
        aria-label="Date"
        defaultValue={new CalendarDate(2026, 8, 12)}
      />,
    );

    await user.click(getByRole('button', { name: 'August' }));

    const months = await waitFor(() => getByRole('grid', { name: 'Months' }));

    await user.click(within(months).getByRole('button', { name: 'Nov' }));

    await waitFor(() => {
      expect(
        within(heading(container)).getByRole('button', { name: 'November' }),
      ).toBeTruthy();
    });

    // Navigating must not select anything — August 12 is still the only
    // selected day, and November has none.
    expect(container.querySelectorAll('[aria-selected="true"]')).toHaveLength(
      0,
    );
  });

  it('drills year → month → day', async () => {
    const { getByRole, container } = renderWithRoot(
      <Calendar
        aria-label="Date"
        defaultValue={new CalendarDate(2026, 8, 12)}
      />,
    );

    await user.click(getByRole('button', { name: '2026' }));

    const years = await waitFor(() => getByRole('grid', { name: 'Years' }));

    expect(within(years).getByRole('button', { name: '2020' })).toBeTruthy();

    await user.click(within(years).getByRole('button', { name: '2028' }));

    const months = await waitFor(() => getByRole('grid', { name: 'Months' }));

    await user.click(within(months).getByRole('button', { name: 'Mar' }));

    await waitFor(() => {
      const title = heading(container);
      expect(within(title).getByRole('button', { name: 'March' })).toBeTruthy();
      expect(within(title).getByRole('button', { name: '2028' })).toBeTruthy();
    });
  });

  it('returns to the day panel on Escape', async () => {
    const { getByRole, queryByRole } = renderWithRoot(
      <Calendar
        aria-label="Date"
        defaultValue={new CalendarDate(2026, 8, 12)}
      />,
    );

    await user.click(getByRole('button', { name: 'August' }));
    await waitFor(() =>
      expect(getByRole('grid', { name: 'Months' })).toBeTruthy(),
    );

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(queryByRole('grid', { name: 'Months' })).toBeNull(),
    );
  });

  it('disables months and years outside the allowed range', async () => {
    const { getByRole } = renderWithRoot(
      <Calendar
        aria-label="Date"
        defaultValue={new CalendarDate(2026, 8, 12)}
        minValue={new CalendarDate(2026, 5, 1)}
        maxValue={new CalendarDate(2026, 9, 30)}
      />,
    );

    await user.click(getByRole('button', { name: 'August' }));

    const months = await waitFor(() => getByRole('grid', { name: 'Months' }));

    expect(within(months).getByRole('button', { name: 'Jan' })).toBeDisabled();
    expect(
      within(months).getByRole('button', { name: 'May' }),
    ).not.toBeDisabled();
    expect(within(months).getByRole('button', { name: 'Oct' })).toBeDisabled();
  });

  it('omits the month/year navigation when disabled', () => {
    const { queryByRole, getByRole } = renderWithRoot(
      <Calendar
        hasMonthYearNavigation={false}
        aria-label="Date"
        defaultValue={new CalendarDate(2026, 8, 12)}
      />,
    );

    expect(queryByRole('button', { name: 'August' })).toBeNull();
    expect(getByRole('heading', { level: 6 })).toHaveTextContent('August 2026');
  });

  it('moves focus across the year boundary with arrow keys', async () => {
    const { getByRole } = renderWithRoot(
      <Calendar
        aria-label="Date"
        defaultValue={new CalendarDate(2026, 8, 12)}
      />,
    );

    await user.click(getByRole('button', { name: 'August' }));
    await waitFor(() =>
      expect(document.activeElement).toBe(getByRole('button', { name: 'Aug' })),
    );

    // Aug → Nov → Feb of the next year.
    await user.keyboard('{ArrowDown}{ArrowDown}');

    await waitFor(() =>
      expect(document.activeElement).toBe(getByRole('button', { name: 'Feb' })),
    );
    expect(getByRole('grid', { name: 'Months' })).toBeTruthy();
    expect(getByRole('button', { name: '2027' })).toBeTruthy();
  });
});

describe('<PeriodCalendar />', () => {
  const user = userEvent.setup({ delay: null });

  it('picks a year from the list and returns to the month list', async () => {
    const onChange = vi.fn();
    const { getByRole } = renderWithRoot(
      <PeriodCalendar
        picker="month"
        value={new CalendarDate(2026, 8, 1)}
        onChange={onChange}
      />,
    );

    await user.click(getByRole('button', { name: '2026' }));

    const years = await waitFor(() => getByRole('grid', { name: 'Years' }));

    await user.click(within(years).getByRole('button', { name: '2023' }));

    const months = await waitFor(() => getByRole('grid', { name: 'Months' }));

    // Choosing a year only navigates.
    expect(onChange).not.toHaveBeenCalled();

    await user.click(within(months).getByRole('button', { name: 'Mar' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const value = onChange.mock.calls[0][0] as CalendarDate;
    expect(value.year).toBe(2023);
    expect(value.month).toBe(3);
    expect(value.day).toBe(1);
  });
});
