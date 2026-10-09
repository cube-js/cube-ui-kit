---
"@cube-dev/ui-kit": minor
---

Add `dialogType` and `dialogMobileType` to Picker, FilterPicker, DatePicker, DateRangePicker, DateRangeSeparatedPicker, PeriodPicker, ColorPicker and ColorInput. Overlay presentation is independent of trigger styling. Mobile now always inherits `dialogType` unless explicitly overridden; date and color pickers therefore default to popover on mobile instead of tray. Set `dialogMobileType="tray"` to retain their previous mobile presentation. Picker and FilterPicker also provide named dialogs and an explicit dismiss button in non-popover presentations.
