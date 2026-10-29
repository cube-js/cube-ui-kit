---
"@cube-dev/ui-kit": patch
---

`DateRangePicker` and `DateRangeSeparatedPicker` no longer overflow a container too narrow for one row: the end date wraps onto a second row under the start date. `DateRangeSeparatedPicker` moves its end box to the new row, keeping the dash after the start box. `DateRangePicker` grows its box by one row, with the dash and the calendar button on the first row. Neither field gets narrower than its widest row. With room for one row, nothing changes.
