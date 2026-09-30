---
"@cube-dev/ui-kit": patch
---

`ListBox`: a disabled list is no longer a Tab stop. An option shows as focused only while the list holds focus (with `shouldUseVirtualFocus`, while it is the focused key), so its highlight or ring no longer stays behind once focus leaves. A focus ring is drawn inside the option, where a neighbouring option and the scroll box can't cover or clip it. A reorderable list's drop indicator sits in the middle of the gap between two options, and the list keeps its height while an option is dragged past the last one.
