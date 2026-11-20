---
"@cube-dev/ui-kit": patch
---

An open popover placed above or below its trigger now keeps its horizontal place while the trigger changes width, so a picker whose trigger shows its value (Picker or FilterPicker with multiple selection, a DialogTrigger around a range control) no longer slides sideways under the pointer as the user picks. The popover still follows a trigger that moves without resizing, still moves back on screen when it grows, and anchors afresh on every opening. Popovers placed beside their trigger are unchanged.
