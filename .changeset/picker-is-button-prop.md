---
'@cube-dev/ui-kit': minor
---

Add `isButton` prop support to `Picker`, `FilterPicker`, and `Select` components. The prop is now properly passed to their trigger components (`ItemButton` for Picker/FilterPicker, `Item` for Select), allowing control over button styling. Defaults to `false` to maintain existing behavior.

