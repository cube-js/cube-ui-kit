import { CalendarDate, CalendarDateTime } from '@internationalized/date';

import { renderWithRoot, userEvent, waitFor, within } from '../../../test';

import { DateRangeSeparatedPicker } from './DateRangeSeparatedPicker';

vi.mock('../../../_internal/hooks/use-warn');

describe('<DateRangeSeparatedPicker />', () => {
  const user = userEvent.setup({ delay: null });

  const openCalendar = async (baseElement: HTMLElement, index: number) => {
    await user.click(
      baseElement.querySelectorAll('[data-popover-trigger]')[
        index
      ] as HTMLElement,
    );
    return waitFor(() => {
      const dialog = baseElement.querySelector('[data-qa="Dialog"]');
      expect(dialog).toBeTruthy();
      return dialog as HTMLElement;
    });
  };

  it('renders both endpoints from an uncontrolled default range', async () => {
    const { baseElement, getAllByRole } = renderWithRoot(
      <DateRangeSeparatedPicker
        aria-label="Range"
        defaultValue={{
          start: new CalendarDate(2025, 6, 10),
          end: new CalendarDate(2025, 7, 20),
        }}
      />,
    );

    const months = getAllByRole('spinbutton', { name: /month/i });
    const days = getAllByRole('spinbutton', { name: /day/i });
    expect(months[0]).toHaveAttribute('aria-valuenow', '6');
    expect(months[1]).toHaveAttribute('aria-valuenow', '7');
    expect(days[0]).toHaveAttribute('aria-valuenow', '10');
    expect(days[1]).toHaveAttribute('aria-valuenow', '20');

    let dialog = await openCalendar(baseElement, 0);
    expect(
      within(dialog).getByRole('gridcell', { selected: true }),
    ).toHaveTextContent('10');
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeNull(),
    );
    dialog = await openCalendar(baseElement, 1);
    expect(
      within(dialog).getByRole('gridcell', { selected: true }),
    ).toHaveTextContent('20');
  });

  it.each([
    ['start', 0, '12', '34'],
    ['end', 1, '18', '45'],
  ] as const)(
    'clears the open %s time field when the controlled range is reset',
    async (_part, index, hourValue, minuteValue) => {
      const value = {
        start: new CalendarDateTime(2025, 6, 10, 12, 34),
        end: new CalendarDateTime(2025, 6, 20, 18, 45),
      };
      const { baseElement, rerender } = renderWithRoot(
        <DateRangeSeparatedPicker
          aria-label="Range"
          value={value}
          granularity="minute"
        />,
      );
      const dialog = await openCalendar(baseElement, index);
      const hour = within(dialog).getByRole('spinbutton', { name: /hour/i });
      const minute = within(dialog).getByRole('spinbutton', {
        name: /minute/i,
      });
      expect(hour).toHaveAttribute('aria-valuenow', hourValue);
      expect(minute).toHaveAttribute('aria-valuenow', minuteValue);

      rerender(
        <DateRangeSeparatedPicker
          aria-label="Range"
          value={null}
          granularity="minute"
        />,
      );

      expect(hour).toHaveAttribute('data-placeholder', 'true');
      expect(minute).toHaveAttribute('data-placeholder', 'true');
    },
  );

  it.each([
    ['start', 0, 1, 'June 10', 'June 20'],
    ['end', 1, 0, 'June 20', 'June 10'],
  ] as const)(
    'completes an empty range when the %s date is selected first',
    async (_part, firstIndex, secondIndex, firstDate, secondDate) => {
      const onChange = vi.fn();
      const { baseElement, getAllByRole } = renderWithRoot(
        <DateRangeSeparatedPicker
          aria-label="Range"
          placeholderValue={new CalendarDate(2025, 6, 1)}
          minValue={new CalendarDate(2025, 6, 1)}
          maxValue={new CalendarDate(2025, 6, 30)}
          onChange={onChange}
        />,
      );
      let dialog = await openCalendar(baseElement, firstIndex);
      await user.click(
        within(dialog).getByRole('button', { name: new RegExp(firstDate) }),
      );
      await waitFor(() =>
        expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeNull(),
      );
      expect(onChange).not.toHaveBeenCalled();

      dialog = await openCalendar(baseElement, secondIndex);
      await user.click(
        within(dialog).getByRole('button', { name: new RegExp(secondDate) }),
      );

      expect(onChange).toHaveBeenCalledTimes(1);
      const value = onChange.mock.calls[0][0];
      expect(value.start.toString()).toBe('2025-06-10');
      expect(value.end.toString()).toBe('2025-06-20');
      const days = getAllByRole('spinbutton', { name: /day/i });
      expect(days[0]).toHaveAttribute('aria-valuenow', '10');
      expect(days[1]).toHaveAttribute('aria-valuenow', '20');
    },
  );
});
