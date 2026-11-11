---
'@cube-dev/ui-kit': patch
---

**ListBox and the components built on it (FilterListBox, FilterPicker, ComboBox, Picker, SearchComboBox):** a long `emptyLabel` wraps to the list's width, in FilterPicker's list and tree mode too, instead of being cut to one line. A whole message is readable, and an action in it, such as a Retry button, stays inside the popover. Short labels look the same.
