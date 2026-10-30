---
"@cube-dev/ui-kit": minor
---

**DateRangePicker:** a new `hideTrigger` prop drops the calendar button, so the field fits a narrower row. The calendar opens from the field instead: a press in it or an edit of a date opens it and leaves focus in the date being typed, and Alt+Down opens it and moves focus into it. Tabbing into the field doesn't open it. Escape, picking a range, or moving focus out of the field and the calendar closes it.

**DatePicker, DateRangePicker, DateRangeSeparatedPicker:** `inputStyles` now reaches the date input. It was declared on all three and applied on none, so `inputStyles={{ preset: 't4n' }}` can now make the dates smaller.
