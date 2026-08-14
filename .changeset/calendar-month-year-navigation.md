---
'@cube-dev/ui-kit': minor
---

Calendar: pick a month or a year from a list instead of paging with arrows.

- `Calendar` / `RangeCalendar` (and therefore `DatePicker`, `DateRangePicker`
  and `DateRangeSeparatedPicker`) now render the header month and year as
  buttons that open a month list and a year list. Opt out with
  `hasMonthYearNavigation={false}`.
- `MonthPicker` and `QuarterPicker` gained the same year list behind the year in
  their header.
- The period panels are now proper ARIA grids with full keyboard support: arrow
  keys roll over into the neighbouring year or decade, `PageUp`/`PageDown` page
  by year or decade, `Home`/`End` jump to the first or last selectable period,
  and `Escape` steps back one panel instead of closing the popover.
- Day and period cells mark the cell containing today with a `current` modifier,
  and periods are disabled only when the whole period falls outside
  `minValue`/`maxValue`.
- `PeriodPicker` no longer duplicates the field's label props onto its value
  text, describes its trigger with the selected value, honours `isReadOnly`, and
  truncates overlong custom `formatValue` output. Its placeholders and the new
  calendar labels are translated in all twelve locales.
- `Calendar` passed its ref through without attaching it to the DOM; it now does.
- `Popover` (every `DialogTrigger type="popover"`, so also `Select`-style
  fields, menus and the date pickers) only became keyboard-dismissable once its
  enter animation had settled, because it registered with React Aria's
  visible-overlay stack on the transition's `isOpen` rather than the trigger's.
  `Escape` pressed in the first frames after opening did nothing; it now closes
  the popover immediately.
