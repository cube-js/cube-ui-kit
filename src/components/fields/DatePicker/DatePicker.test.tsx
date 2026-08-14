import { CalendarDate } from '@internationalized/date';

import { renderWithRoot, userEvent, waitFor, within } from '../../../test';
import { Button } from '../../actions/Button';
import { Dialog, DialogTrigger } from '../../overlays/Dialog';

import { DatePicker } from './DatePicker';

vi.mock('../../../_internal/hooks/use-warn');

describe('<DatePicker />', () => {
  const user = userEvent.setup({ delay: null });

  const isCalendarOpen = (baseElement: HTMLElement) =>
    !!baseElement.querySelector('[data-qa="Dialog"]');

  /**
   * The calendar heading is made of two buttons that open the month and year
   * pickers, so assert on those instead of the heading's raw text.
   */
  const expectVisibleMonth = (
    dialog: HTMLElement,
    month: string,
    year: string,
  ) => {
    const heading = within(dialog).getByRole('heading', { level: 6 });

    expect(within(heading).getByRole('button', { name: month })).toBeTruthy();
    expect(within(heading).getByRole('button', { name: year })).toBeTruthy();
  };

  describe('calendar popover month navigation', () => {
    it('clicking next-month inside a nested popover keeps the parent popover open', async () => {
      const { baseElement } = renderWithRoot(
        <DialogTrigger type="popover">
          <Button qa="Trigger">Open Parent</Button>
          <Dialog>
            <DatePicker
              label="Date"
              defaultValue={new CalendarDate(2025, 6, 15)}
            />
          </Dialog>
        </DialogTrigger>,
      );

      // Open parent popover
      await user.click(
        baseElement.querySelector('[data-qa="Trigger"]') as HTMLElement,
      );

      // Wait for parent popover to open
      let dialogs = await waitFor(() => {
        const d = baseElement.querySelectorAll('[data-qa="Dialog"]');
        expect(d.length).toBe(1);
        return d;
      });
      const parentDialog = dialogs[0] as HTMLElement;

      // Open the calendar popover via the calendar icon trigger
      await user.click(
        parentDialog.querySelector('[data-popover-trigger]') as HTMLElement,
      );

      // Wait for calendar to be open
      dialogs = await waitFor(() => {
        const d = baseElement.querySelectorAll('[data-qa="Dialog"]');
        expect(d.length).toBe(2);
        return d;
      });

      const calendarDialog = dialogs[1] as HTMLElement;

      // Click the "Next" month navigation button
      await user.click(
        within(calendarDialog).getByRole('button', { name: /next/i }),
      );

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 16));

      expect(baseElement.querySelectorAll('[data-qa="Dialog"]').length).toBe(2);
    });

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

      expectVisibleMonth(dialog, 'June', '2025');

      // Click the "Next" month navigation button
      await user.click(within(dialog).getByRole('button', { name: /next/i }));

      // Allow the deferred setTimeout(0) dismiss to settle
      await new Promise((resolve) => setTimeout(resolve, 16));

      expect(isCalendarOpen(baseElement)).toBe(true);
      expectVisibleMonth(dialog, 'July', '2025');
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
      expectVisibleMonth(dialog, 'May', '2025');
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
