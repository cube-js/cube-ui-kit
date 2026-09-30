---
"@cube-dev/ui-kit": minor
---

`ListBox`: a disabled list is no longer a Tab stop. An option shows as focused only while the list has focus, and never while it is disabled, so its highlight or ring no longer stays behind once focus leaves. With `shouldUseVirtualFocus` the focused key alone marks it, as before, unless the component whose input moves that key passes the new `isFocusWithin`. `FilterListBox` does, so its options show as focused only while focus is within it, and its arrow, Home and End keys skip disabled options. A focus ring is drawn inside the option, where a neighbouring option and the scroll box can't cover or clip it. A reorderable list keeps its height while an option is dragged past the last one.
