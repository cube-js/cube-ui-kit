---
"@cube-dev/ui-kit": minor
---

Let popover fields anchor to an element other than their own trigger. `Select`, `Picker`, `FilterPicker`, `ColorPicker`, `ColorInput`, `DatePicker`, `DateRangePicker`, `DateRangeSeparatedPicker` and `PeriodPicker` now accept `targetRef`, matching the prop `DialogTrigger` already had, so adjacent controls of different widths can line their popovers up with one shared container. The same components (except `FilterPicker`, which already had it) also accept `placement`, since anchoring to a wider container is only useful alongside control over the alignment. Both default to the current behaviour, so existing callers are unaffected.
