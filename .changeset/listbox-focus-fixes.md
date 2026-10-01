---
"@cube-dev/ui-kit": minor
---

`ListBox`: a disabled list is no longer a Tab stop. An option shows as focused only while the list has focus, and never while it is disabled, so its highlight or ring no longer stays behind once focus leaves. With `shouldUseVirtualFocus` the focused key alone marks it, as before. A component whose own input moves that key passes the new `isFocusWithin`, which then decides in either focus mode. `FilterListBox` does, so its options show as focused only while focus is within it. The option it focuses on open or after a search skips disabled options, and so do its arrow, Home and End keys. A focus ring is drawn inside the option, where a neighbouring option and the scroll box can't cover or clip it. A reorderable list keeps its height while an option is dragged past the last one.
