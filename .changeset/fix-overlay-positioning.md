---
"@cube-dev/ui-kit": patch
---

Fix popover positioning and premature closing in ComboBox, FilterPicker, and Picker.

- Replace `react-transition-group` with `DisplayTransition` in the overlay system
- Fix timing bug where overlay element didn't exist when `useOverlayPosition` ran, causing a flash at wrong position
- Remove manual `updatePosition` workarounds (`chainRaf`) that were unreliable race-condition fixes
- Remove `shouldUpdatePosition` timer hack from FilterPicker and Picker
- Remove `react-transition-group` dependency
