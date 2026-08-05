---
'@cube-dev/ui-kit': minor
---

Add period pickers — `WeekPicker`, `MonthPicker`, `QuarterPicker`, and `YearPicker` — mirroring Ant Design's `DatePicker picker="week|month|quarter|year"` feature. Each selects a whole calendar period rather than a specific day and is exposed as its own component, all sharing one internal `PeriodPicker` base.

The value is always a single `CalendarDate` (from `@internationalized/date`) snapped to the start of the period: week → first day of the week (locale-aware), month → the 1st, quarter → the 1st of the quarter's first month, year → January 1st. The field renders a compact label (`2026-W33`, `2026-08`, `2026-Q3`, `2026`), overridable via the `formatValue` prop.

```tsx
import { MonthPicker, QuarterPicker, WeekPicker, YearPicker } from '@cube-dev/ui-kit';

<MonthPicker onChange={onChange} />
<QuarterPicker onChange={onChange} minValue={min} maxValue={max} />
```

Built on the existing DatePicker chrome (`DateInputBase` + `DialogTrigger`/`Dialog`), so they inherit field labeling, validation, sizes, and the mobile tray. React Aria has no month/quarter/year/week panels, so those are custom, while the week panel reuses the React Aria day grid with an added week-number column and full-week highlight (behind a new, additive `pickerMode` on the internal `Calendar`/`CalendarGrid`, leaving existing `DatePicker`/`RangeCalendar` behavior unchanged).
