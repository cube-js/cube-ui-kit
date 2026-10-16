---
"@cube-dev/ui-kit": patch
---

`ComboBox`, `SearchComboBox` and `CommandTextArea`: while the list is open, the first click on a control outside it (a checkbox, switch, radio, text field or link) now acts on that control and closes the list, as a click on a button already did. It used to only close the list, so a checkbox stayed unchanged and a text field took no focus until a second click. Focus moves to the control, so the field settles its typed text first, as it does on Tab. A press on blank space, such as an empty part of the dialog the field sits in or the dialog's backdrop, still only closes the list and leaves the field focused with its text. `TagInput` now treats blank space in a dialog the same way; it used to move focus to the dialog and add the typed text as a tag.
