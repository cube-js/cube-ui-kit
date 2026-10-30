import { CalendarDate } from '@internationalized/date';

import { renderWithRoot, userEvent, waitFor, within } from '../../../test';

import { DateRangePicker } from './DateRangePicker';

vi.mock('../../../_internal/hooks/use-warn');

const RANGE = {
  start: new CalendarDate(2025, 6, 10),
  end: new CalendarDate(2025, 6, 20),
};

describe('<DateRangePicker hideTrigger />', () => {
  const user = userEvent.setup({ delay: null });

  const renderPicker = (props: Record<string, unknown> = {}) => {
    const result = renderWithRoot(
      <>
        <button>Before</button>
        <DateRangePicker
          hideTrigger
          aria-label="Range"
          qa="Range"
          defaultValue={RANGE}
          {...props}
        />
        <button>After</button>
      </>,
    );
    const field = result.getByTestId('Range');
    const segments = within(field).getAllByRole('spinbutton');
    const calendar = () =>
      result.baseElement.querySelector<HTMLElement>(
        '[data-qa="CalendarPopover"]',
      );

    return { ...result, field, segments, calendar };
  };

  const expectOpen = (calendar: () => HTMLElement | null) =>
    waitFor(() => expect(calendar()).toBeTruthy());

  const expectClosed = (calendar: () => HTMLElement | null) =>
    waitFor(() => expect(calendar()).toBeNull());

  it('renders no calendar button, and each date names the key that opens the calendar', () => {
    const { field, segments, getByText } = renderPicker();

    expect(within(field).queryByRole('button')).toBeNull();

    const hint = getByText('Press Alt+Down Arrow to open the calendar.');

    // React Aria describes a date by its first segment.
    for (const date of ['DateRangeStart', 'DateRangeEnd']) {
      const [first] = within(within(field).getByTestId(date)).getAllByRole(
        'spinbutton',
      );

      expect(first.getAttribute('aria-describedby')).toContain(hint.id);
    }

    expect(segments).toHaveLength(6);
  });

  it('opens from a press in the field and keeps focus there', async () => {
    const { segments, calendar } = renderPicker();

    await user.click(segments[1]);
    await expectOpen(calendar);

    expect(document.activeElement).toBe(segments[1]);
    // With no button to name it, the field does.
    expect(calendar()).toHaveAccessibleName('Range');
  });

  it('opens from an edit and keeps the typing in the field', async () => {
    const { segments, calendar } = renderPicker({ defaultValue: undefined });

    await user.tab();
    await user.tab();

    expect(document.activeElement).toBe(segments[0]);
    expect(calendar()).toBeNull();

    await user.keyboard('2');
    await expectOpen(calendar);

    expect(document.activeElement).toBe(segments[0]);
    expect(segments[0]).toHaveTextContent('2');
  });

  it('does not open when focus tabs into the field', async () => {
    const { segments, calendar } = renderPicker();

    await user.tab();
    await user.tab();

    expect(document.activeElement).toBe(segments[0]);
    expect(calendar()).toBeNull();
  });

  it('opens with Alt+Down and moves focus into the calendar', async () => {
    const { segments, calendar } = renderPicker();

    await user.click(segments[0]);
    await expectOpen(calendar);
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');

    await waitFor(() =>
      expect(calendar()?.contains(document.activeElement)).toBe(true),
    );
  });

  it('closes on Escape and keeps focus in the field', async () => {
    const { segments, calendar } = renderPicker();

    await user.click(segments[2]);
    await expectOpen(calendar);
    await user.keyboard('{Escape}');
    await expectClosed(calendar);

    expect(document.activeElement).toBe(segments[2]);
  });

  it('closes on Escape in the calendar and returns focus to the field', async () => {
    const { segments, calendar } = renderPicker();

    await user.click(segments[2]);
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await waitFor(() =>
      expect(calendar()?.contains(document.activeElement)).toBe(true),
    );
    await user.keyboard('{Escape}');
    await expectClosed(calendar);

    expect(document.activeElement).toBe(segments[2]);
  });

  it('closes when the range is picked and returns focus to the field', async () => {
    const onChange = vi.fn();
    const { segments, calendar } = renderPicker({ onChange });

    await user.click(segments[0]);
    await expectOpen(calendar);

    const grid = within(calendar()!).getByRole('grid');

    await user.click(within(grid).getByText('12'));
    await user.click(within(grid).getByText('15'));
    await expectClosed(calendar);

    expect(onChange).toHaveBeenLastCalledWith({
      start: new CalendarDate(2025, 6, 12),
      end: new CalendarDate(2025, 6, 15),
    });
    expect(segments).toContain(document.activeElement);
  });

  it('closes when focus tabs out of the field, which reports its blur', async () => {
    const onBlur = vi.fn();
    const { segments, calendar, getByText } = renderPicker({ onBlur });

    await user.click(segments[segments.length - 1]);
    await expectOpen(calendar);
    await user.tab();
    await expectClosed(calendar);

    expect(document.activeElement).toBe(getByText('After'));
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('returns focus to the field when Tab leaves the calendar', async () => {
    const { segments, calendar } = renderPicker();

    await user.click(segments[0]);
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await waitFor(() =>
      expect(calendar()?.contains(document.activeElement)).toBe(true),
    );

    // The focused day is the calendar's last tab stop.
    await user.tab();
    await expectClosed(calendar);

    expect(document.activeElement).toBe(segments[0]);
  });

  it('turns the open calendar to a typed date', async () => {
    const { segments, calendar } = renderPicker();
    const [startMonth] = segments.filter((segment) =>
      segment.getAttribute('aria-label')?.startsWith('month, Start'),
    );

    await user.click(startMonth);
    await expectOpen(calendar);

    expect(calendar()).toHaveTextContent(/June\s*2025/);

    // One Backspace clears the month.
    await user.keyboard('{Backspace}3');

    await waitFor(() => expect(calendar()).toHaveTextContent(/March\s*2025/));
    // The month is complete, so typing moved on to the next segment.
    expect(document.activeElement).toBe(
      segments[segments.indexOf(startMonth) + 1],
    );
  });

  it.each([['isDisabled'], ['isReadOnly']])(
    'does not open when %s',
    async (prop) => {
      const { field, calendar } = renderPicker({ [prop]: true });

      await user.click(field);
      await user.keyboard('{Alt>}{ArrowDown}{/Alt}');

      expect(calendar()).toBeNull();
    },
  );

  it('keeps the calendar button without hideTrigger', () => {
    const { field } = renderPicker({ hideTrigger: false });

    expect(within(field).getByRole('button')).toBeInTheDocument();
  });
});
