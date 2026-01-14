---
"@cube-dev/ui-kit": patch
---

Fix Dialog component to merge incoming style props instead of overwriting them. This allows FilterPicker, Picker, and ComboBox to properly pass CSS custom properties like `--overlay-min-width` via the style prop.
