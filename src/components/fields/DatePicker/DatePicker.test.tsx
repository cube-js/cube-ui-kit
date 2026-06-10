import { CalendarDate } from '@internationalized/date';

import { renderWithRoot, userEvent, waitFor, within } from '../../../test';

import { DatePicker } from './DatePicker';

vi.mock('../../../_internal/hooks/use-warn');

describe('<DatePicker />', () => {
  const user = userEvent.setup({ delay: null });

  const isCalendarOpen = (baseElement: HTMLElement) =>
    !!baseElement.querySelector('[data-qa="Dialog"]');

  describe('calendar popover month navigation', () => {
    it('clicking next-month keeps the popover open (data-popover-keep regression)', async () => {
      const { baseElement } = renderWithRoot(
        <DatePicker
          label="Date"
          defaultValue={new CalendarDate(2025, 6, 15)}
        />,
      );

      // Open the calendar popover via the calendar icon trigger
      await user.click(
        baseElement.querySelector('[data-popover-trigger]') as HTMLElement,
      );

      await waitFor(() => expect(isCalendarOpen(baseElement)).toBe(true));

      const dialog = baseElement.querySelector(
        '[data-qa="Dialog"]',
      ) as HTMLElement;

      expect(
        within(dialog).getByRole('heading', { level: 6 }),
      ).toHaveTextContent('June 2025');

      // Click the "Next" month navigation button
      await user.click(within(dialog).getByRole('button', { name: /next/i }));

      // Allow the deferred setTimeout(0) dismiss to settle
      await new Promise((resolve) => setTimeout(resolve, 16));

      expect(isCalendarOpen(baseElement)).toBe(true);
      expect(
        within(dialog).getByRole('heading', { level: 6 }),
      ).toHaveTextContent('July 2025');
    });

    it('clicking prev-month keeps the popover open', async () => {
      const { baseElement } = renderWithRoot(
        <DatePicker
          label="Date"
          defaultValue={new CalendarDate(2025, 6, 15)}
        />,
      );

      await user.click(
        baseElement.querySelector('[data-popover-trigger]') as HTMLElement,
      );

      await waitFor(() => expect(isCalendarOpen(baseElement)).toBe(true));

      const dialog = baseElement.querySelector(
        '[data-qa="Dialog"]',
      ) as HTMLElement;

      await user.click(
        within(dialog).getByRole('button', { name: /previous/i }),
      );

      await new Promise((resolve) => setTimeout(resolve, 16));

      expect(isCalendarOpen(baseElement)).toBe(true);
      expect(
        within(dialog).getByRole('heading', { level: 6 }),
      ).toHaveTextContent('May 2025');
    });

    it('selecting a date closes the popover', async () => {
      const { baseElement } = renderWithRoot(
        <DatePicker
          label="Date"
          defaultValue={new CalendarDate(2025, 6, 15)}
        />,
      );

      await user.click(
        baseElement.querySelector('[data-popover-trigger]') as HTMLElement,
      );

      await waitFor(() => expect(isCalendarOpen(baseElement)).toBe(true));

      const dialog = baseElement.querySelector(
        '[data-qa="Dialog"]',
      ) as HTMLElement;

      // Click a date cell that is not the currently selected one
      await user.click(
        within(dialog).getByRole('button', { name: /June 10/i }),
      );

      await waitFor(() => expect(isCalendarOpen(baseElement)).toBe(false), {
        timeout: 1500,
      });
    });
  });
});
