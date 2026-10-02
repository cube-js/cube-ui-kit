---
"@cube-dev/ui-kit": patch
---

Style overrides that a component layers over its own defaults now merge the way tasty's `styles` prop does, instead of replacing whole keys. This covers `styles` on `Disclosure` (and its group's `contentStyles`), `ButtonSplit`, `DataTable`, `ItemTable`, `Placeholder`, `Paragraph`, `Avatar`, `ActiveZone` and `DateInput`, plus `wrapperStyles` on the date pickers, `inputStyles` on `PeriodPicker`, `styles` and `headerStyles` on `CommandMenu`, `popoverStyles` on `Picker` and `FilterPicker`, `overlayStyles` on `CommandTextArea`, `closeButtonStyles` on `Tag`, `thumbStyles` and `trackStyles` on `HueSlider`, and `triggerStyles`, `optionStyles` and `headingStyles` on `Select`. A state map without a `''` key now adds states to the default map instead of discarding it, and a sub-element override keeps the default's other properties. A `null` still resets the component's own value, as before. Renders without such an override are unchanged.
