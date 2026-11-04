---
"@cube-dev/ui-kit": patch
---

A `Select`, `Picker`, `FilterPicker`, `ItemButton` or tab with actions that mounts inside a hidden container (a closed panel or tray) now reserves room for its actions once the container is shown. Before, the row kept a zero-width actions slot until its actions changed, so the caret or the actions drew over the label.
