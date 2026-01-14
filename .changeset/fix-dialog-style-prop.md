---
"@cube-dev/ui-kit": patch
---

Fix Dialog component to merge incoming style props instead of overwriting them. Update FilterPicker and Picker to correctly access trigger width using `UNSAFE_getDOMNode()` and pass it to Dialog overlay via `--overlay-min-width` CSS custom property. Update Picker overlay width calculation to use `max()` function for better min-width handling.
