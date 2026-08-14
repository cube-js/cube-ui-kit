import { Styles, tasty } from '@tenphi/tasty';

/**
 * Every calendar flavour (day, range, period) shares the same shell so the
 * popover keeps a stable size and rhythm when the user switches between the
 * day grid and the month / year panels.
 */
export const CalendarElement = tasty({
  styles: {
    display: 'grid',
    // Shrink-wrap the grid so a standalone calendar doesn't stretch its cells
    // across whatever container it lands in.
    width: 'max-content',
    padding: '1x',
    gap: '1x',
  },
});

export const CalendarHeaderElement = tasty({
  styles: {
    display: 'flex',
    placeContent: 'center space-between',
    placeItems: 'center',
    gap: '1.5x',
  },
});

/**
 * The interactive states shared by day cells and period (month / quarter /
 * year) cells. Kept in one place so a day and a month never drift apart.
 */
export const CALENDAR_CELL_STYLES: Styles = {
  preset: 't3m',
  display: 'grid',
  placeItems: 'center',
  border: 0,
  fill: {
    '': '#primary.0',
    ':hover': '#primary.16',
    rangeHover: '#primary.16',
    pressed: '#primary.10',

    selected: '#primary',
    'selected & :hover': '#primary-text',
    'selected & pressed': '#primary',

    'disabled | unavailable': '#primary.0',
    // A disabled calendar still has to show what is selected.
    'selected & (disabled | unavailable)': '#primary.30',
  },
  color: {
    '': '#dark',
    outside: '#dark.30',
    // The cell that contains today — a hint, not a selection.
    'current & !selected': '#primary-text',
    selected: '#white',
    'disabled | unavailable': '#dark.30',
    'selected & (disabled | unavailable)': '#white',
  },
  outline: {
    '': '1bw #primary-text.0',
    focused: '1bw #primary-text',
  },
  outlineOffset: 0.5,
  radius: true,
  cursor: {
    '': '$pointer',
    'disabled | unavailable': 'default',
  },
};
